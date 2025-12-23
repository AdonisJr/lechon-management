import mongoose from 'mongoose';
import connectToDatabase from './src/app/lib/mongodb.js';

const dropUniqueIndex = async () => {
    try {
        await connectToDatabase();
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('orders');

        // Drop the unique index on code field if it exists
        try {
            await collection.dropIndex('code_1');
            console.log('Dropped unique index on code field');
        } catch (error) {
            if (error.codeName === 'IndexNotFound') {
                console.log('Unique index on code field does not exist');
            } else {
                throw error;
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

dropUniqueIndex();