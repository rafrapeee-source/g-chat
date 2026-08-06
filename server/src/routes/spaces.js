const express = require('express');
const mongoose = require('mongoose');
const Space = require('../models/Space');
const Message = require('../models/Message');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function serializeSpace(space, forUserId) {
  const members = space.members.map((m) => ({
    user: m.user._id ? m.user._id : m.user,
    role: m.role,
    name: m.user.name,
    avatarColor: m.user.avatarColor,
    status: m.user.status,
  }));

  let displayName = space.name;
  let dmPartner = null;

  if (space.isDirect) {
    const other = space.members.find((m) => String(m.user._id || m.user) !== String(forUserId));
    if (other && other.user.name) {
      displayName = other.user.name;
      dmPartner = { id: other.user._id, name: other.user.name, avatarColor: other.user.avatarColor, status: other.user.status };
    }
  }

  return {
    id: space._id,
    name: displayName,
    rawName: space.name,
    description: space.description,
    isDirect: space.isDirect,
    dmPartner,
    members,
    memberCount: members.length,
    createdBy: space.createdBy,
    lastMessageAt: space.lastMessageAt,
    lastMessagePreview: space.lastMessagePreview,
    createdAt: space.createdAt,
  };
}

// List all spaces/DMs the current user belongs to, most recently active first
router.get('/', requireAuth, async (req, res) => {
  try {
    const spaces = await Space.find({ 'members.user': req.user._id })
      .populate('members.user', 'name avatarColor status email')
      .sort({ lastMessageAt: -1 });

    res.json({ spaces: spaces.map((s) => serializeSpace(s, req.user._id)) });
  } catch (err) {
    console.error('List spaces error:', err);
    res.status(500).json({ error: 'Could not load your spaces' });
  }
});

// Create a new group Space
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Space name is required' });
    }

    const ids = Array.isArray(memberIds) ? memberIds.filter((id) => mongoose.isValidObjectId(id)) : [];
    const uniqueIds = [...new Set([req.user._id.toString(), ...ids])];

    const validUsers = await User.find({ _id: { $in: uniqueIds } });
    if (validUsers.length !== uniqueIds.length) {
      return res.status(400).json({ error: 'One or more selected members could not be found' });
    }

    const members = uniqueIds.map((id) => ({
      user: id,
      role: String(id) === String(req.user._id) ? 'owner' : 'member',
    }));

    const space = await Space.create({
      name: name.trim(),
      description: (description || '').trim(),
      isDirect: false,
      createdBy: req.user._id,
      members,
    });

    await space.populate('members.user', 'name avatarColor status email');
    res.status(201).json({ space: serializeSpace(space, req.user._id) });
  } catch (err) {
    console.error('Create space error:', err);
    res.status(500).json({ error: 'Could not create the space' });
  }
});

// Start (or fetch existing) 1:1 direct message with another user
router.post('/dm', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'A valid userId is required' });
    }
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ error: "You can't start a DM with yourself" });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let space = await Space.findOne({
      isDirect: true,
      'members.user': { $all: [req.user._id, userId] },
      members: { $size: 2 },
    }).populate('members.user', 'name avatarColor status email');

    if (!space) {
      space = await Space.create({
        name: `${req.user.name}, ${otherUser.name}`,
        isDirect: true,
        createdBy: req.user._id,
        members: [
          { user: req.user._id, role: 'owner' },
          { user: userId, role: 'owner' },
        ],
      });
      await space.populate('members.user', 'name avatarColor status email');
    }

    res.status(201).json({ space: serializeSpace(space, req.user._id) });
  } catch (err) {
    console.error('Create DM error:', err);
    res.status(500).json({ error: 'Could not start the direct message' });
  }
});

// Add a member to an existing space
router.post('/:id/members', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const space = await Space.findById(req.params.id);

    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (space.isDirect) return res.status(400).json({ error: 'Cannot add members to a direct message' });

    const isMember = space.members.some((m) => String(m.user) === String(req.user._id));
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this space' });

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'A valid userId is required' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const alreadyIn = space.members.some((m) => String(m.user) === String(userId));
    if (!alreadyIn) {
      space.members.push({ user: userId, role: 'member' });
      await space.save();
    }

    await space.populate('members.user', 'name avatarColor status email');
    res.json({ space: serializeSpace(space, req.user._id) });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Could not add member' });
  }
});

// Get message history for a space (paginated, most recent first, then reversed to chronological)
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const isMember = space.members.some((m) => String(m.user) === String(req.user._id));
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this space' });

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const before = req.query.before ? new Date(req.query.before) : new Date();

    const messages = await Message.find({ space: space._id, createdAt: { $lt: before } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name avatarColor');

    const chronological = messages.reverse().map((m) => ({
      id: m._id,
      space: m.space,
      text: m.deleted ? '' : m.text,
      deleted: m.deleted,
      editedAt: m.editedAt,
      createdAt: m.createdAt,
      sender: { id: m.sender._id, name: m.sender.name, avatarColor: m.sender.avatarColor },
    }));

    res.json({ messages: chronological, hasMore: messages.length === limit });
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

module.exports = router;
