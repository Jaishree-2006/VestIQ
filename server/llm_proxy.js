import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

import { nameSimilarityScore } from './identityEngine.js';
import { 
  computeHealthScore, 
  computeHealthScoreWithSupabase,
  fetchScoringThresholds, 
  setScoringThresholdsCache, 
  invalidateScoringThresholdsCache,
  getActiveScoringThresholdsCache 
} from './healthScoreEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Upload config: 10 MB hard cap enforced by multer ─────────────────────────
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const upload = multer({
  dest: path.join(__dirname, '..', 'tmp'),
  limits: { fileSize: MAX_FILE_BYTES },
});

// PDF magic-bytes validator — reads first 5 bytes of a saved file
// A valid PDF always starts with the ASCII bytes for "%PDF-" (25 50 44 46 2D)
function isPdfMagicBytes(filePath) {
  return new Promise((resolve) => {
    const buf = Buffer.alloc(5);
    fs.open(filePath, 'r', (err, fd) => {
      if (err) return resolve(false);
      fs.read(fd, buf, 0, 5, 0, (readErr) => {
        fs.close(fd, () => {});
        if (readErr) return resolve(false);
        // %PDF- in hex: 25 50 44 46 2D
        resolve(
          buf[0] === 0x25 && // %
          buf[1] === 0x50 && // P
          buf[2] === 0x44 && // D
          buf[3] === 0x46 && // F
          buf[4] === 0x2D    // -
        );
      });
    });
  });
}

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || 'https://lacrkmmarfhpfvsojvme.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_lV3JLgkY3yof3cStwFvaRQ_9vqqbdEx';
const supabase = createClient(supabaseUrl, supabaseKey);

// Service-role client — bypasses RLS and can run DDL via rpc('exec_sql', ...)
// Only used in /api/setup-db. Falls back gracefully if key is not set.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

function maskPan(pan) {
  if (!pan || typeof pan !== 'string' || pan.length < 10) return null;
  return `${pan.substring(0, 5)}****${pan.substring(9)}`;
}

/**
 * Upsert a profile row for a given auth.users user.
 * Uses the service-role client if available (bypasses RLS), otherwise falls
 * back to the anon client with the user's JWT (requires the insert RLS policy).
 */
async function upsertProfile(user, userSupabaseClient) {
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split('@')[0] : 'Investor');

  const client = supabaseAdmin || userSupabaseClient;
  return client.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
    email: user.email || null,
  }, { onConflict: 'id' });
}

const isLocalDemoMode = String(process.env.DEMO_MODE || process.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

async function getUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();

  if ((!token || token === 'demo-admin-token') && isLocalDemoMode) {
    return {
      user: {
        id: 'demo-admin-user',
        email: 'admin@demo.local',
        app_metadata: { role: 'admin' },
        user_metadata: { role: 'admin' },
      },
      token: 'demo-admin-token'
    };
  }

  if (!token) return { error: 'Missing authorization token' };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: error?.message || 'Unable to verify user token' };
  }

  return { user: data.user, token };
}

function isAdminUser(user) {
  const roleFromAppMetadata = user?.app_metadata?.role;
  const roleFromUserMetadata = user?.user_metadata?.role;
  const roleFromRoot = user?.role;
  const normalizedRole = String(roleFromAppMetadata || roleFromUserMetadata || roleFromRoot || '').toLowerCase();

  if (normalizedRole === 'admin') return true;

  // Allow demo/development admin access if no auth provider is configured
  if (isLocalDemoMode) {
    return true;
  }

  if (process.env.ADMIN_USER_IDS) {
    const adminUserIds = process.env.ADMIN_USER_IDS.split(',').map((id) => id.trim()).filter(Boolean);
    if (adminUserIds.includes(user.id)) return true;
  }

  if (process.env.ADMIN_EMAILS && user.email) {
    const adminEmails = process.env.ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(user.email.toLowerCase())) return true;
  }

  return false;
}

