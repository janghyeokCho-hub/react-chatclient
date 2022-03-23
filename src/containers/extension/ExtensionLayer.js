import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bound } from '@/modules/menu';
import ParamUtil, { encryptText } from '@/lib/util/paramUtil';
import { getAesUtil } from '@/lib/aesUtil';

import LoadingWrap from '@COMMON/LoadingWrap';

const ExtensionLayer = () => {
  const { userInfo, extensionInfo } = useSelector(({ login, extension }) => ({
    userInfo: login.userInfo,
    extensionInfo: extension.currentExtension,
  }));

  const [script, setScript] = useState(null);
  const [loadExtension, setLoadExtension] = useState(false);

  const getUserAutoLoginURL = () => {
    const AESUtil = getAesUtil();
    const pUtil = new ParamUtil('id$+|&+toDate#', userInfo);

    let hostURL = 'http://192.168.11.126:8080/covicore/eumLogin.do';

    const encryptExp = AESUtil.encrypt(pUtil.getURLParam());

    encryptText(encryptExp, AESUtil.encrypt('aes'))
      .then(response => {
        const resultData = response.data;
        console.log(resultData);

        hostURL += '?EumToken=' + resultData.result;
        hostURL += '&ReturnURL=' + encodeURIComponent('/covicore');

        console.log('hostURL: ', hostURL);

        document.getElementById('extensionView').src = hostURL;

        const extensionElement = document.getElementById('extensionView');

        extensionElement.src = hostURL;

        extensionElement.onerror = () => {
          getUserAutoLoginURL();
        };
      })
      .catch(error => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (extensionInfo) {
      setLoadExtension(true);

      if (extensionInfo.type == 'V') {
        // 이전 로드된 익스텐션 언로드
        const extension = document.getElementById(extensionInfo.extensionId);
        if (extension) extension.remove();

        const newScript = document.createElement('script');
        newScript.src = extensionInfo.downloadURL + '?t=' + new Date();
        newScript.id = extensionInfo.extensionId;

        document.body.appendChild(newScript);

        newScript.onload = () => {
          setLoadExtension(false);
        };

        newScript.onerror = () => {
          setLoadExtension(false);
        };

        setScript(newScript);
      } else {
        getUserAutoLoginURL();
        setLoadExtension(false);
      }
    }
  }, [extensionInfo]);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      bound({
        name: covi.getDic('Extension', '익스텐션'),
        type: 'extension-viewer',
      }),
    );
    return () => {
      script?.remove();
    };
  }, []);

  return (
    <div className="extension-wrap" style={{ height: '100%' }}>
      {(extensionInfo?.type == 'I' && (
        <webview
          id="extensionView"
          style={{ borderWidth: 0, width: '100%', height: '100%' }}
          useragent={
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36'
          }
        ></webview>
      )) || (
        <>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              position: 'fixed',
              padding: '15px 5px',
              right: '10px',
              top: '30px',
            }}
          >
            익스텐션 업데이트
          </button>
          <div id="extensionLayout"></div>
        </>
      )}
      {loadExtension && <LoadingWrap />}
    </div>
  );
};

export default ExtensionLayer;
