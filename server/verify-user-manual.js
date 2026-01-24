
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/rebound';

const verifyUser = async (email) => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.isVerified = true;
        await user.save();
        console.log(`SUCCESS: User ${user.email} (${user.fullName}) marked as verified.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

verifyUser('abhishekpandey@gmail.com');
