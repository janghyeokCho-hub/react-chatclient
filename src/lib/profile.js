import { chatsvr, managesvr } from '@/lib/api';

export const getProfileInfo = targetId => {
  return managesvr('get', `/profile/${targetId}`);
};
