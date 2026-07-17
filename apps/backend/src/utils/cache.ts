import type { RedisClientType } from "redis";

const DATAPULLER_HOUR = 5; // 5AM
const APOLLO_CACHE_PREFIX = "apollo-cache:";

/**
 * Returns the time in seconds until the next datapuller run (5AM).
 */
export const timeToNextPull = () => {
  const nowPT = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    })
  );

  const nextPullPT = new Date(nowPT);
  if (nowPT.getHours() >= DATAPULLER_HOUR) {
    nextPullPT.setDate(nextPullPT.getDate() + 1);
  }
  nextPullPT.setHours(DATAPULLER_HOUR, 0, 0, 0);

  return Math.floor((nextPullPT.getTime() - nowPT.getTime()) / 1000);
};

/**
 * Drop Apollo Server response-cache entries so subsequent GraphQL queries
 * (catalog search, class enrollment, etc.) re-read Mongo after a live scrape.
 */
export const invalidateApolloResponseCache = async (
  redis: RedisClientType
): Promise<number> => {
  const keys: string[] = [];
  for await (const batch of redis.scanIterator({
    MATCH: `${APOLLO_CACHE_PREFIX}*`,
    COUNT: 200,
  })) {
    keys.push(...batch);
  }

  if (keys.length === 0) return 0;

  // Delete in chunks to avoid huge UNLINK argument lists.
  const chunkSize = 500;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    // node-redis unlink accepts a non-empty tuple of keys
    await redis.unlink(chunk as [string, ...string[]]);
  }

  return keys.length;
};
