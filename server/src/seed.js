// Optional helper: creates a few demo accounts so you can test DMs/Spaces
// without manually signing up multiple users. Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const mongoose = require('mongoose');

const DEMO_USERS = [
  { name: 'Ada Lovelace', email: 'ada@example.com' },
  { name: 'Grace Hopper', email: 'grace@example.com' },
  { name: 'Alan Turing', email: 'alan@example.com' },
];
const DEMO_PASSWORD = 'password123';

async function seed() {
  await connectDB();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`Skipping ${u.email} (already exists)`);
      continue;
    }
    await User.create({ ...u, passwordHash });
    console.log(`Created ${u.name} <${u.email}>`);
  }

  console.log(`\nDone. All demo accounts use the password: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
