import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

export default async function Redis() {
  try {
    const client = createClient({
      url: process.env.REDIS_URI
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error', { error: err.message, stack: err.stack });
    });
    
    client.on('connect', () => {
      logger.info('Redis client connected');
    });
    
    client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });
    
    client.on('end', () => {
      logger.info('Redis client connection closed');
    });
    
    await client.connect();
    
    // Cache search results for 5 minutes
    const CACHE_DURATION = 60 * 5;

    async function getSearchResults(query, userId) {
      try {
        const cacheKey = `search:${userId}:${query}`;
        const cached = await client.get(cacheKey);
        
        if (cached) {
          return JSON.parse(cached);
        }
        
        return null;
      } catch (error) {
        logger.error('Error getting search results from Redis', { 
          error: error.message, 
          userId,
          query 
        });
        return null; // Return null on error to allow the application to fall back to the database
      }
    }

    async function setSearchResults(query, userId, results) {
      try {
        const cacheKey = `search:${userId}:${query}`;
        await client.setEx(cacheKey, CACHE_DURATION, JSON.stringify(results));
      } catch (error) {
        logger.error('Error setting search results in Redis', { 
          error: error.message, 
          userId,
          query 
        });
        // We don't rethrow the error since caching failures shouldn't break the app
      }
    }

    async function invalidateUserCache(userId) {
      try {
        const pattern = `search:${userId}:*`;
        const keys = await client.keys(pattern);
        
        if (keys.length > 0) {
          await client.del(keys);
          logger.info('Invalidated user cache', { userId, keysCount: keys.length });
        }
      } catch (error) {
        logger.error('Error invalidating user cache in Redis', { 
          error: error.message, 
          userId 
        });
      }
    }

    async function quit() {
      try {
        await client.quit();
        logger.info('Redis connection closed gracefully');
      } catch (error) {
        logger.error('Error closing Redis connection', { error: error.message });
      }
    }

    return {
      getSearchResults,
      setSearchResults,
      invalidateUserCache,
      quit
    };
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error: error.message, stack: error.stack });
    // Return null methods to prevent application crashes if Redis fails
    return {
      getSearchResults: async () => null,
      setSearchResults: async () => {},
      invalidateUserCache: async () => {},
      quit: async () => {}
    };
  }
}