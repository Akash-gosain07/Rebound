
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Match } from '../src/models/Match.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';

async function inspect() {
    await connectDB();
    try {
        const matches = await Match.find({}).populate('owner finder item');
        console.log('--- Inspector: Match Data ---');
        console.log(`Total Matches: ${matches.length}`);
        for (const m of matches) {
            console.log(`Match ID: ${m.matchId}`);
            console.log(`  Owner: ${m.owner?.fullName} (${m.owner?._id})`);
            console.log(`  Finder: ${m.finder?.fullName} (${m.finder?._id})`);
            console.log(`  Item: ${m.item?.title} (ReportedBy: ${m.item?.reportedBy})`);
            console.log('---');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
