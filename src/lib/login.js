import { chatsvr, managesvr } from '@/lib/api';
const { _loginRequest } = require(`@/lib/${DEVICE_TYPE}/login`);

/**
 * 2021.01.19
 * 1. useMACAddress = true
 * Request Header의 'Covi-User-Device-MAC' 필드에 MAC Address 추가
 *
 * 2. useMACEncryption = true
 * Request Header 추가시 MAC Address 값 암호화
 */

export const loginRequest = params => {
  return _loginRequest('post', '/na/m/login', params, {
    /**
     * 2021.01.21
     * MAC Address 전송 활성화시 true로 변경하기
     */
    useMACAddress: true,
    useMACEncryption: true,
  });
};

export const extLoginRequest = params => {
  return _loginRequest('post', '/na/m/extlogin', params, {
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
