const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Space = require('../models/Space');
const Message = require('../models/Message');

// Tracks how many active sockets a user has, so we only mark them offline
// once their LAST connection drops (they might have multiple tabs open).
const activeConnectionsByUser = new Map();

function initSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing auth token'));

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    const count = (activeConnectionsByUser.get(userId) || 0) + 1;
    activeConnectionsByUser.set(userId, count);

    // Join a personal room (for direct notifications) and every space room they belong to
    socket.join(`user:${userId}`);
    const spaces = await Space.find({ 'members.user': userId }).select('_id');
    spaces.forEach((s) => socket.join(`space:${s._id}`));

    if (count === 1) {
      await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });
      broadcastPresence(io, userId, 'online');
    }

    socket.on('space:join', async (spaceId) => {
      const space = await Space.findById(spaceId);
      if (space && space.members.some((m) => String(m.user) === userId)) {
        socket.join(`space:${spaceId}`);
      }
    });

    socket.on('message:send', async ({ spaceId, text }, ack) => {
      try {
        if (!text || !text.trim()) {
          return ack && ack({ error: 'Message cannot be empty' });
        }
        const space = await Space.findById(spaceId);
        if (!space || !space.members.some((m) => String(m.user) === userId)) {
          return ack && ack({ error: 'You are not a member of this space' });
        }

        const message = await Message.create({
          space: spaceId,
          sender: userId,
          text: text.trim().slice(0, 4000),
        });

        space.lastMessageAt = message.createdAt;
        space.lastMessagePreview = message.text.slice(0, 200);
        await space.save();

        const payload = {
          id: message._id,
          space: spaceId,
          text: message.text,
          createdAt: message.createdAt,
          sender: { id: socket.user._id, name: socket.user.name, avatarColor: socket.user.avatarColor },
        };

        io.to(`space:${spaceId}`).emit('message:new', payload);
        ack && ack({ ok: true, message: payload });
      } catch (err) {
        console.error('message:send error:', err);
        ack && ack({ error: 'Could not send message' });
      }
    });

    socket.on('typing:start', ({ spaceId }) => {
      socket.to(`space:${spaceId}`).emit('typing:update', {
        spaceId,
        userId,
        name: socket.user.name,
        typing: true,
      });
    });

    socket.on('typing:stop', ({ spaceId }) => {
      socket.to(`space:${spaceId}`).emit('typing:update', {
        spaceId,
        userId,
        name: socket.user.name,
        typing: false,
      });
    });

    socket.on('disconnect', async () => {
      const remaining = (activeConnectionsByUser.get(userId) || 1) - 1;
      if (remaining <= 0) {
        activeConnectionsByUser.delete(userId);
        await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
        broadcastPresence(io, userId, 'offline');
      } else {
        activeConnectionsByUser.set(userId, remaining);
      }
    });
  });
}

function broadcastPresence(io, userId, status) {
  io.emit('presence:update', { userId, status, lastSeen: new Date() });
}

module.exports = { initSockets };
