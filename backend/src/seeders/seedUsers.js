require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, syncDatabase } = require('../models');

const seedUsers = async () => {
  try {
    await syncDatabase();

    const users = [
      {
        username: process.env.USER1_USERNAME || 'user1',
        password: process.env.USER1_PASSWORD || 'password1',
      },
      {
        username: process.env.USER2_USERNAME || 'user2',
        password: process.env.USER2_PASSWORD || 'password2',
      },
    ];

    for (const u of users) {
      const exists = await User.findOne({ where: { username: u.username } });
      if (!exists) {
        const passwordHash = await bcrypt.hash(u.password, 12);
        await User.create({ username: u.username, passwordHash });
        console.log(`✅ Created user: ${u.username}`);
      } else {
        console.log(`⚠️  User already exists: ${u.username}`);
      }
    }

    console.log('✅ Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedUsers();
