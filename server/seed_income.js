import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminIncome from './models/AdminIncome.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/urbanrent";

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Delete old income
        await AdminIncome.deleteMany({});
        console.log('Cleared old income data');

        const manager = await User.findOne({ role: 'manager' });
        const tenant = await User.findOne({ role: 'tenant' });

        if (!manager || !tenant) {
            console.log('Missing basic users to attach income to');
            process.exit(0);
        }

        const incomes = [];

        // Generate data for the last 12 months
        const now = new Date();
        const startDates = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
            startDates.push(date);
        }

        startDates.forEach((date, i) => {
            // Randomly insert 1-3 credit purchases
            const buys = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < buys; j++) {
                incomes.push({
                    source: 'credit_purchase',
                    amount: [99, 249, 499][Math.floor(Math.random() * 3)],
                    user: manager._id,
                    description: `Purchased credit package`,
                    transactionId: `mock_txn_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: date,
                    updatedAt: date
                });
            }

            // Randomly insert 1-2 lease commissions
            const leases = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < leases; j++) {
                const rent = [15000, 25000, 35000, 50000][Math.floor(Math.random() * 4)];
                incomes.push({
                    source: 'lease_commission',
                    amount: rent * 0.02,
                    user: tenant._id,
                    description: `2% platform fee on ₹${rent} rental payment`,
                    transactionId: `mock_txn_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: date,
                    updatedAt: date
                });
            }
        });

        await AdminIncome.create(incomes);
        console.log(`Seeded ${incomes.length} income records!`);

    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

seed();
