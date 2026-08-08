export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : authHeader.trim();
  const isDemoMode = token === 'demo-admin-token' || String(process.env.VITE_DEMO_MODE || process.env.DEMO_MODE || '').toLowerCase() === 'true';

  if (!isDemoMode && !token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const nextStatus = String(req.body?.status || '').trim();
  if (!['active', 'revoked'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Status must be active or revoked.' });
  }

  return res.status(200).json({
    status: 'success',
    broker: {
      id: req.query.id,
      org_name: 'Demo Brokerage',
      integration_type: 'VestIQ API v3',
      status: nextStatus,
      onboarded_at: new Date().toISOString(),
      revoked_at: nextStatus === 'revoked' ? new Date().toISOString() : null,
      revoked_by: nextStatus === 'revoked' ? 'demo-admin-user' : null,
    },
    demo: true,
  });
}
