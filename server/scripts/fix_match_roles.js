import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Match } from '../src/models/Match.js';

async function swapRoles(matchId) {
    await connectDB();

    try {
        const match = await Match.findOne({ matchId });
        if (!match) {
            console.log(`Match ${matchId} not found.`);
            return;
        }

        console.log(`Swapping roles for match ${matchId}...`);
        console.log(`Original Owner: ${match.owner}, Original Finder: ${match.finder}`);

        const oldOwner = match.owner;
        match.owner = match.finder;
        match.finder = oldOwner;

        await match.save();

        console.log(`Roles swapped successfully.`);
        console.log(`New Owner: ${match.owner}, New Finder: ${match.finder}`);

    } catch (err) {
        console.error('Swap error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

swapRoles('DGT-325');
