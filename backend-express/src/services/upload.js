import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Stores an image in the Cloudinary `recipebook/` folder (ADR-0005).
 * With CLOUDINARY_FAKE=1 it returns a fake URL and makes no network call.
 * @param {Buffer} buffer - an already size- and type-checked image
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadImage(buffer) {
  if (env.CLOUDINARY_FAKE) {
    const publicId = `recipebook/${randomUUID()}`;
    return Promise.resolve({ url: `https://fake.cloudinary.test/${publicId}.jpg`, publicId });
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'recipebook', resource_type: 'image' }, (err, result) =>
        err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }),
      )
      .end(buffer);
  });
}

/**
 * Deletes images from Cloudinary. Failures are logged, not thrown: the recipe is already gone,
 * so an orphaned image is the worst case (ADR-0005). No-op with CLOUDINARY_FAKE=1.
 * @param {string[]} publicIds
 */
export async function deleteImages(publicIds) {
  if (env.CLOUDINARY_FAKE || !publicIds.length) return;
  const results = await Promise.allSettled(publicIds.map((id) => cloudinary.uploader.destroy(id)));
  results.forEach((r, i) => r.status === 'rejected' && console.error(`Cloudinary delete failed for ${publicIds[i]}:`, r.reason));
}
