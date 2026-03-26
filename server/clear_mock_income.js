import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminIncome from './models/AdminIncome.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/urbanrent";

async function clear() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const result = await AdminIncome.deleteMany({ transactionId: /^mock_txn_/ });
        console.log('Deleted', result.deletedCount, 'seeded/mock income records');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

clear();
