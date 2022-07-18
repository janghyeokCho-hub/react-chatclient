import { chatsvr, managesvr } from '@/lib/api';

//알림톡 전송
export const sendNoticeTalk = params => {
  return chatsvr('post', `/notice/talk`, params);
};

export const getChannel = params => {
  return managesvr('get', `/notice/subject`, params);
};

