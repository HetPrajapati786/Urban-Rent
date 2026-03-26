import { v2 as cloudinary } from 'cloudinary';

// Lazy configuration — only configure when first used
let configured = false;

const ensureConfigured = () => {
    if (!configured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        configured = true;
        console.log('[Cloudinary] Configured with cloud:', process.env.CLOUDINARY_CLOUD_NAME || '(not set)');
    }
};

// Proxy that auto-configures before use
const cloudinaryProxy = new Proxy(cloudinary, {
    get(target, prop) {
        ensureConfigured();
        return target[prop];
    }
});

export default cloudinaryProxy;
