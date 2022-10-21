/**
 * 공동 문서 관련 API
 */
import { chatsvr } from '@/lib/api';

export const createDocument = params => {
  return chatsvr('post', '/shareDoc', params);
};

/**
 * 해당 유저에게 공유된 문서 목록 조회
 * @param {string} userId
 */
export const getDocList = userId => {
  return chatsvr('get', `/shareDoc/list/${userId}`);
};

/**
 * 해당방에 공유된 문서 목록 조회
 * @param {number} roomId
 */
export const getRoomDocList = roomId => {
  return chatsvr('get', `/shareDoc/room/${roomId}`);
};

/**
 * 공동문서 정보 수정 함수
 * @typedef {object} params
 * @property {string[]} exitList - exitList를 보내면 추방만 적용됨
 * @property {string} docTitle
 * @property {string} description
 * @property {string} category
 * @property {number} pinTop
 */
export const updateDocument = params => {
  return chatsvr('put', `/shareDoc/${params.docID}`, params);
};

export const getDocItem = docID => {
  return chatsvr('get', `/shareDoc/${docID}`);
};
