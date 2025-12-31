import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import { getLogger } from '../config/logger';

const log = getLogger('cloudinary');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

export class CloudinaryService {
    async uploadImage(
        fileBuffer: Buffer,
        fileName: string,
        mimeType: string,
    ): Promise<CloudinaryUploadResult> {
        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            throw new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }

        // Validate file size
        if (fileBuffer.length > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'chat_images',
                    resource_type: 'image',
                    // todo::
                    // quality: 100,
                    // flags: 'preserve_transparency',
                },
                (error, result) => {
                    if (error) {
                        reject(new Error(`Cloudinary upload failed: ${error.message}`));
                        return;
                    }

                    if (!result) {
                        reject(new Error('Cloudinary upload failed: No result returned'));
                        return;
                    }

                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        fileName,
                        fileSize: result.bytes,
                        mimeType,
                    });
                },
            );

            const readableStream = Readable.from(fileBuffer);
            readableStream.pipe(uploadStream);
        });
    }

    /**
     * Delete image from Cloudinary
     */
    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            log.error({ err: error, publicId }, 'Failed to delete image from Cloudinary');
            throw error;
        }
    }
}

export const cloudinaryService = new CloudinaryService();
