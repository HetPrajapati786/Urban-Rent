import multer from 'multer';
import path from 'path';

// Store files in memory for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|webp|gif|avif|heic|heif/;
    const allowedVideoTypes = /mp4|mov|avi|webm/;
    const allowedDocTypes = /pdf|doc|docx|jpg|jpeg|png/;

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    if (
        file.fieldname === 'images' || file.fieldname === 'floorPlan'
            ? allowedImageTypes.test(ext)
            : file.fieldname === 'video'
                ? allowedVideoTypes.test(ext)
                : allowedDocTypes.test(ext)
    ) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type for ${file.fieldname}: .${ext}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
    },
});

export default upload;
