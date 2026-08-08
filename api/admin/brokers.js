export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : authHeader.trim();
  const isDemoMode = token === 'demo-admin-token' || String(process.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

  if (!isDemoMode && !token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'success',
      brokers: isDemoMode ? [
        {
          id: 'demo-broker-1',
          org_name: 'VestIQ Demo Brokerage',
          integration_type: 'VestIQ API v3',
          sebi_reg_number: 'INZ12345',
          contact_email: 'ops@demo.local',
          status: 'active',
          onboarded_at: new Date().toISOString(),
          onboarded_by: 'demo-admin-user',
        }
      ] : [],
      demo: isDemoMode,
    });
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    const orgName = String(payload.org_name || '').trim();
    const integrationType = String(payload.integration_type || 'VestIQ API v3').trim() || 'VestIQ API v3';
    const sebiRegNumber = String(payload.sebi_reg_number || '').trim();
    const contactEmail = String(payload.contact_email || '').trim();

    if (!orgName) {
      return res.status(400).json({ error: 'Broker org name is required.' });
    }

    if (sebiRegNumber && !/^INZ[A-Z0-9]{4,20}$/i.test(sebiRegNumber)) {
      return res.status(400).json({ error: 'SEBI Registration Number must match the INZ format, e.g. INZ12345.' });
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: 'Contact email is invalid.' });
    }

    return res.status(200).json({
      status: 'success',
      broker: {
        id: `demo-broker-${Date.now()}`,
        org_name: orgName,
        integration_type: integrationType,
        sebi_reg_number: sebiRegNumber || null,
        contact_email: contactEmail || null,
        status: 'active',
        onboarded_at: new Date().toISOString(),
        onboarded_by: 'demo-admin-user',
      },
      demo: true,
    });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
