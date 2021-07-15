import React, { useEffect, useState } from 'react';
import { evalConnector } from '@/lib/deviceConnector';
import { withRouter } from 'react-router-dom';
import * as common from '@/lib/common';
import SyncWrap from '@C/login/SyncWrap';
import { useSelector, useDispatch } from 'react-redux';
import useActions from '@/lib/useActions';
import { loginRequest, extLoginRequest } from '@/modules/login';
import LoadingWrap from '@COMMON/LoadingWrap';
import { getAesUtil } from '@/lib/aesUtil';

const AutoLogin = ({ history }) => {
  const { loading, authFail, token, sync } = useSelector(
    ({ login, loading }) => ({
      token: login.token,
      authFail: login.authFail,
      loading: loading['login/REQUEST'],
      sync: loading['login/SYNC'],
    }),
  );
  const dispatch = useDispatch();

  const [onLogin] = useActions([loginRequest], []);
  const [onExtLogin] = useActions([extLoginRequest], []);
  const [isExtUser, setIsExtUser] = useState(false);
  const AESUtil = getAesUtil();

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      const appConfig = evalConnector({
        method: 'getGlobal',
        name: 'APP_SECURITY_SETTING',
      });

      const data = {
        id: appConfig.get('autoLoginId'),
        pw: appConfig.get('autoLoginPw'),
        dp: process.platform,
        da: process.arch,
        al: appConfig.get('autoLogin') ? 'Y' : 'N',
        isAuto: true,
      };

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
          tk: token,
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
