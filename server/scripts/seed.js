import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { generateUserId } from '../src/utils/ids.js';
import bcrypt from 'bcrypt';

async function seed() {
  await connectDB();

  try {
    const passwordHash = await bcrypt.hash('abhishekpandey', 10);
    const passwordHash2 = await bcrypt.hash('akash', 10);

    let user = await User.findOne({ email: 'demo@rebound.test' });
    if (!user) {
      user = await User.create({
        userId: generateUserId(),
        fullName: 'Abhishek Pandey',
        email: 'abhishekpandey@gmail.com',
        passwordHash,
        phone: '+919999999999',
        authProvider: 'email',
        isVerified: true,
      });
      console.log('Created demo user 1 (Abhishek)');
    }

    let user2 = await User.findOne({ email: 'akash@gmail.com' });
    if (!user2) {
      user2 = await User.create({
        userId: generateUserId(),
        fullName: 'Akash',
        email: 'akash@gmail.com',
        passwordHash: passwordHash2,
        phone: '+918888888888',
        authProvider: 'email',
        isVerified: true,
      });
      console.log('Created demo user 2 (Akash)');
    }

    const centerLat = 20.2961;
    const centerLng = 85.8245;

    const existingCount = await Item.countDocuments();
    if (existingCount === 0) {
      const demoItems = [
        {
          type: 'lost',
          title: 'Black leather wallet',
          category: 'Wallet',
          description: 'Lost near main campus gate. Contains ID and cards.',
        },
        {
          type: 'found',
          title: 'Blue backpack with stickers',
          category: 'Others',
          description: 'Found near cafeteria seating area.',
        },
        {
          type: 'lost',
          title: 'Android phone with cracked screen',
          category: 'Electronics',
          description: 'Phone went missing around the library.',
        },
        {
          type: 'found',
          title: 'Set of house keys on keychain',
          category: 'Others',
          description: 'Found near parking zone B5.',
        },
      ];

      const withGeo = demoItems.map((base, idx) => {
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;
        return {
          ...base,
          location: {
            type: 'Point',
            coordinates: [centerLng + lngOffset, centerLat + latOffset],
            address: 'Bhubaneswar, Odisha',
          },
          createdBy: user._id,
        };
      });

      await Item.insertMany(withGeo);
      console.log('Seeded demo user and items around Bhubaneswar.');
    } else {
      console.log('Items already exist, skipping item seed.');
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();