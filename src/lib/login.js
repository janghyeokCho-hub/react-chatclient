import { evalConnector } from '@/lib/deviceConnector';
import { chatsvr, managesvr } from '@/lib/api';
import { getConfig } from './util/configUtil';
import { getAesUtil } from '@/lib/aesUtil';

/** 
 * Login wrapper for processing MAC address in desktop
*/
async function _loginRequest(method, path, params) {
  const headers = {};
  if (DEVICE_TYPE === 'd') {
    const AESUtil = getAesUtil();
    // Get MAC address from electron-main
    const addr = await evalConnector({
      method: 'invoke',
      channel: 'req-mac-address'
    });
    if (addr) {
      headers['Covi-User-Device-MAC'] = AESUtil.encrypt(addr);
    }
  }
  return managesvr(method, path, params, headers);
}

export const loginRequest = async params => {
  const isLegacyAutoLoginAPI =
    (getConfig('Legacy_AutoLogin') || false) === true;
  const url =
    !isLegacyAutoLoginAPI && params?.isAuto ? '/na/r/m/login' : '/na/m/login';
  if (isLegacyAutoLoginAPI) {
    isLegacyAutoLoginAPI && delete params.al;
    isLegacyAutoLoginAPI && delete params.nip_slevel;
    params?.isAuto && delete params.isAuto;
  }
  return _loginRequest('post', url, params);
};

export const extLoginRequest = params => {
  const isLegacyAutoLoginAPI =
    (getConfig('Legacy_AutoLogin') || false) === true;
  const url =
    !isLegacyAutoLoginAPI && params?.isAuto
      ? '/na/r/m/extlogin'
      : '/na/m/extlogin';
  if (isLegacyAutoLoginAPI) {
    isLegacyAutoLoginAPI && delete params.al;
    isLegacyAutoLoginAPI && delete params.nip_slevel;
    params?.isAuto && delete params.isAuto;
  }
  return _loginRequest('post', url, params);
};

export const logoutRequest = params => {
  return chatsvr('post', '/logout', params);
};

export const tokencheckRequest = params => {
  return managesvr('post', '/na/m/v/k', params);
};

export const loginValidationRequest = params => {
  return _loginRequest('post', '/na/m/loginVali', params);
};

export const getSystemConfigSaaS = (params) => {
  return managesvr('post', '/na/saas/config', params);
}