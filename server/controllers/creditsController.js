import User from '../models/User.js';
import AdminIncome from '../models/AdminIncome.js';
import crypto from 'crypto';

/**
 * GET /api/credits/balance
 * Get current user's credit balance
 */
export const getCreditsBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            credits: user.credits,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/credits/purchase
 * Purchase credits (Razorpay integration)
 * Body: { package: 'starter' | 'popular' | 'premium', razorpay_payment_id... }
 */
const CREDIT_PACKAGES = {
    starter: { credits: 10, price: 99, label: '10 Credits' },
    popular: { credits: 30, price: 249, label: '30 Credits' },
    premium: { credits: 75, price: 499, label: '75 Credits' },
};

export const purchaseCredits = async (req, res) => {
    try {
        const { package: pkg, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const selectedPkg = CREDIT_PACKAGES[pkg];
        if (!selectedPkg) {
            return res.status(400).json({ error: 'Invalid package. Choose: starter, popular, or premium.' });
        }

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
             return res.status(400).json({ error: 'Missing payment details' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify Razorpay Signature
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        const transactionId = razorpay_payment_id;

        // Add credits
        user.credits += selectedPkg.credits;
        await user.save();

        // Track platform income
        await AdminIncome.create({
            source: 'credit_purchase',
            amount: selectedPkg.price,
            user: user._id,
            description: `Purchased ${selectedPkg.credits} credits package`,
            transactionId: razorpay_payment_id
        });

        res.json({
            message: `Successfully purchased ${selectedPkg.credits} credits!`,
            transactionId,
            creditsAdded: selectedPkg.credits,
            totalCredits: user.credits,
            amountPaid: selectedPkg.price,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/credits/packages
 * Get available credit packages
 */
export const getCreditPackages = async (req, res) => {
    res.json({ packages: CREDIT_PACKAGES });
};

/**
 * GET /api/credits/history
 * Get user's credit purchase history
 */
export const getCreditHistory = async (req, res) => {
    try {
        const history = await AdminIncome.find({ user: req.user._id, source: 'credit_purchase' }).sort({ createdAt: -1 });
        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
