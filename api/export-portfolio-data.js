const defaultThresholds = {
  concentrationThresholdPct: 25,
  reitInvitMaxPct: 35,
  lockinHorizonMonths: 18,
  fixedIncomeMinPct: 20,
  concentrationPenalty: 12,
  liquidityPenalty: 10,
  volatilityPenalty: 8,
  diversificationPenalty: 6,
  behaviorBonus: 8,
};

function maskPan(pan) {
  if (!pan || typeof pan !== 'string') return null;
  const normalized = pan.trim();
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 2)}${'*'.repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-2)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : authHeader.trim();
  const isDemoMode = token === 'demo-admin-token' || token === 'demo-user-token' || String(process.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

  if (!isDemoMode && !token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  const body = req.body || {};
  const holdings = Array.isArray(body.holdings) ? body.holdings : [];
  const redFlags = Array.isArray(body.redFlags) ? body.redFlags : [];
  const healthScore = body.healthScore ?? 82;
  const healthScoreEvents = Array.isArray(body.healthScoreEvents) ? body.healthScoreEvents : [];
  const healthScoreBreakdown = body.healthScoreBreakdown || { score: healthScore, thresholds: defaultThresholds };

  const exportedAt = new Date().toISOString();
  const profileName = body.userProfile?.fullName || 'Demo Investor';
  const email = body.userProfile?.email || 'investor@demo.local';

  return res.status(200).json({
    exportFormat: 'VestIQ_DPDP_Portfolio_Export_v1',
    exportedAt,
    legalBasis: 'India Digital Personal Data Protection (DPDP) Act 2023, Section 12 — Right to access personal data',
    userProfile: {
      userId: 'demo-user',
      fullName: profileName,
      email,
      panMasked: maskPan(body.userProfile?.pan || 'ABCDE1234F'),
      accountCreatedAt: new Date().toISOString(),
    },
    portfolio: {
      holdingsCount: holdings.length,
      holdings,
      currentHealthScore: healthScore,
      healthScoreBreakdown,
      activeRedFlags: redFlags,
      healthScoreTimeline: healthScoreEvents,
    },
    uploadHistory: [],
    warnings: isDemoMode ? ['Demo export mode enabled. No live Supabase profile or audit data was loaded.'] : [],
    demo: true,
  });
}
