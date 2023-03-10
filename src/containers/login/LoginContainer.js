import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useActions from '@/lib/useActions';
import { loginRequest, loginInit, extLoginRequest } from '@/modules/login';
import LoginBox from '@C/login/LoginBox';
import { withRouter } from 'react-router-dom';
import { getAesUtil } from '@/lib/aesUtil';
import * as common from '@/lib/common';
import SyncWrap from '@C/login/SyncWrap';
import { evalConnector } from '@/lib/deviceConnector';
import AppInfo from '@/../package.json';
import { getConfig } from '@/lib/util/configUtil';

const LoginContainer = ({ history, location }) => {
  const { loading, authFail, errMessage, errStatus, token, sync } = useSelector(
    ({ login, loading }) => ({
      token: login.token,
      authFail: login.authFail,
      errMessage: login.errMessage,
      errStatus: login.errStatus,
      loading: loading['login/REQUEST'],
      sync: loading['login/SYNC'],
    }),
  );
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isExtUser, setIsExtUser] = useState(false);

  const dispatch = useDispatch();

  const [onLogin] = useActions([loginRequest], []);
  const [onExtLogin] = useActions([extLoginRequest], []);

  const passwordBox = useRef(null);

  const isLegacyAutoLoginAPI = getConfig('Legacy_AutoLogin', 'N') === 'Y';

  const handleLogin = () => {
    const AESUtil = getAesUtil();
    const encryptPassword = AESUtil.encrypt(password);

    let data = null;

    if (DEVICE_TYPE == 'd') {
      const appConfig = evalConnector({
        method: 'getGlobal',
        name: 'APP_SECURITY_SETTING',
      });

      data = {
        id: userId,
        pw: encryptPassword,
        dp: process.platform,
        da: process.arch,
        al: appConfig.get('autoLogin') ? 'Y' : 'N',
        isAuto: false,
      };

      appConfig.set('loginId', userId);
      appConfig.set('loginPw', encryptPassword);
    } else if (DEVICE_TYPE == 'b') {
      data = {
        id: userId,
        pw: encryptPassword,
        dp: 'browser',
        da: 'browser',
      };
    }

    if (isExtUser) {
      onExtLogin(data);
    } else {
      onLogin(data);
    }
  };

  const handleUserId = userId => {
    setUserId(userId);
  };

  const handlePassword = password => {
    setPassword(password);
  };

  const initInput = () => {
    setUserId('');
    setPassword('');
  };

  const initPassword = () => {
    setPassword('');
    passwordBox && passwordBox.current && passwordBox.current.focus();
  };

  const gotoMain = () => {
    history.push('/client');
  };

  const appName = useMemo(() => {
    // package.json??? name??? ????????? ??? ?????? ???????????? eumtalk ????????????
    return AppInfo.name || 'eumtalk';
  }, [AppInfo]);

  useEffect(() => {
    const params = location.search;
    if (params.indexOf('?type=external') > -1) {
      setIsExtUser(true);
    }
  }, []);

  useEffect(() => {
    if (authFail) {
      let message;

      if (errStatus) {
        if (errStatus === 'FAIL') {
          message = covi.getDic(
            'Msg_wrongLoginInfo',
            '????????? ?????? ??????????????? ?????????????????????.',
          );
        } else if (errStatus === 'ERROR') {
          message = covi.getDic(
            'Msg_Error',
            '????????? ??????????????????.<br/>??????????????? ??????????????????.',
          );
        } else if (errStatus === 'LIC_FAIL') {
          //2021.02.09 TODO ????????? ??????
          message = covi.getDic(
            'Msg_Fail_License',
            `??????????????? ???????????? ${appName}??? ???????????? ??? ????????????.`,
          );
        } else if (errStatus === 'ACCESS_FAIL') {
          message = covi.getDic(
            'Msg_Fail_LoginAccessDenied',
            '????????? ????????? ???????????????',
          );
        } else if (errStatus === 'ACCOUNT_LOCK') {
          message = covi.getDic(
            'Msg_Fail_Account_Lock',
            '???????????? ????????? ????????? ??????????????????????????? ???????????? ??? ????????????.',
          );
        } else if (errStatus === 'ERR_NETWORK_CHANGED') {
          message = covi.getDic(
            'Msg_Network_Changed',
            '???????????? ????????? ???????????? ?????? ???????????? ???????????????.',
          );
        }
      }

      if (!message) {
        // ?????? ????????? ??? ??? ?????? ?????? ????????? ?????? ????????? ??????
        console.log(`Unknown status ${errStatus}`);
        message = covi.getDic(
          'Msg_Error',
          '????????? ??????????????????.<br/>??????????????? ??????????????????.',
        );
      }

      common.openPopup(
        {
          type: 'Alert',
          message,
          callback: () => {
            // initInput();

            // password??? ?????????
            initPassword();
            dispatch(loginInit());
          },
        },
        dispatch,
      );
    } else if (token) {
      let defaultMenu = isExtUser ? 'channellist' : 'contactlist';

      if (DEVICE_TYPE == 'd') {
        const AESUtil = getAesUtil();
        const encryptPassword = AESUtil.encrypt(
          password,
          !isLegacyAutoLoginAPI,
        );

        const data = {
          autoLoginId: userId,
          autoLoginPw: encryptPassword,
          tk: token,
          isExtUser: isExtUser,
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

        const firstMenu = userConfig && userConfig.get('firstMenu');
        if (firstMenu) defaultMenu = firstMenu;
      }

      history.push(`/client/main/${defaultMenu}`);
    }
  }, [authFail, token]);

  return (
    <>
      {(!sync && (
        <LoginBox
          ref={passwordBox}
          loading={loading}
          onLogin={handleLogin}
          userId={userId}
          password={password}
          onChangeId={handleUserId}
          onChangePw={handlePassword}
          isExtUser={isExtUser}
          handleBack={gotoMain}
        ></LoginBox>
      )) || <SyncWrap></SyncWrap>}
    </>
  );
};

export default withRouter(LoginContainer);
