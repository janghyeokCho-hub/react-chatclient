import { chatsvr, managesvr } from '@/lib/api';

export const addPresenceTargetUser = params => {
  return chatsvr('post', `/presence`, params);
};

export const deletePresenceTargetUser = params => {
  return chatsvr('delete', `/presence`, params);
};

export const setPresenceTargetUser = params => {
  return chatsvr('post', `/presence/calculated`, params);
};

export const pubPresence = params => {
  return chatsvr('put', `/presence`, params);
};
