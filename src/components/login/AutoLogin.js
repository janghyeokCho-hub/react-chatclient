import React, { useEffect } from 'react';
import { evalConnector } from '@/lib/deviceConnector';
import { withRouter } from 'react-router-dom';
import * as common from '@/lib/common';
import SyncWrap from '@C/login/SyncWrap';
import { useSelector, useDispatch } from 'react-redux';
import useActions from '@/lib/useActions';
import { loginRequest } from '@/modules/login';
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
  const dispatch = useDispatch();

  const [onLogin] = useActions([loginRequest], []);

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      const appConfig = evalConnector({
        method: 'getGlobal',
        name: 'APP_SETTING',
      });

      const data = {
        id: appConfig.get('autoLoginId'),
        pw: appConfig.get('autoLoginPw'),
        dp: process.platform,
        da: process.arch,
      };

      onLogin(data);
    } else {
      history.push('/client/login');
    }
  }, []);

  useEffect(() => {
    if (authFail) {
      history.push('/client/login');
    } else if (token) {
      let defaultMenu = 'contactlist';
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
