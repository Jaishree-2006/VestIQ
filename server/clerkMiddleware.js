// Express middleware template to verify Clerk session tokens on protected endpoints
// Requires: npm install @clerk/backend express

const { Clerk } = require('@clerk/backend');

const clerk = new Clerk({ apiKey: process.env.CLERK_SECRET_KEY });

module.exports = async function verifyClerkSession(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const session = await clerk.sessions.verifySessionToken(token);
    if (!session) return res.status(401).json({ error: 'Invalid session' });

    // attach userId / session to request for downstream handlers
    req.clerk = { session };
    next();
  } catch (err) {
    console.error('Clerk session verification failed', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
