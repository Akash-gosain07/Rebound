
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Item } from '../src/models/Item.js';
import { Match } from '../src/models/Match.js';
import { OtpSession } from '../src/models/OtpSession.js';

async function clearData() {
    await connectDB();
    try {
        console.log('Clearing items...');
        await Item.deleteMany({});
        console.log('Items cleared.');

        console.log('Clearing matches...');
        await Match.deleteMany({});
        console.log('Matches cleared.');

        console.log('Clearing OTP sessions...');
        await OtpSession.deleteMany({});
        console.log('OTP sessions cleared.');

        console.log('All demo reported data cleared successfully.');
    } catch (err) {
        console.error('Error clearing data:', err);
    } finally {
        await mongoose.disconnect();
    }
}

clearData();
