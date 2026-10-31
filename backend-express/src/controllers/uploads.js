import multer from 'multer';
import { httpError } from '../middleware/errorHandler.js';
import { uploadImage } from '../services/upload.js';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// shortcut: trusts the declared MIME type (Cloudinary rejects non-images on real uploads); sniff magic bytes if uploads go elsewhere.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    TYPES.includes(file.mimetype) ? cb(null, true) : cb(httpError(400, 'VALIDATION_ERROR', 'image must be JPEG, PNG, or WebP')),
}).single('image');

export async function create(req, res) {
  if (!req.file) throw httpError(400, 'VALIDATION_ERROR', 'image: a file is required');
  res.status(201).json(await uploadImage(req.file.buffer));
}