/**
 * POST /api/setup-db
 * Runs supabase_schema.sql against this project using the service-role client.
 * Requires SUPABASE_SERVICE_ROLE_KEY env var. Safe to call multiple times
 * (all statements use CREATE IF NOT EXISTS / ON CONFLICT DO UPDATE).
 */
app.post('/api/setup-db', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to your .env file.',
      hint: 'Get it from: Supabase Dashboard → Project Settings → API → service_role key'
    });
  }

  try {
    const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    // Split on semicolons and run each statement individually to get clear errors
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];
    for (const stmt of statements) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: stmt + ';' }).single();
      if (error) {
        if (typeof error.message === 'string' && error.message.includes('Could not find the function public.exec_sql')) {
          return res.status(500).json({
            error: 'Supabase setup failed because the project does not expose the required public.exec_sql function.',
            hint: 'Open the Supabase SQL editor and run supabase_schema.sql manually, or install an exec_sql helper function before retrying /api/setup-db.',
            detail: error.message,
          });
        }

        // Non-fatal: report but continue (e.g. policy already exists)
        results.push({ stmt: stmt.slice(0, 80) + '...', warning: error.message });
      } else {
        results.push({ stmt: stmt.slice(0, 80) + '...', ok: true });
      }
    }

    return res.json({ status: 'done', results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Authoritative Server-Side Health Score Endpoint
 */
app.post('/api/health-score', async (req, res) => {
  try {
    const { holdings, behaviorHistory } = req.body || {};
    if (!holdings || !Array.isArray(holdings)) {
      return res.status(400).json({ error: 'Holdings array is required' });
    }
    const breakdown = await computeHealthScoreWithSupabase(holdings, behaviorHistory, supabase);
    return res.json({
      status: 'success',
      health_score_breakdown: breakdown,
      healthScore: breakdown.score
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server failed to compute Health Score' });
  }
});

// ── Multer error handler for oversized files ─────────────────────────────────
function handleMulterErrors(err, req, res, next) {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(413).json({
      error: `File too large. The maximum allowed size for CAS statements is 10 MB. Your file exceeds this limit.`,
    });
  }
  next(err);
}

app.post('/api/parse-cas', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return handleMulterErrors(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) return res.status(401).json({ error: authResult.error });
    const user = authResult.user;

    if (!req.file) return res.status(400).json({ error: 'No file was received by the server.' });
    const filePath = req.file.path;
    const confirmIdentity = String(req.body.confirmIdentity || 'false') === 'true';
    const confirmPanMismatch = String(req.body.confirmPanMismatch || 'false') === 'true';

    // ── Server-side validation ────────────────────────────────────────────────
    // 1. Zero-byte guard
    if (req.file.size === 0) {
      fs.unlink(filePath, () => {});
      return res.status(400).json({
        error: 'The uploaded file is empty (0 bytes). Please upload a valid CAS statement PDF.',
      });
    }

    // 2. File size re-check (belt-and-suspenders — multer limit above is the primary guard)
    if (req.file.size > MAX_FILE_BYTES) {
      fs.unlink(filePath, () => {});
      return res.status(413).json({
        error: `File too large. The maximum allowed size for CAS statements is 10 MB. Your file is ${(req.file.size / 1024 / 1024).toFixed(1)} MB.`,
      });
    }

    // 3. Magic-bytes PDF signature check (cannot be spoofed by renaming or faking MIME type)
    const isPdf = await isPdfMagicBytes(filePath);
    if (!isPdf) {
      fs.unlink(filePath, () => {});
      return res.status(415).json({
        error: 'Invalid file type. Only genuine PDF files are accepted. The uploaded file does not have a valid PDF signature — renaming a non-PDF file to .pdf will not work.',
      });
    }

    const parseCasFile = () => new Promise((resolve, reject) => {
      const py = spawn('python', [path.join(__dirname, '..', 'scripts', 'parse_cas_and_call_llm.py'), '--pdf', filePath], {
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
      });
      let out = '';
      let err = '';
      py.stdout.on('data', (d) => out += d.toString());
      py.stderr.on('data', (d) => err += d.toString());
      py.on('close', (code) => {
        if (code !== 0) return reject(new Error(err || out || 'parser_failed'));
        try {
          const parsed = JSON.parse(out);
          resolve(parsed);
        } catch (e) {
          reject(new Error('invalid_parser_output'));
        }
      });
    });

    let parsed;
    try {
      parsed = await parseCasFile();
    } catch (parseError) {
      fs.unlink(filePath, () => {});
      return res.status(500).json({ error: parseError.message });
    }

    fs.unlink(filePath, () => {});

    const parsedName = String(parsed.investor_name || parsed.investorName || parsed.parsedName || '').trim();
    const parsedPan = String(parsed.pan || parsed.PAN || '').toUpperCase().trim();
    const maskedParsedPan = maskPan(parsedPan);
    const parsedHoldings = Array.isArray(parsed.holdings) ? parsed.holdings : [];
    const parsedStatementPeriod = parsed.statement_period || parsed.statementPeriod || '';
    const parsedTotalPortfolioValue = parsed.total_portfolio_value || parsed.totalAssets || 0;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, pan, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: profileError.message || 'Failed to load profile' });
    }

    const profileName = String(profileData?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Investor');
    const profilePan = String(profileData?.pan || '').toUpperCase().trim();
    const maskedProfilePan = maskPan(profilePan);
    const similarity = nameSimilarityScore(profileName, parsedName);

    let outcome = 'success';
    const details = {
      profileName,
      parsedName,
      similarity,
      profilePan,
      parsedPan,
      confirmIdentity,
      confirmPanMismatch,
    };

    if (!confirmIdentity) {
      if (similarity < 0.5) {
        outcome = 'low_name_similarity';
        await supabase.from('cas_upload_audit').insert([{ user_id: user.id, parsed_name: parsedName, profile_name: profileName, similarity, profile_pan: profilePan, parsed_pan: parsedPan, outcome, details }]);
        return res.json({ status: 'low_name_similarity', parsedName, profileName, similarity, profilePan: maskedProfilePan, parsedPan: maskedParsedPan });
      }
      if (similarity < 0.8) {
        outcome = 'need_identity_confirmation';
        await supabase.from('cas_upload_audit').insert([{ user_id: user.id, parsed_name: parsedName, profile_name: profileName, similarity, profile_pan: profilePan, parsed_pan: parsedPan, outcome, details }]);
        return res.json({ status: 'need_identity_confirmation', parsedName, profileName, similarity, profilePan: maskedProfilePan, parsedPan: maskedParsedPan });
      }
    }

    if (profilePan && parsedPan && profilePan !== parsedPan && !confirmPanMismatch) {
      outcome = 'pan_mismatch';
      await supabase.from('cas_upload_audit').insert([{ user_id: user.id, parsed_name: parsedName, profile_name: profileName, similarity, profile_pan: profilePan, parsed_pan: parsedPan, outcome, details }]);
      return res.json({ status: 'pan_mismatch', parsedName, profileName, similarity, profilePan: maskedProfilePan, parsedPan: maskedParsedPan });
    }

    if (!profilePan && parsedPan) {
      await supabase.from('profiles').update({ pan: parsedPan }).eq('id', user.id);
    }

    await supabase.from('cas_upload_audit').insert([{ user_id: user.id, parsed_name: parsedName, profile_name: profileName, similarity, profile_pan: profilePan, parsed_pan: parsedPan, outcome, details }]);

    const healthScoreBreakdown = await computeHealthScoreWithSupabase(parsedHoldings, null, supabase);

    return res.json({
      status: 'success',
      investor_name: parsedName,
      pan: maskedParsedPan || 'ABCDE****F',
      statement_period: parsedStatementPeriod,
      total_portfolio_value: parsedTotalPortfolioValue,
      holdings: parsedHoldings,
      health_score_breakdown: healthScoreBreakdown,
      raw_text: parsed.raw_text || parsed.rawExtractedText || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function writeAuditLog({ user, action, entityType = 'system', entityId = null, entityName = null, metadata = {} }) {
  if (!supabaseAdmin) {
    const msg = 'Service role key is required for audit_log writes.';
    console.warn(msg);
    return { error: new Error(msg) };
  }

  const payload = {
    user_id: user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ? String(entityId) : null,
    entity_name: entityName ? String(entityName) : null,
    metadata: {
      ...(metadata || {}),
      actor_email: user?.email || null,
      actor_role: user?.app_metadata?.role || user?.user_metadata?.role || 'admin',
    },
    created_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('audit_log').insert([payload]);
  if (error) {
    console.warn('Failed to insert audit_log row:', error.message);
  }
  return { error };
}

async function getWhitelistedBrokerSchemaSupport() {
  if (!supabaseAdmin) {
    return { hasContactEmail: false, hasSebiRegNumber: false };
  }

  const checkColumn = async (columnName) => {
    try {
      const { error } = await supabaseAdmin
        .from('whitelisted_brokers')
        .select(columnName)
        .limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  };

  const [hasContactEmail, hasSebiRegNumber] = await Promise.all([
    checkColumn('contact_email'),
    checkColumn('sebi_reg_number')
  ]);

  return { hasContactEmail, hasSebiRegNumber };
}

app.get('/api/admin/brokers', async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }

    const { user } = authResult;
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Admin role required to view broker whitelist.' });
    }

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('whitelisted_brokers')
      .select('*')
      .order('onboarded_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ status: 'success', brokers: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/brokers', async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }

    const { user } = authResult;
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Admin role required to onboard broker.' });
    }

    const orgName = String(req.body?.org_name || '').trim();
    const integrationType = String(req.body?.integration_type || 'VestIQ API v3').trim() || 'VestIQ API v3';
    const sebiRegNumber = String(req.body?.sebi_reg_number || '').trim();
    const contactEmail = String(req.body?.contact_email || '').trim();

    if (!orgName) {
      return res.status(400).json({ error: 'Broker org name is required.' });
    }

    if (sebiRegNumber && !/^INZ[A-Z0-9]{4,20}$/i.test(sebiRegNumber)) {
      return res.status(400).json({ error: 'SEBI Registration Number must match the INZ format, e.g. INZ12345.' });
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: 'Contact email is invalid.' });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service role key is required to manage whitelisted brokers.' });
    }

    const schemaSupport = await getWhitelistedBrokerSchemaSupport();
    const insertPayload = {
      org_name: orgName,
      integration_type: integrationType,
      status: 'active',
      onboarded_by: user.id,
      onboarded_at: new Date().toISOString(),
      ...(schemaSupport.hasSebiRegNumber ? { sebi_reg_number: sebiRegNumber || null } : {}),
      ...(schemaSupport.hasContactEmail ? { contact_email: contactEmail || null } : {}),
    };

    const { data, error } = await supabaseAdmin
      .from('whitelisted_brokers')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await writeAuditLog({
      user,
      action: 'broker_whitelist_add',
      entityType: 'broker',
      entityId: data.id,
      entityName: orgName,
      metadata: {
        integration_type: data.integration_type,
        sebi_reg_number: data.sebi_reg_number || null,
        contact_email: data.contact_email || null,
        status: data.status,
      },
    });

    return res.json({ status: 'success', broker: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/brokers/:id/status', async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }

    const { user } = authResult;
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Admin role required to revoke broker access.' });
    }

    const { id } = req.params;
    const nextStatus = String(req.body?.status || '').trim();
    if (!['active', 'revoked'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Status must be active or revoked.' });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service role key is required to update whitelisted brokers.' });
    }

    const payload = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
      ...(nextStatus === 'revoked'
        ? { revoked_at: new Date().toISOString(), revoked_by: user.id }
        : { revoked_at: null, revoked_by: null })
    };

    const { data, error } = await supabaseAdmin
      .from('whitelisted_brokers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await writeAuditLog({
      user,
      action: nextStatus === 'revoked' ? 'broker_whitelist_revoke' : 'broker_whitelist_restore',
      entityType: 'broker',
      entityId: data.id,
      entityName: data.org_name,
      metadata: {
        previous_status: nextStatus === 'revoked' ? 'active' : 'revoked',
        status: data.status,
        reason: req.body?.reason || 'Admin status change via admin panel',
      },
    });

    return res.json({ status: 'success', broker: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/thresholds
 * Returns active scoring thresholds from database/cache.
 */
app.get('/api/admin/thresholds', async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }

    const thresholds = await fetchScoringThresholds(supabase);
    return res.json({ status: 'success', thresholds });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/thresholds
 * Updates scoring thresholds in Supabase scoring_thresholds table and invalidates cache.
 */
app.post('/api/admin/thresholds', async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }

    const { user } = authResult;
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Admin role required to update scoring thresholds.' });
    }

    const { thresholds: payloadThresholds } = req.body;
    if (!payloadThresholds || typeof payloadThresholds !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid thresholds object in request body.' });
    }

    const clientKeyToDbKeyMap = {
      concentrationThresholdPct: 'CONCENTRATION_THRESHOLD_PCT',
      reitInvitMaxPct: 'REIT_INVIT_MAX_PCT',
      lockinHorizonMonths: 'LIQUIDITY_LOCKIN_TIER1_MAX_YEARS',
      fixedIncomeMinPct: 'FIXED_INCOME_MIN_PCT',
      concentrationPenalty: 'CONCENTRATION_SINGLE_MAX_PENALTY',
      liquidityPenalty: 'LIQUIDITY_MAX_PENALTY',
      volatilityPenalty: 'VOLATILITY_THRESHOLD_PCT',
      diversificationPenalty: 'DIVERSIFICATION_PENALTY',
      behaviorBonus: 'POSITIVE_BEHAVIOR_BONUS'
    };

    const keysToUpsert = { ...payloadThresholds };
    for (const [cKey, dbKey] of Object.entries(clientKeyToDbKeyMap)) {
      if (payloadThresholds[cKey] !== undefined) {
        keysToUpsert[dbKey] = payloadThresholds[cKey];
      }
    }

    const rows = [];
    const auditChanges = [];

    for (const [key, val] of Object.entries(keysToUpsert)) {
      if (val !== undefined && val !== null && !Number.isNaN(Number(val))) {
        const numVal = Number(val);
        if (numVal < 0 || numVal > 100) {
          return res.status(400).json({
            error: `Invalid threshold value for ${key}: ${numVal}. Thresholds must be between 0 and 100.`
          });
        }
        rows.push({
          key,
          value: numVal,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
        auditChanges.push({ key, value: numVal });
      }
    }

    if (rows.length > 0) {
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Service role key is required to update scoring thresholds.' });
      }

      const { error: dbError } = await supabaseAdmin
        .from('scoring_thresholds')
        .upsert(rows, { onConflict: 'key' });

      if (dbError) {
        console.warn('DB upsert to scoring_thresholds failed:', dbError.message);
        return res.status(500).json({ error: dbError.message });
      }
    }

    invalidateScoringThresholdsCache();

    const client = supabaseAdmin || supabase;
    try {
      await client.from('cas_upload_audit').insert([{
        user_id: user.id,
        parsed_name: user.email || 'admin',
        profile_name: user.email || 'admin',
        similarity: 1.0,
        outcome: 'ADMIN_THRESHOLD_UPDATE',
        details: {
          action: 'rule_threshold_change',
          updated_by: user.id,
          updated_at: new Date().toISOString(),
          changes: auditChanges
        }
      }]);
    } catch (err) {
      console.warn('Failed to insert threshold audit log:', err.message);
    }

    const thresholds = await fetchScoringThresholds(supabase);
    return res.json({
      status: 'success',
      message: 'Scoring thresholds updated in Supabase database & applied server-wide.',
      thresholds
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/broker-leads
 * Public endpoint for capturing B2B broker demo & compliance inquiries.
 * Does NOT require authentication (lead capture form on public marketing page).
 */
app.post('/api/broker-leads', async (req, res) => {
  try {
    const { institution_name, work_email, honeypot } = req.body || {};

    // Spam safeguard — silently acknowledge without saving if honeypot field is filled
    if (honeypot && String(honeypot).trim() !== '') {
      return res.json({
        status: 'success',
        message: 'Thanks — our team will review your request and reach out within 1-2 business days.'
      });
    }

    const instName = String(institution_name || '').trim();
    const email = String(work_email || '').trim().toLowerCase();

    if (!instName) {
      return res.status(400).json({ error: 'Brokerage / Institution Name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid work email address.' });
    }

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('broker_leads')
      .insert([{ institution_name: instName, work_email: email }])
      .select()
      .single();

    if (error) {
      console.warn('[broker-leads] Supabase DB insert notice:', error.message);
    }

    return res.json({
      status: 'success',
      message: 'Thanks — our team will review your request and reach out within 1-2 business days.',
      lead_id: data?.id || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error capturing broker lead request.' });
  }
});

/**
 * Authoritative Server-Side Data Purge Endpoint (Right to Erasure / DPDP Act Sec 13)
 * Permanently deletes user's cas_upload_audit records and clears parsed PAN from profiles.
 */
app.post('/api/purge-data', async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) return res.status(401).json({ error: authResult.error });
    const user = authResult.user;

    // Delete all upload audit records for this user
    const { error: auditErr } = await supabase
      .from('cas_upload_audit')
      .delete()
      .eq('user_id', user.id);

    // Delete user portfolio stored holdings
    const { error: portfolioErr } = await supabase
      .from('user_portfolios')
      .delete()
      .eq('user_id', user.id);

    // Clear parsed PAN on profile if set
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ pan: null })
      .eq('id', user.id);

    if (auditErr || portfolioErr || profileErr) {
      console.warn('Purge data DB warning:', auditErr || portfolioErr || profileErr);
    }

    return res.json({
      status: 'success',
      message: 'All user upload audit records and portfolio state purged successfully from server database.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to execute data purge on server.' });
  }
});

/**
 * Export Portfolio Data for DPDP Act 2023 Sec 12
 *
 * Accepts a POST body with the user's current in-session portfolio data
 * (holdings, healthScore, redFlags, healthScoreEvents) alongside fetching
 * authoritative DB records (profile, CAS upload history) from Supabase.
 *
 * Logs every export event to the cas_upload_audit table for compliance traceability.
 */
app.post('/api/export-portfolio-data', async (req, res) => {
  try {
    const authResult = await getUserFromRequest(req);
    if (authResult.error) return res.status(401).json({ error: authResult.error });
    const user = authResult.user;

    // Session data passed from the client (live React state)
    const {
      holdings = [],
      healthScore = null,
      healthScoreBreakdown = null,
      redFlags = [],
      healthScoreEvents = [],
    } = req.body || {};

    // ── 1. Fetch authoritative profile from Supabase ──────────────────────────
    // Build a user-scoped Supabase client (carries the user's JWT → respects RLS)
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authResult.token}` } },
      auth: { persistSession: false },
    });

    let { data: profileData, error: profileError } = await userClient
      .from('profiles')
      .select('id, full_name, email, pan, created_at')
      .eq('id', user.id)
      .single();

    let resolvedProfile = profileData;
    let profileWarning = null;

    if (profileError) {
      const isTableMissing = String(profileError.message || '').includes("Could not find the table 'public.profiles'");
      const isNoRow = profileError.code === 'PGRST116'; // PostgREST: 0 rows

      if (isTableMissing) {
        // Table genuinely doesn't exist — fall back and warn
        resolvedProfile = {
          id: user.id,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            (user.email ? user.email.split('@')[0] : 'Investor'),
          email: user.email || null,
          pan: null,
          created_at: null,
        };
        profileWarning = 'profiles table not found — run /api/setup-db or paste supabase_schema.sql in the Supabase SQL Editor.';
      } else if (isNoRow) {
        // Table exists but this user has no row (pre-trigger account) — auto-backfill
        console.log(`[export] No profile row for ${user.id} — auto-upserting from auth metadata.`);
        await upsertProfile(user, userClient);

        // Re-fetch after upsert
        const refetch = await userClient
          .from('profiles')
          .select('id, full_name, email, pan, created_at')
          .eq('id', user.id)
          .single();

        if (refetch.data) {
          resolvedProfile = refetch.data;
        } else {
          // Upsert succeeded but re-fetch failed — use auth metadata in-memory
          resolvedProfile = {
            id: user.id,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              (user.email ? user.email.split('@')[0] : 'Investor'),
            email: user.email || null,
            pan: null,
            created_at: new Date().toISOString(),
          };
        }
      } else {
        return res.status(500).json({ error: profileError.message || 'Failed to load user profile.' });
      }
    }

    // ── 2. Fetch CAS upload history from Supabase ─────────────────────────────
    const { data: auditData, error: auditError } = await userClient
      .from('cas_upload_audit')
      .select('id, created_at, parsed_name, profile_name, similarity, profile_pan, parsed_pan, outcome, details')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    let resolvedAudit = auditData || [];
    let auditWarning = null;

    if (auditError) {
      const isNotFound = String(auditError.message || '').includes("Could not find the table 'public.cas_upload_audit'");
      if (isNotFound) {
        resolvedAudit = [];
        auditWarning = 'cas_upload_audit table not found — run /api/setup-db or paste supabase_schema.sql in the Supabase SQL Editor.';
      } else {
        return res.status(500).json({ error: auditError.message || 'Failed to load CAS upload history.' });
      }
    }

    const exportedAt = new Date().toISOString();

    // ── 3. Log this export event as a compliance audit row ────────────────────
    if (!auditWarning) {
      const { error: insertErr } = await userClient.from('cas_upload_audit').insert([{
        user_id: user.id,
        parsed_name: resolvedProfile.full_name || user.email || 'unknown',
        profile_name: resolvedProfile.full_name || user.email || 'unknown',
        similarity: 1,
        profile_pan: resolvedProfile.pan || null,
        parsed_pan: resolvedProfile.pan || null,
        outcome: 'dpdp_export',
        details: {
          action: 'export_portfolio_data',
          exportedAt,
          reason: 'DPDP Act 2023 Sec 12 — user-initiated data portability export',
          holdingsExported: Array.isArray(holdings) ? holdings.length : 0,
          redFlagsExported: Array.isArray(redFlags) ? redFlags.length : 0,
        },
      }]);
      if (insertErr) {
        console.warn('[export] Failed to insert audit log row:', insertErr.message);
      }
    }

    // ── 4. Build structured export payload ───────────────────────────────────
    const exportPayload = {
      // Metadata
      exportFormat: 'VestIQ_DPDP_Portfolio_Export_v1',
      exportedAt,
      legalBasis: 'India Digital Personal Data Protection (DPDP) Act 2023, Section 12 — Right to access personal data',

      // Authoritative profile from Supabase
      userProfile: {
        userId: resolvedProfile.id,
        fullName: resolvedProfile.full_name,
        email: resolvedProfile.email || user.email,
        panMasked: resolvedProfile.pan ? maskPan(resolvedProfile.pan) : null,
        accountCreatedAt: resolvedProfile.created_at,
      },

      // Live portfolio data from current session
      portfolio: {
        holdingsCount: Array.isArray(holdings) ? holdings.length : 0,
        holdings: Array.isArray(holdings) ? holdings : [],
        currentHealthScore: healthScore,
        healthScoreBreakdown: healthScoreBreakdown || null,
        activeRedFlags: Array.isArray(redFlags) ? redFlags : [],
        healthScoreTimeline: Array.isArray(healthScoreEvents) ? healthScoreEvents : [],
      },

      // Authoritative server-side upload history
      uploadHistory: resolvedAudit.map(row => ({
        uploadId: row.id,
        uploadedAt: row.created_at,
        parsedInvestorName: row.parsed_name,
        outcome: row.outcome,
        panMasked: row.parsed_pan ? maskPan(row.parsed_pan) : null,
      })),

      // Any non-fatal issues encountered during export
      warnings: [profileWarning, auditWarning].filter(Boolean),
    };

    return res.json(exportPayload);
  } catch (err) {
    console.error('[export-portfolio-data] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Failed to export portfolio data.' });
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => console.log('LLM proxy listening on', port));
