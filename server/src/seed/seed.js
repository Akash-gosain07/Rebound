import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { generateUserId, generateItemId } from '../services/idService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rebound';

async function run() {
  await mongoose.connect(MONGODB_URI);

  await User.deleteMany({});
  await Item.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  const [john, alice, admin] = await User.create([
    {
      userId: generateUserId(),
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      trustScore: 3
    },
    {
      userId: generateUserId(),
      name: 'Alice Campus',
      email: 'alice@example.com',
      passwordHash,
      trustScore: 4
    },
    {
      userId: generateUserId(),
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      isAdmin: true,
      trustScore: 5
    }
  ]);

  // Stanford-like campus coordinates
  const baseLat = 37.4275;
  const baseLng = -122.1697;

  const makePoint = (latOffset, lngOffset) => ({
    type: 'Point',
    coordinates: [baseLng + lngOffset, baseLat + latOffset]
  });

  await Item.create([
    {
      itemId: generateItemId('WALLET'),
      type: 'LOST',
      category: 'wallet',
      title: 'Brown leather wallet',
      description: 'Lost near the main library entrance.',
      photos: [],
      location: makePoint(0.001, 0.001),
      postedBy: john._id
    },
    {
      itemId: generateItemId('PHONE'),
      type: 'LOST',
      category: 'phone',
      title: 'Black iPhone 13',
      description: 'With blue silicone case, lost around cafeteria.',
      photos: [],
      location: makePoint(-0.001, 0.0005),
      postedBy: alice._id
    },
    {
      itemId: generateItemId('WALLET'),
      type: 'FOUND',
      category: 'wallet',
      title: 'Found a brown wallet',
      description: 'Looks like a student wallet found near the quad.',
      photos: [],
      location: makePoint(0.0012, 0.0012),
      postedBy: alice._id
    },
    {
      itemId: generateItemId('KEYS'),
      type: 'FOUND',
      category: 'keys',
      title: 'Set of dorm keys',
      description: '3 keys with a red tag found in parking lot.',
      photos: [],
      location: makePoint(-0.0008, -0.0006),
      postedBy: john._id
    }
  ]);

  console.log('Seed completed. Demo users:');
  console.log('john@example.com / password123');
  console.log('alice@example.com / password123');
  console.log('admin@example.com / password123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
