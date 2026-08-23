// Express route templates for Clerk-backed user updates and verification.
// Requires: npm install express @clerk/backend

const express = require('express');
const bodyParser = require('body-parser');

// This file is a template — populate CLERK_SECRET_KEY in env before running.
let Clerk;
try {
  Clerk = require('@clerk/backend');
} catch (e) {
  console.warn('Install @clerk/backend to enable server-side Clerk APIs');
}

const router = express.Router();
router.use(bodyParser.json());

// Middleware to verify session token sent from client (Bearer <token>)
router.use(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth' });
  const token = auth.replace('Bearer ', '');
  if (!Clerk) return res.status(500).json({ error: '@clerk/backend not installed' });
  try {
    const authRes = await Clerk.sessions.verifySessionToken({ sessionToken: token, apiKey: process.env.CLERK_SECRET_KEY });
    // attach userId for handlers
    req.clerkUserId = authRes?.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid session token' });
  }
});

// Set public metadata (investmentGoal, timeline)
router.post('/set-public-metadata', async (req, res) => {
  try {
    const userId = req.clerkUserId;
    const { investmentGoal, timeline } = req.body;
    if (!Clerk) throw new Error('@clerk/backend missing');
    const users = Clerk.users;
    await users.updateUser(userId, { publicMetadata: { investmentGoal, timeline } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Update profile fields (name, phone)
router.post('/update-profile', async (req, res) => {
  try {
    const userId = req.clerkUserId;
    const { fullName, phone, investmentGoal, timeline } = req.body;
    if (!Clerk) throw new Error('@clerk/backend missing');
    const users = Clerk.users;
    await users.updateUser(userId, { firstName: fullName, phoneNumbers: phone ? [phone] : undefined, publicMetadata: { investmentGoal, timeline } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Delete user data template
router.post('/delete-user-data', async (req, res) => {
  try {
    const userId = req.clerkUserId;
    // Implement deletion of parsed CAS, holdings, events tied to this user in your DB.
    // This file is a template: replace with actual DB delete logic.
    // Example: await db.deleteUserData(userId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

module.exports = router;
