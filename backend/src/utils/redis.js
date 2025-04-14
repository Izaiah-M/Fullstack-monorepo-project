import { createClient } from 'redis';

export default async function Redis() {
  const client = createClient({
    url: process.env.REDIS_URI
  });

  client.on('error', (err) => console.log('Redis Client Error', err));
  
  await client.connect();

  // Cache search results for 5 minutes
  const CACHE_DURATION = 60 * 5;

  async function getSearchResults(query, userId) {
    const cacheKey = `search:${userId}:${query}`;
    const cached = await client.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  async function setSearchResults(query, userId, results) {
    const cacheKey = `search:${userId}:${query}`;
    await client.setEx(cacheKey, CACHE_DURATION, JSON.stringify(results));
  }

  async function invalidateUserCache(userId) {
    const pattern = `search:${userId}:*`;
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(keys);
    }
  }

  return {
    getSearchResults,
    setSearchResults,
    invalidateUserCache
  };
}