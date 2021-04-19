import { chatsvr, managesvr, filesvr, imgsvr } from '@/lib/api';
import { getConfig } from '@/lib/util/configUtil';
import axios from 'axios';
//import jsonp from 'jsonp';

// ================== 추후 수정예정 ==================
export const sendConversionRequest = async (param) => {
  let method = 'get';
  // let VIEWER_SERVER = 'http://192.168.11.149/SynapDocViewServer/job/'; // 외부로 나갈시 서버URL 수정필요
  let VIEWER_SERVER = getConfig('SynapDocViewServer');
      // ...headers,
    },
  };
  return axios(reqOptions);
  let result;
  try {
    result = await axios(reqOptions);
  } catch(err) {
    // 500에러 발생시 1회 재시도
    if(err && err.response && err.response.status === 500) {
      result = await axios(reqOptions);  
    }
  }

  return result;
};
  