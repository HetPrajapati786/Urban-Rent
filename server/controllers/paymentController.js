import Razorpay from 'razorpay';

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, receipt } = req.body;

        if (!amount || !receipt) {
            return res.status(400).json({ error: 'Amount and receipt are required' });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Use a random small amount between ₹10 and ₹100 for Razorpay Test Mode 
        // This ensures the frontend shows actual rent, but only deducts test amount
        const safeAmount = Math.floor(Math.random() * 91) + 10;

        const options = {
            amount: Math.round(safeAmount * 100), // convert rupees to paise, must be integer
            currency: 'INR',
            receipt: receipt.toString(),
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: 'Some error occurred while creating order' });
        }

        res.json(order);
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        res.status(500).json({ 
            error: error.message || error.error?.description || 'Internal Server Error' 
        });
    }
};
