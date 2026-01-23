import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Item } from '../src/models/Item.js';

async function migrateItemTypes() {
    await connectDB();

    try {
        // Find items with uppercase types
        const uppercaseItems = await Item.find({
            type: { $in: ['LOST', 'FOUND'] }
        });

        console.log(`Found ${uppercaseItems.length} items with uppercase types.`);

        let updatedCount = 0;
        for (const item of uppercaseItems) {
            item.type = item.type.toLowerCase();
            await item.save();
            updatedCount++;
        }

        console.log(`Successfully migrated ${updatedCount} items to lowercase.`);

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

migrateItemTypes();
