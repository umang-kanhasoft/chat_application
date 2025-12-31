import { createClient } from 'redis';
import { config } from '../config/config';
import { getLogger } from '../config/logger';

const log = getLogger('cache');

export class CacheService {
    private client = createClient({
        username: config.redis.username,
        password: config.redis.password,
        socket: {
            host: config.redis.host,
            port: config.redis.port,
        },
    });

    constructor() {
        this.client.connect().catch((error) => {
            log.error({ err: error }, 'Redis connection failed');
        });
    }

    async getChatHistory(key: string): Promise<any[] | null> {
        try {
            const cached = await this.client.get(key);
            const cachedString =
                typeof cached === 'string' ? cached : cached ? cached.toString('utf8') : null;
            return cachedString ? JSON.parse(cachedString) : null;
        } catch (error) {
            log.error({ err: error, key }, 'Cache get error');
            return null;
        }
    }

    async setChatHistory(key: string, data: any[], ttl: number = 300): Promise<void> {
        try {
            await this.client.setEx(key, ttl, JSON.stringify(data));
        } catch (error) {
            log.error({ err: error, key }, 'Cache set error');
        }
    }

    async invalidateChatCache(projectId: string | null, userId?: string): Promise<void> {
        try {
            const normalizedProjectId = projectId ?? 'global';
            const pattern = userId
                ? `chat:${normalizedProjectId}:${userId}:*`
                : `chat:${normalizedProjectId}:*`;
            const keys = await this.client.keys(pattern);
            for (const key of keys) {
                await this.client.del(key);
            }
        } catch (error) {
            log.error({ err: error, projectId, userId }, 'Cache invalidation error');
        }
    }

    async invalidateUserChats(userId: string): Promise<void> {
        try {
            const pattern = `chat:*:${userId}:*`;
            const keys = await this.client.keys(pattern);
            for (const key of keys) {
                await this.client.del(key);
            }
        } catch (error) {
            log.error({ err: error, userId }, 'User cache invalidation error');
        }
    }
}

export default new CacheService();
