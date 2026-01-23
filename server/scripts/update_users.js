import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcrypt';

async function updateUsers() {
    await connectDB();

    try {
        const passwordHash1 = await bcrypt.hash('abhishekpandey', 10);
        const passwordHash2 = await bcrypt.hash('akash', 10);

        // --- User 1: Abhishek ---
        const targetEmail1 = 'abhishekpandey@gmail.com';
        const oldEmail1 = 'demo@rebound.test';

        // Check if target already exists
        let user1 = await User.findOne({ email: targetEmail1 });
        if (user1) {
            // Update existing target
            user1.fullName = 'Abhishek Pandey';
            user1.passwordHash = passwordHash1;
            await user1.save();
            console.log(`Updated existing user ${targetEmail1}`);

            // Remove old demo user if it exists to avoid confusion
            await User.deleteOne({ email: oldEmail1 });
        } else {
            // Target doesn't exist, try to update old demo user
            const oldUser1 = await User.findOne({ email: oldEmail1 });
            if (oldUser1) {
                oldUser1.email = targetEmail1;
                oldUser1.fullName = 'Abhishek Pandey';
                oldUser1.passwordHash = passwordHash1;
                await oldUser1.save();
                console.log(`Renamed ${oldEmail1} to ${targetEmail1}`);
            } else {
                // Neither exist, create new
                await User.create({
                    userId: 'usr_' + Date.now() + '_1',
                    fullName: 'Abhishek Pandey',
                    email: targetEmail1,
                    passwordHash: passwordHash1,
                    phone: '+919999999999',
                    authProvider: 'email',
                    isVerified: true,
                });
                console.log(`Created new user ${targetEmail1}`);
            }
        }

        // --- User 2: Akash ---
        const targetEmail2 = 'akash@gmail.com';
        const oldEmail2 = 'demo2@rebound.test';

        let user2 = await User.findOne({ email: targetEmail2 });
        if (user2) {
            user2.fullName = 'Akash';
            user2.passwordHash = passwordHash2;
            await user2.save();
            console.log(`Updated existing user ${targetEmail2}`);

            // Remove old demo user
            await User.deleteOne({ email: oldEmail2 });
        } else {
            const oldUser2 = await User.findOne({ email: oldEmail2 });
            if (oldUser2) {
                oldUser2.email = targetEmail2;
                oldUser2.fullName = 'Akash';
                oldUser2.passwordHash = passwordHash2;
                await oldUser2.save();
                console.log(`Renamed ${oldEmail2} to ${targetEmail2}`);
            } else {
                await User.create({
                    userId: 'usr_' + Date.now() + '_2',
                    fullName: 'Akash',
                    email: targetEmail2,
                    passwordHash: passwordHash2,
                    phone: '+918888888881',
                    authProvider: 'email',
                    isVerified: true,
                });
                console.log(`Created new user ${targetEmail2}`);
            }
        }

    } catch (err) {
        console.error('Update error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

updateUsers();
