import redis from '../config/redis';

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delByPrefix(prefix: string): Promise<void> {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
