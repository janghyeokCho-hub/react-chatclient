import axios from 'axios';
import { managesvr } from './api';
import { getConfig, getDic } from '@/lib/util/configUtil';
import { logRenderer } from '@/lib/deviceConnector';
import { openPopup } from '@/lib/common';

export const sendConversionRequest = async params => {
  const VIEWER_SERVER = getConfig('SynapDocViewServer');
  const url = VIEWER_SERVER;
  const reqOptions = {
    method: 'get',
    url, // ex) http://192.168.11.149/SynapDocViewServer/job,
    params,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json; charset=utf-8',
      'Covi-User-Access-Token': localStorage.getItem('covi_user_access_token'),
      'Covi-User-Access-ID': localStorage.getItem('covi_user_access_id'),
      'Covi-User-Access-Version': APP_VERSION,
      'Covi-User-Device-Type':
        DEVICE_TYPE == 'd' ? 'covision.desktop.app' : 'covision.web.app',
    },
  };
  try {
    const result = await axios(reqOptions);
    return result;
  } catch (err) {
    // retry on first fail
    if (err && err.response && err.response.status === 500) {
      const retryResult = await axios(reqOptions);
      return retryResult;
    }
  }
};

export const handleSynapErrorMessage = err => {
  let message;
  const errInfo = {
    message: err.message,
    status: err.response.status,
    statusText: err.response.statusText,
    url: err.response.config.url,
    data: err.response.data,
    requestBody: err.response.config.data,
    headers: err.response.headers,
  };
  console.log('Synap Error :  ', errInfo);
  logRenderer('Synap Error :  ' + JSON.stringify(errInfo));
  if (err?.response?.status === 500) {
    // '파일이 만료되었거나 문서 변환 오류가 발생했습니다.;The file has already expired or failed to convert from the server'
    message = getDic(
      'Msg_SynapError',
      '파일이 만료되었거나 문서 변환 오류가 발생했습니다.',
    );
  } else if (err?.response?.status === 404) {
    // '문서뷰어 서버를 찾을 수 없습니다. 관리자에게 문의해주세요.;Cannot find Viewer Server. Please contact the manager.'
    message = getDic(
      'Msg_SynapFailed',
      '문서뷰어 서버를 찾을 수 없습니다. 관리자에게 문의해주세요.',
    );
  } else {
    console.log('SynapError returned invalid error: ', err);
    logRenderer('SynapError returned invalid error: ' + JSON.stringify(err));
    message = getDic(
      'Msg_Error',
      '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
    );
  }
  return message;
};

export const openSynapInBrowser = ({ url, key }) => {
  if (!url || !key) {
    return;
  }
  const findJob = url.indexOf('job');
  const baseURL = url.substring(0, findJob);
  const openURL = `${baseURL}/view/${key}`;
  if (DEVICE_TYPE == 'd') {
    window.openExternalPopup(openURL);
  } else {
    window.open(openURL);
  }
};

export const requestDecodeDRM = async ({ fileId, fileExt, roomID, token }) => {
  const DRM_SYNAP = getConfig('DRMSynap') || { use: false };
  const date = fileId?.slice(0, 8); // date: YYYYMMDD
  const endpoint = '/na/file/drm';
  const response = await managesvr('post', endpoint, {
    Domain: DRM_SYNAP?.domain,
    FilePath: `/${roomID}/${date}/`,
    FileName: `${fileId}.${fileExt}`,
    FileID: fileId,
    TokenID: token,
  });
  return response;
};

export const requestSynapViewer = async (
  dispatch,
  /**
   * Image => fileId: item.token
   * File => fileId: item.FileID
   */
  { fileType = 'URL', fileId, fileExt, roomID },
) => {
  const token = localStorage
    .getItem('covi_user_access_token')
    ?.replace(/\^/gi, '-');
  const filePath = `${window.covi.baseURL}/restful/na/nf/synabDownload/${fileId}/${token}`;
  const url = getConfig('SynapDocViewServer');
  const DRM_SYNAP = getConfig('DRMSynap') || { use: false };
  try {
    if (DRM_SYNAP?.use === true) {
      const response = await requestDecodeDRM({
        fileId,
        fileExt,
        roomID,
        token,
      });
      if (response?.data?.status !== 'SUCCESS' || !response?.data?.result) {
        openPopup(
          {
            type: 'Alert',
            message: getDic('Msg_Error'),
          },
          dispatch,
        );
        return;
      }
      const key = response.data.result.key;
      openSynapInBrowser({ url, key });
    } else {
      const response = await sendConversionRequest({
        fileType,
        filePath,
        fid: fileId,
      });
      if (!response?.data?.key) {
        return;
      }
      const key = response?.data?.key;
      openSynapInBrowser({ url, key });
    }
  } catch (err) {
    const message = handleSynapErrorMessage(err);
    openPopup(
      {
        type: 'Alert',
        message,
      },
      dispatch,
    );
    return;
  }
};
