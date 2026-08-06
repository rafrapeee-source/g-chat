const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    isDirect: { type: Boolean, default: false }, // false = Space, true = 1:1 DM
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);

spaceSchema.index({ 'members.user': 1 });
spaceSchema.index({ isDirect: 1, 'members.user': 1 });

module.exports = mongoose.model('Space', spaceSchema);
