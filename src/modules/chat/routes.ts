import multipart from '@fastify/multipart';
import { FastifyPluginAsync } from 'fastify';
import cloudinary from '../../config/cloudinary';
import { config } from '../../config/config';
import { cloudinaryService } from '../../services/cloudinary.service';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(multipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        },
    });

    fastify.post('/upload', async (request, reply) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.code(400).send({ error: 'No file uploaded' });
            }

            const buffer = await data.toBuffer();
            const result = await cloudinaryService.uploadImage(
                buffer,
                data.filename,
                data.mimetype,
            );

            return {
                success: true,
                url: result.url,
                publicId: result.publicId,
                fileName: result.fileName,
                fileSize: result.fileSize,
                mimeType: result.mimeType,
            };
        } catch (error) {
            request.log.error({ err: error }, 'Upload error');
            const message = error instanceof Error ? error.message : 'Upload failed';
            return reply.code(500).send({ error: message });
        }
    });

    fastify.get('/cloudinary-signature', async () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'chat_images';

        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp,
                folder,
            },
            config.cloudinary.apiSecret,
        );

        return {
            cloudName: config.cloudinary.cloudName,
            apiKey: config.cloudinary.apiKey,
            timestamp,
            folder,
            signature,
        };
    });
};

export default chatRoutes;
