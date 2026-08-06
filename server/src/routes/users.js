const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Search users by name/email, excluding yourself - used to start a new DM
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = { _id: { $ne: req.user._id } };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).limit(25).sort({ name: 1 });
    res.json({ users: users.map((u) => u.toPublicJSON()) });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ error: 'Could not search users' });
  }
});

module.exports = router;
