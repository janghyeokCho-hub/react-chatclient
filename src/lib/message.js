import { chatsvr, chatbotsvr, managesvr, filesvr, imgsvr } from '@/lib/api';
import { getConfig } from './util/configUtil';
import { SEARCHVIEW_OPTIONS } from './constants/searchView.constant';

export const sendMessage = params => {
  if (params.roomType === 'B') {
    return chatbotsvr('post', '/api/ai/message', params);
  } else {
    return chatsvr('post', '/message', params);
  }
};

export const sendChatBotKeyMessage = (key, params) => {
  return chatbotsvr('post', `/api/ai/${key}/message`, params);
};

export const readMessage = params => {
  return chatsvr('put', '/message', params);
};

export const getMessagePage = params => {
  return managesvr(
    'get',
    `/messages/${params.pageNum}?roomID=${params.roomID}&loadCnt=${params.loadCnt}&startId=${params.startId}`,
  );
};

export const getMessagePages = params => {
  return managesvr(
    'get',
    `/messages?roomID=${params.roomID}&loadCnt=${params.loadCnt}&startId=${
      params.startId
    }&pages=${params.pages.join(',')}`,
  );
};

export const getMessageBetween = params => {
  return managesvr(
    'get',
    `/messages/reply?roomID=${params.roomID}&startId=${params.startId}&cnt=${params.cnt}`,
  );
};

export const uploadFile = params => {
  let url = '';
  const formData = new FormData();

  // url 및 formData 생성
  if (params.sendFileInfo.files.length === 1) {
    url = '/upload';
    formData.append('file', params.sendFileInfo.files[0]);
  } else {
    url = '/multiUpload';
    params.sendFileInfo.files.forEach(file => {
      formData.append('files', file);
    });
  }

  formData.append('tempId', params.tempId);
  formData.append('fileInfos', JSON.stringify(params.sendFileInfo.fileInfos));

  if (params.roomID) {
    formData.append('roomID', params.roomID);
  } else {
    delete params['sendFileInfo'];
    formData.append('roomObj', JSON.stringify(params));
  }

  return managesvr(
    'post',
    url,
    formData,
    {
      'Content-Type': 'multipart/form-data',
    },
    true,
    params.onUploadHandler,
  );
};

export const shareFile = formData => {
  return filesvr('post', '/shareFiles', formData, {}, {}, 'json');
};

export const getThumbnail = params => {
  return imgsvr(
    'get',
    `/thumbnail/${params.token}`,
    {},
    {
      'Cache-Control': 'public, max-age=31536000',
    },
  );
};

export const getOriginalImage = params => {
  return imgsvr(
    'get',
    `/image/${params.token}`,
    {},
    {
      'Cache-Control': 'public, max-age=31536000',
    },
  );
};

export const getFileByToken = (params, downloadHandler) => {
  const useFilePermission = getConfig('UseFilePermission', 'N') === 'Y';
  const url = useFilePermission
    ? `/download/permission/${params.token}`
    : `/download/${params.token}`;
  return filesvr('get', url, {}, {}, downloadHandler);
};

export const getURLThumbnail = params => {
  return managesvr('post', `/message/link/thumbnail`, params);
};

export const getRoomFiles = params => {
  return managesvr(
    'get',
    `/room/files/${params.roomID}?IsImage=${params.isImage}&page=${params.page}&loadCnt=${params.loadCnt}`,
  );
};

export const getPageNumber = params => {
  return managesvr(
    'get',
    `/message/pageNum/${params.messageID}?roomId=${params.roomID}&startId=${params.startId}&loadCnt=${params.loadCnt}`,
  );
};

export const getRoomImages = params => {
  return managesvr(
    'get',
    `/room/images/${params.roomID}?ft=${params.token}&type=${params.type}&cnt=${params.cnt}`,
  );
};

export const getMessages = params => {
  return managesvr(
    'get',
    `/messages?roomID=${params.roomID}&loadCnt=${params.loadCnt}&startId=${params.startId}&dist=${params.dist}`,
  );
};

