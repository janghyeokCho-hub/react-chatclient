import React, { useEffect, useState } from 'react';
import { evalConnector } from '@/lib/deviceConnector';
import { withRouter, useLocation } from 'react-router-dom';
import SyncWrap from '@C/login/SyncWrap';
import { useSelector } from 'react-redux';
import useActions from '@/lib/useActions';
import { loginRequest, extLoginRequest } from '@/modules/login';
import LoadingWrap from '@COMMON/LoadingWrap';

const AutoLogin = ({ history }) => {
  const { loading, authFail, token, sync } = useSelector(
    ({ login, loading }) => ({
      token: login.token,
      authFail: login.authFail,
      loading: loading['login/REQUEST'],
      sync: loading['login/SYNC'],
    }),
  );

  const location = useLocation();

  const [onLogin] = useActions([loginRequest], []);
  const [onExtLogin] = useActions([extLoginRequest], []);
  const [isExtUser, setIsExtUser] = useState(false);

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      const appConfig = evalConnector({
        method: 'getGlobal',
        name: 'APP_SECURITY_SETTING',
      });

      let data = null;

      console.log('changeNetwork >>> ', location?.changeNetwork);

      if (appConfig.get('autoLogin')) {
        const isSecurityLevel1 = appConfig.get('securityLevel');
        console.log('isSecurityLevel1', isSecurityLevel1);

        let nip_slevel = -1;
        switch (isSecurityLevel1) {
          case -1:
            nip_slevel = -1;
            break;
          case 1:
            nip_slevel = 1;
            break;
          case 2:
            nip_slevel = 2;
            break;
        }
        data = {
          id: appConfig.get('autoLoginId'),
          pw: appConfig.get('autoLoginPw'),
          dp: process.platform,
          da: process.arch,
          al: 'Y',
          isAuto: true,
          nip_slevel: `${nip_slevel}`
        };
      } else {
        data = {
          id: appConfig.get('loginId'),
          pw: appConfig.get('loginPw'),
          dp: process.platform,
          da: process.arch,
          al: 'N',
          isAuto: false,
        };
      }

      setIsExtUser(appConfig.get('isExtUser'));

      if (appConfig.get('isExtUser')) {
        onExtLogin(data);
      } else {
        onLogin(data);
      }
    } else {
      history.push('/client/login');
    }
  }, []);

  useEffect(() => {
    if (authFail) {
      history.push('/client/login');
    } else if (token) {
      let defaultMenu = isExtUser ? 'channellist' : 'contactlist';
      if (DEVICE_TYPE == 'd') {
        const data = {
          tk: token
        };

        evalConnector({
          method: 'send',
          channel: 'save-static-config',
          message: data,
        });

        const userConfig = evalConnector({
          method: 'getGlobal',
          name: 'USER_SETTING',
        });

        const firstMenu = userConfig.get('firstMenu');
        if (firstMenu) defaultMenu = firstMenu;
      }

      history.push(`/client/main/${defaultMenu}`);
    }
  }, [authFail, token]);

  return (
    <>
      {loading && <LoadingWrap></LoadingWrap>}
      {sync && <SyncWrap></SyncWrap>}
    </>
  );
};

export default withRouter(AutoLogin);
