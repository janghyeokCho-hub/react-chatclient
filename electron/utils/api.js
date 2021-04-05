import axios from 'axios';
import Config from '../config/config';
import * as loginInfo from './loginInfo';

export const chatsvr = (method, url, params, headers) => {
  const CHAT_SERVER = Config().ServerURL.CHAT;
  const reqOptions = {
    method: method,
    url: `${CHAT_SERVER}${url}`,
    data: params,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Token':
        (loginInfo.getData() != null && loginInfo.getData().token) || '',
      'Covi-User-Device-Type': 'covision.desktop.app',
      ...headers,
    },
  };
  reqOptions.headers['Covi-User-Access-ID'] = (loginInfo.getData() != null && loginInfo.getData().id) || '';

  return axios(reqOptions);
};

export const managesvr = (method, url, params, headers, userid = true) => {
  const MANAGE_SERVER = Config().ServerURL.MANAGE;
  const reqOptions = {
    method: method,
    url: `${MANAGE_SERVER}${url}`,
    data: params,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Token':
        (loginInfo.getData() != null && loginInfo.getData().token) || '',
      'Covi-User-Device-Type': 'covision.desktop.app',
      ...headers,
    },
  };

  reqOptions.headers['Covi-User-Access-ID'] = (loginInfo.getData() != null && loginInfo.getData().id) || '';

  return axios(reqOptions);
};
