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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'success', thresholds: defaultThresholds, demo: isDemoMode });
  }

  if (req.method === 'POST') {
    const incoming = req.body?.thresholds || {};
    const thresholds = { ...defaultThresholds, ...incoming };
    return res.status(200).json({
      status: 'success',
      message: 'Thresholds applied in demo mode.',
      thresholds,
      demo: true,
    });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
