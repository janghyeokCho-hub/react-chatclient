import axios from 'axios';
import Config from '@/config/config';

const CHAT_SERVER = Config.ServerURL.CHAT;
const MANAGE_SERVER = Config.ServerURL.MANAGE;
const CHATBOT_SERVER = Config.ServerURL.CHATBOT;

export const chatbotsvr = (method, url, params, headers, userid = true) => {
  if (DEVICE_TYPE === 'b') {
    // IE Cache 정책 문제로 timestamp parameter 함께 전송
    if (method.toUpperCase() === 'GET') {
      if (url.indexOf('?') > -1) {
        url = `${url}&_=${new Date().getTime()}`;
      } else {
        url = `${url}?_=${new Date().getTime()}`;
      }
    }
  }
  const reqOptions = {
    method: method,
    url: `${CHATBOT_SERVER}${url}`,
    data: params,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Token': localStorage.getItem('covi_user_access_token'),
      'Covi-User-Access-Version': APP_VERSION,
      'Covi-User-Device-Type':
        DEVICE_TYPE === 'd' ? 'covision.desktop.app' : 'covision.web.app',
      ...headers,
    },
  };

  const token = localStorage.getItem('covi_user_access_token');
  if (token !== null) {
    reqOptions.headers['Covi-User-Access-Token'] = token;
  }
  const storedUserid = localStorage.getItem('covi_user_access_id');
  if (userid === true && storedUserid !== null) {
    reqOptions.headers['Covi-User-Access-ID'] = storedUserid;
  }
  return axios(reqOptions);
};

export const chatsvr = (method, url, params, headers, userid = true) => {
  if (DEVICE_TYPE === 'b') {
    // IE Cache 정책 문제로 timestamp parameter 함께 전송
    if (method.toUpperCase() === 'GET') {
      if (url.indexOf('?') > -1) {
        url = `${url}&_=${new Date().getTime()}`;
      } else {
        url = `${url}?_=${new Date().getTime()}`;
      }
    }
  }
  const reqOptions = {
    method: method,
    url: `${CHAT_SERVER}${url}`,
    data: params,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Token': localStorage.getItem('covi_user_access_token'),
      'Covi-User-Access-Version': APP_VERSION,
      'Covi-User-Device-Type':
        DEVICE_TYPE === 'd' ? 'covision.desktop.app' : 'covision.web.app',
      ...headers,
    },
  };

  const token = localStorage.getItem('covi_user_access_token');
  if (token !== null) {
    reqOptions.headers['Covi-User-Access-Token'] = token;
  }
  const storedUserid = localStorage.getItem('covi_user_access_id');
  if (userid === true && storedUserid !== null) {
    reqOptions.headers['Covi-User-Access-ID'] = storedUserid;
  }
  return axios(reqOptions);
};

export const managesvr = (
  method,
  url,
  params,
  headers,
  userid = true,
  onUploadHandler = null,
) => {
  if (DEVICE_TYPE === 'b') {
    // IE Cache 정책 문제로 timestamp parameter 함께 전송
    if (method.toUpperCase() === 'GET') {
      if (url.indexOf('?') > -1) {
        url = `${url}&_=${new Date().getTime()}`;
      } else {
        url = `${url}?_=${new Date().getTime()}`;
      }
    }
  }

  let reqOptions = null;

  if (headers && 'Content-Type' in headers) {
    if (headers['Content-Type'] === 'multipart/form-data') {
      let cancelTokenSource = axios.CancelToken.source();
      reqOptions = {
        method: method,
        url: `${MANAGE_SERVER}${url}`,
        data: params,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json; charset=utf-8',
          'Covi-User-Access-Version': APP_VERSION,
          'Covi-User-Device-Type':
            DEVICE_TYPE === 'd' ? 'covision.desktop.app' : 'covision.web.app',
          ...headers,
        },
        cancelToken: cancelTokenSource.token,
        onUploadProgress: data => {
          onUploadHandler(data, cancelTokenSource);
        },
      };
    }
  } else {
    reqOptions = {
      method: method,
      url: `${MANAGE_SERVER}${url}`,
      data: params,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json; charset=utf-8',
        'Covi-User-Access-Version': APP_VERSION,
        'Covi-User-Device-Type':
          DEVICE_TYPE === 'd' ? 'covision.desktop.app' : 'covision.web.app',
        ...headers,
      },
    };
  }

  const token = localStorage.getItem('covi_user_access_token');
  if (token !== null) {
    reqOptions.headers['Covi-User-Access-Token'] = token;
  }

  const storedUserid = localStorage.getItem('covi_user_access_id');
  if (userid === true && storedUserid !== null) {
    reqOptions.headers['Covi-User-Access-ID'] = storedUserid;
  }

  return axios(reqOptions);
};

export const filesvr = (
  method,
  url,
  params,
  headers,
  downloadHandler,
  responseType = 'arraybuffer',
) => {
  const reqOptions = {
    method: method,
    url: `${MANAGE_SERVER}${url}`,
    data: params,
    responseType,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Version': APP_VERSION,
      'Covi-User-Device-Type':
        DEVICE_TYPE === 'd' ? 'covision.desktop.app' : 'covision.web.app',
      ...headers,
    },
    onDownloadProgress: downloadHandler,
  };

  const token = localStorage.getItem('covi_user_access_token');
  if (token !== null) {
    reqOptions.headers['Covi-User-Access-Token'] = token;
  }

  const storedUserid = localStorage.getItem('covi_user_access_id');
  if (storedUserid !== null) {
    reqOptions.headers['Covi-User-Access-ID'] = storedUserid;
  }

  return axios(reqOptions);
};

export const imgsvr = (method, url, params, headers) => {
  const reqOptions = {
    method: method,
    url: `${MANAGE_SERVER}${url}`,
    data: params,
    responseType: 'arraybuffer',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Version': APP_VERSION,
      'Covi-User-Device-Type':
        DEVICE_TYPE === 'd' ? 'covision.desktop.app' : 'covision.web.app',
      ...headers,
    },
  };

  const token = localStorage.getItem('covi_user_access_token');
  if (token !== null) {
    reqOptions.headers['Covi-User-Access-Token'] = token;
  }

  const storedUserid = localStorage.getItem('covi_user_access_id');
  if (storedUserid !== null) {
    reqOptions.headers['Covi-User-Access-ID'] = storedUserid;
  }

  return axios(reqOptions);
};