export const searchMessage = params => {
  let requestMethod = 'get';
  let requestURL;
  let requestBody = {};
  if (params?.searchOption === SEARCHVIEW_OPTIONS.CONTEXT) {
    requestURL = `/messages/search/${params.search}?roomID=${params.roomId}&loadCnt=${params.loadCnt}`;
  } else if (params?.searchOption === SEARCHVIEW_OPTIONS.SENDER) {
    requestMethod = 'post';
    requestURL = '/messages/sender/search';
    requestBody = {
      roomId: params.roomId,
      loadCnt: params.loadCnt,
      searchId: params.search,
    };
  }  else if (params?.searchOption === SEARCHVIEW_OPTIONS.DATE) {
    requestMethod = 'post';
    requestURL = '/messages/date/search';
    requestBody = {
      roomId: params.roomId,
      loadCnt: params.loadCnt,
      search: params.search,
    };
  }
  return managesvr(requestMethod, requestURL, requestBody);
};

export const getFileInfo = params => {
  return managesvr('get', `/file/${params.fileId}`);
};

// 채널
export const readChannelMessage = params => {
  return chatsvr('put', '/channel/message', params);
};

export const getChannelMessages = params => {
  return managesvr(
    'get',
    `/channel/messages?roomID=${params.roomId}&loadCnt=${params.loadCnt}&startId=${params.startId}&dist=${params.dist}`,
  );
};

export const sendChannelMessage = params => {
  return chatsvr('post', '/channel/message', params);
};

export const searchChannelMessage = params => {
  const searchText = encodeURIComponent(params.search);
  let requestMethod = 'get';
  let requestURL;
  let requestBody = {};
  if (params?.searchOption === SEARCHVIEW_OPTIONS.CONTEXT) {
    requestURL = `/channel/messages/search?roomID=${params.roomId}&loadCnt=${params.loadCnt}&searchText=${searchText}`;
  } else if (params?.searchOption === SEARCHVIEW_OPTIONS.SENDER) {
    requestMethod = 'post';
    requestURL = '/channel/sender/search';
    requestBody = {
      roomId: params.roomId,
      loadCnt: params.loadCnt,
      searchId: params.search,
      // 해당 작성자가 작성한 마지막 messageId 를 보내야 함
      // 2022-06-14 윤기현 대리가 쿼리에서 서브쿼리로 messageId 를 가져오도록 수정하기로 함.
      // messageId: params.messageId,
    };
  } else if (params?.searchOption === SEARCHVIEW_OPTIONS.DATE) {
    requestMethod = 'post';
    requestURL = '/channel/date/search';
    requestBody = {
      roomId: params.roomId,
      loadCnt: params.loadCnt,
      search: params.search,
    };
  }
  return managesvr(requestMethod, requestURL, requestBody);
};

export const getNotice = params => {
  return managesvr(
    'get',
    `/notices?roomID=${params.roomID}&loadCnt=${params.loadCnt}&startId=${params.startId}&dist=${params.dist}`,
  );
};

// 공지 내리기
export const removeNotice = params => {
  return chatsvr('put', `/channel/notice/message/${params.messageId}`, params);
};

// 채널 메시지 삭제
export const deleteChannelMessage = params => {
  return chatsvr('delete', `/channel/message/${params.messageId}`, params);
};

export const deleteChatroomMessage = params => {
  return chatsvr('delete', `/message`, params);
};

// 멘션 목록 리스트 조회
export const getChannelMentionList = params => {
  return managesvr(
    'get',
    `/channel/mention/${params.roomId}?name=${params.name}`,
  );
};

//책갈피
//책갈피 리스트 조회
export const getBookmarkList = params => {
  return managesvr('get', `/bookmark/${params}`);
};

//책갈피 삭제
export const deleteBookmark = params => {
  return managesvr('delete', `/bookmark/${params.roomId}/${params.bookmarkId}`);
};

//책갈피 등록

export const createBookmark = params => {
  return managesvr('post', `/bookmark`, params);
};
