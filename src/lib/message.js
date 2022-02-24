import { chatsvr, chatbotsvr, managesvr, filesvr, imgsvr } from '@/lib/api';

export const sendMessage = params => {
  if (params.roomType == 'B')
    return chatbotsvr('post', '/api/ai/message', params);
  else return chatsvr('post', '/message', params);
};

export const sendChatBotKeyMessage = (key, params) => {
  return chatbotsvr('post', `/api/ai/${key}/message`, params);
};

export const readMessage = params => {
  console.log(params);
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

export const uploadFile = params => {
  let url = '';
  const formData = new FormData();

  console.log(params);

  // url 및 formData 생성
  if (params.sendFileInfo.files.length == 1) {
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
  return filesvr('get', `/download/${params.token}`, {}, {}, downloadHandler);
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
  return managesvr(
    'get',
    `/messages/search/${params.search}?roomID=${params.roomID}&loadCnt=${params.loadCnt}`,
  );
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

  return managesvr(
    'get',
    `/channel/messages/search?roomID=${params.roomId}&loadCnt=${params.loadCnt}&searchText=${searchText}`,
  );
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
}

// 멘션 목록 리스트 조회
export const getChannelMentionList = params => {
  return managesvr(
    'get',
    `/channel/mention/${params.roomId}?name=${params.name}`,
  );
};
