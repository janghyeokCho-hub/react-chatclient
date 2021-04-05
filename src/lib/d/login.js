import address from 'macaddress';
import { managesvr } from '@/lib/api';
import { getAesUtil } from '@/lib/aesUtil';

/**
 * 2021.01.19
 * 1. useMACAddress = true
 * Request Header의 'Covi-User-Device-MAC' 필드에 MAC Address 추가
 *
 * 2. useMACEncryption = true
 * Request Header 추가시 MAC Address 값 암호화
 */
const defaultFlag = {
    useMACAddress: true,
    useMACEncryption: true
}

async function _loginRequest_device(method, path, params, { useMACAddress, useMACEncryption } = defaultFlag) {
    const AESUtil = getAesUtil();
    if (useMACAddress) {
        try {
            // Get MAC Address
            const addr = await address.one();
            const addrString = addr.split(':').join('');
            /**
             * 2021.01.19
             * encrypt 호출 전 암호화에 필요한 값 존재하는지 체크 (singleton object 확인 필요함)
             * AESUtil.keySize
             * AESUtil.salt
             * AESUtil.passPhrase
             */
            const headers = {};
            if(useMACEncryption && AESUtil.keySize) {
                // console.log('MAC Encryption(On) : MAC Address in Request Param');
                console.log('MAC Encryption(On) : MAC Address in Request Headers');
                
                // params['Covi-User-Device-MAC'] = AESUtil.encrypt(addrString); // parameter
                headers['Covi-User-Device-MAC'] = AESUtil.encrypt(addrString); // header
                
                // console.log('request param  ', params);
                console.log('request headers  ', headers);
                
                // console.log('Original MAC Address ', addrString);
                // console.log('Encrypted MAC Address ', params['Covi-User-Device-MAC']);
                // console.log('Decrypted MAC Address  ', AESUtil.decrypt(params['Covi-User-Device-MAC']));
                // console.log(`=== Decrypted Password ${AESUtil.decrypt(params['pw'])}===`);

            } else {
                if(!useMACEncryption) {
                    console.log('[1] MAC Encryption disabled.');
                } else if (!AESUtil.keySize) {
                    console.log("[2] Cannot use AES encryption.");
                }
                
                console.log('MAC Encryption(Off) : MAC Address in Rqeuest Header')
                headers['Covi-User-Device-MAC'] = addrString;
                console.log('request header  ', headers);
            }

            return managesvr(method, path, params, headers);
        } catch(err) {
            /**
             * 2021.01.19
             * MAC Address 모듈에 문제가 발생하면 요청실패 메시지 반환 (임시)
             */
            console.log('Cannot get MAC Address ', err);
            return {
                status: 'FAIL',
                result: 'Cannot get MAC Address',
            };
        }
    }
    else {
        return managesvr(method, path, params);
    }
}

export {
    _loginRequest_device as _loginRequest
}