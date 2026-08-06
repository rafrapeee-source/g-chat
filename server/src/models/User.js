const mongoose = require('mongoose');

const COLORS = ['#1a73e8', '#d93025', '#188038', '#f9ab00', '#9334e6', '#e8710a', '#12b5cb', '#e52592'];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true },
    avatarColor: { type: String, default: '' },
    status: { type: String, enum: ['online', 'away', 'offline'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('validate', function setColor(next) {
  if (!this.avatarColor && this.name) {
    this.avatarColor = colorForName(this.name);
  }
  next();
});

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarColor: this.avatarColor,
    status: this.status,
    lastSeen: this.lastSeen,
  };
};

module.exports = mongoose.model('User', userSchema);
