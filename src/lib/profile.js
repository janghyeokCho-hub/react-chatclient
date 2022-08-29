import { chatsvr, managesvr } from '@/lib/api';
import LRU from 'lru-cache';

const cache = new LRU({
  max: 20,
  ttl: 1000 * 60 * 60 // 60m (1h)
});

const defaultOpts = {
  useCache: false
};

export const getProfileInfo = async (targetId, { useCache } = defaultOpts) => {
  if (useCache !== true) {
    return managesvr('get', `/profile/${targetId}`);
  }
  const cachedData = cache.get(targetId);
  if (cachedData) {
    // Cache hit
    return cachedData;
  }
  // Fetch data
  const profileData = await managesvr('get', `/profile/${targetId}`);
  cache.set(targetId, profileData);
  return profileData;
};
