import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bound } from '@/modules/menu';

import LoadingWrap from '@COMMON/LoadingWrap';

const ExtensionLayer = () => {
  const extensionInfo = useSelector(
    ({ extension }) => extension.currentExtension,
  );

  const [script, setScript] = useState(null);
  const [loadExtension, setLoadExtension] = useState(false);

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

        setScript(newScript);
      } else {
        setLoadExtension(false);
      }
    }
  }, [extensionInfo]);

  const loadExample = () => {
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

    setScript(newScript);
  };

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      bound({ name: covi.getDic('Extension'), type: 'extension-viewer' }),
    );
    return () => {
      script?.remove();
    };
  }, []);

  return (
    <div className="extension-wrap" style={{ height: '100%' }}>
      {(extensionInfo?.type == 'I' && (
        <iframe
          width="100%"
          height="100%"
          src="http://192.168.11.126:8080/groupware/portal/home.do"
          style={{ borderWidth: 0 }}
        ></iframe>
      )) || (
        <>
          <button
            onClick={() => {
              // loadExample();
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
