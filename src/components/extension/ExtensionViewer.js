import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ParamUtil, { encryptText } from '@/lib/util/paramUtil';
import { getAesUtil } from '@/lib/aesUtil';
import { bound } from '@/modules/menu';

const ExtensionViewer = () => {
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);
  const userInfo = useSelector(({ login }) => login.userInfo);

  const [loadExtension, setLoadExtension] = useState(false);

  const [loadURL, setLoadURL] = useState('');

  const loadExample = () => {
    const simpleExtension = document.getElementById('example');
    if (simpleExtension)
      simpleExtension.parentNode.removeChild(simpleExtension);
    const script = document.createElement('script');
    script.src = 'http://127.0.0.1:8080/SnakeExtension.js?t=' + new Date();
    script.id = 'example';
    script.onload = () => {
      setLoadExtension(false);
    };
    document.body.appendChild(script);
  };

  const gotoLink = useCallback(
    async item => {
      let url = item.url;
      let paramStr = '';

      if (item.params) {
        for (const [key, value] of Object.entries(item.params)) {
          let expressionStr = value.param;
          if (!value.plain) {
            const pUtil = new ParamUtil(value.param, userInfo);
            expressionStr = pUtil.getURLParam();
          }

          if (!!value.enc && typeof value.enc === 'string') {
            const encType = value.enc.toLowerCase();
            const AESUtil = getAesUtil();
            const encryptExp = AESUtil.encrypt(expressionStr);

            const { data } = await encryptText(
              encryptExp,
              AESUtil.encrypt(encType),
            );

            if (data.status === 'SUCCESS') {
              expressionStr = data.result;
            }
          }

          paramStr += `${
            paramStr.length > 0 ? '&' : ''
          }${key}=${encodeURIComponent(expressionStr)}`;
        }
      }

      if (paramStr.length > 0) {
        if (url.indexOf('?') > -1) {
          url = `${url}&${paramStr}`;
        } else {
          url = `${url}?${paramStr}`;
        }
      }

      return url;
    },
    [userInfo],
  );

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      bound({ name: covi.getDic('Extension'), type: 'extension-viewer' }),
    );

    // if (!loadExtension) {
    //   setLoadExtension(true);
    //   loadExample();
    // }

    const connectionLinkMetaData = {
      url: 'https://gw4j.covision.co.kr/covicore/login.do',
      params: {
        EumToken: { param: 'id$+|&+toDate#', plain: false, enc: 'aes' },
        ReturnURL: {
          param: '/groupware/portal/home.do',
          plain: true,
          enc: false,
        },
      },
    };

    gotoLink(connectionLinkMetaData).then(data => {
      console.log(data);
      document.getElementById('extension').src = data;
    });
  }, []);

  return (
    <div className="extension-wrap" style={{ height: '100%' }}>
      {/* <button
        onClick={() => {
          window.location.reload();
        }}
      >
        load extension
      </button>
      {loadExtension && <p>loading extension</p>}
      <div id="extension"> </div> */}

      <iframe
        id="extension"
        width="100%"
        height="100%"
        style={{ borderWidth: 0 }}
      ></iframe>
    </div>
  );
};

export default ExtensionViewer;
