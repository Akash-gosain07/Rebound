import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Match } from '../src/models/Match.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';

async function fixMatchRoles() {
    await connectDB();

    try {
        const akash = await User.findOne({ email: 'akash@gmail.com' });
        const abhishek = await User.findOne({ email: 'abhishekpandey@gmail.com' });

        if (!akash || !abhishek) {
            console.log('Could not find both users.');
            return;
        }

        console.log(`Akash (Finder): ${akash._id}`);
        console.log(`Abhishek (Owner): ${abhishek._id}`);

        const matchId = 'DGT-325';
        const match = await Match.findOne({ matchId });
        if (!match) {
            console.log(`Match ${matchId} not found.`);
            return;
        }

        // Scenario: Akash FOUND the item. Abhishek LOST it (and claimed it).
        // So:
        // Item postedBy should be Akash (Finder).
        // Match Owner (Loser) should be Abhishek.
        // Match Finder (Finder) should be Akash.

        // 1. Fix Item if needed (it was posted by Akash, so that's likely correct)
        const item = await Item.findById(match.item);
        if (!item.postedBy.equals(akash._id)) {
            console.log('Updating item postedBy to Akash...');
            item.postedBy = akash._id;
            item.type = 'found'; // Ensure it's found
            await item.save();
        }

        // 2. Fix Match Roles
        console.log('Updating Match roles...');
        match.owner = abhishek._id;
        match.finder = akash._id;

        await match.save();

        console.log('Successfully fixed Match roles for DGT-325!');

    } catch (err) {
        console.error('Fix error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

fixMatchRoles();
