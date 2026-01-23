import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Match } from '../src/models/Match.js';
import { Item } from '../src/models/Item.js';
import { User } from '../src/models/User.js';

async function inspectMatch(matchId) {
    await connectDB();

    try {
        const match = await Match.findOne({ matchId }).populate('item owner finder');
        if (!match) {
            console.log('Match not found');
            return;
        }

        console.log('Match:', JSON.stringify(match, null, 2));

        if (match.item) {
            const item = await Item.findById(match.item._id).populate('postedBy');
            console.log('Item:', JSON.stringify(item, null, 2));
        }

    } catch (err) {
        console.error('Inspect error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

inspectMatch('DGT-325');
