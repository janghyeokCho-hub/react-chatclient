import { chatsvr, managesvr, filesvr, imgsvr } from '@/lib/api';
import { getConfig } from '@/lib/util/configUtil';
import axios from 'axios';
//import jsonp from 'jsonp';

// ================== 추후 수정예정 ==================
export const sendConversionRequest = async (param) => {
  let method = 'get';
  // let VIEWER_SERVER = 'http://192.168.11.149/SynapDocViewServer/job/'; // 외부로 나갈시 서버URL 수정필요
  let VIEWER_SERVER = getConfig('SynapDocViewServer');
  let url = `?fileType=${param.fileType}&filePath=${param.filePath}&fid=${param.fid}`
    //  ========================
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
    url: `${VIEWER_SERVER}${url}`,
    // url: `http://192.168.11.149/SynapDocViewServer/job/${url}`,
    data: param,
    headers: {
      'Content-Type' : 'application/json',
      'User-Agent' : 'PostmanRuntime/7.26.5'
    },
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Token': localStorage.getItem('covi_user_access_token'),
      'Covi-User-Access-ID': localStorage.getItem('covi_user_access_id'),
      'Covi-User-Access-Version': APP_VERSION,
      'Covi-User-Device-Type':
        DEVICE_TYPE == 'd' ? 'covision.desktop.app' : 'covision.web.app',
      // ...headers,
    },
  };
  let result;
  try {
    result = await axios(reqOptions);
  } catch(err) {
    if(err && err.response && err.response.status === 500) {
      try {
        result = await axios(reqOptions);
      } catch(retryErr) {
        throw retryErr;
      }
    } else {
      throw err;
    }
  }
  return result;
};
