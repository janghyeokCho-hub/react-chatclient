import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ParamUtil, { encryptText } from '@/lib/util/paramUtil';
import { getAesUtil } from '@/lib/aesUtil';
import { bound } from '@/modules/menu';

const extensionList = [
  {
    extensionId: 1,
    extensionName: 'Approval',
    extensionDescription: 'Electronical Approval Application',
    extensionVersion: '0.0.1v',
    extensionUpdate: '2021-06-24 14:22:32',
    extensionLogoImgPath: '',
  },
  {
    extensionId: 2,
    extensionName: 'Mail',
    extensionDescription: 'Mail Application',
    extensionVersion: '0.0.1v',
    extensionUpdate: '2021-06-24 15:22:32',
    extensionLogoImgPath: '',
  },
  {
    extensionId: 3,
    extensionName: 'Memo',
    extensionDescription: 'Memo Application',
    extensionVersion: '0.0.1v',
    extensionUpdate: '2021-06-24 16:22:32',
    extensionLogoImgPath: '',
  },
];

const ExtensionList = () => {
  const userInfo = useSelector(({ login }) => login.userInfo);

  const [loadExtension, setLoadExtension] = useState(false);

  const [loadURL, setLoadURL] = useState('');

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      bound({ name: covi.getDic('Extension'), type: 'extension-viewer' }),
    );
  }, []);

  return (
    <div className="extension-wrap" style={{ height: '100%' }}>
      <ul>
        {extensionList.map(item => {
          return (
            <li>
              <p>{'list item => ' + item.extensionId}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExtensionList;
