import { chatsvr, managesvr } from '@/lib/api';
import { getConfig } from './util/configUtil';

const { _loginRequest } = require(`@/lib/${DEVICE_TYPE}/login`);

/**
 * 2021.01.19
 * 1. useMACAddress = true
 * Request Header의 'Covi-User-Device-MAC' 필드에 MAC Address 추가
 *
 * 2. useMACEncryption = true
 * Request Header 추가시 MAC Address 값 암호화
 */

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
  const res = await _loginRequest('post', url, params, {
    /**
     * 2021.01.21
     * MAC Address 전송 활성화시 true로 변경하기
     */
    useMACAddress: true,
    useMACEncryption: true,
  });
  return res;
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
  return _loginRequest('post', url, params, {
    // useMACAddress 비활성화시 useMACEncryption 사용 안함
    useMACAddress: true,
    useMACEncryption: true,
  });
};

export const logoutRequest = params => {
  return chatsvr('post', '/logout', params);
};

export const tokencheckRequest = params => {
  return managesvr('post', '/na/m/v/k', params);
};

export const loginValidationRequest = params => {
  return _loginRequest('post', '/na/m/loginVali', params, {
    useMACAddress: true,
    useMACEncryption: true,
  });
};
