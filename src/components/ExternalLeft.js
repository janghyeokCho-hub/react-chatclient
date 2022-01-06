import React, { useState, useEffect, useCallback } from 'react';
import ParamUtil, { encryptText } from '@/lib/util/paramUtil';
import { getConfig } from '@/lib/util/configUtil';
import { getAesUtil } from '@/lib/aesUtil';

const ExternalLeft = ({ paramObj }) => {
  const [exLink, setExLink] = useState([]);

  useEffect(() => {
    const linkConfigs = getConfig('ExternalLink', []);
    setExLink(linkConfigs);
  }, []);

  const gotoLink = useCallback(
    async item => {
      let url = item.url;
      let paramStr = '';

      if (item.params) {
        for (const [key, value] of Object.entries(item.params)) {
          let expressionStr = value.param;
          if (!value.plain) {
            const pUtil = new ParamUtil(value.param, paramObj);
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

      if (DEVICE_TYPE === 'd') {
        window.openExternalPopup(url);
      } else {
        window.open(url, '_blank');
      }
    },
    [paramObj],
  );

  return (
    <>
      {exLink &&
        exLink.map(item => {
          return (
            <li
              key={`menu-${item.title}`}
              title={item.title}
              className={['menu-li', 'menu-ex', item.cls].join(' ')}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={e => gotoLink(item)}
            ></li>
          );
        })}
    </>
  );
};

export default ExternalLeft;
