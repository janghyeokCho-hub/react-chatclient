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

  const handleLogin = () => {
    const AESUtil = getAesUtil();
    const encryptPassword = AESUtil.encrypt(password);

    let data = null;

    if (DEVICE_TYPE == 'd') {
      data = {
        id: userId,
        pw: encryptPassword,
        dp: process.platform,
        da: process.arch,
      };
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
    // package.json의 name을 가져올 수 없을 경우에만 eumtalk 기본설정
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
          message = covi.getDic('Msg_wrongLoginInfo');
        } else if (errStatus === 'ERROR') {
          message = covi.getDic('Msg_Error');
        } else if (errStatus === 'LIC_FAIL') {
          //2021.02.09 TODO 다국어 반영
          message = covi.getDic(
            'Msg_Fail_License',
            `라이센스가 만료되어 ${appName}을 이용하실 수 없습니다.`,
          );
        } else if (errStatus === 'ACCESS_FAIL') {
          message = covi.getDic(
            'Msg_Fail_LoginAccessDenied',
            '접근이 제한된 계정입니다',
          );
        } else if (errStatus === 'ACCOUNT_LOCK') {
          message = covi.getDic(
            'Msg_Fail_Account_Lock',
            '보안상의 이유로 계정이 비활성화되었으므로 로그인할 수 없습니다',
          );
        }
      }

      if (!message) {
        // 에러 원인을 알 수 없을 경우 출력할 기본 메시지 설정
        console.log(`Unknown status ${errStatus}`);
        message = covi.getDic('Msg_Error');
      }

      common.openPopup(
        {
          type: 'Alert',
          message,
          callback: () => {
            // initInput();

            // password만 초기화
            initPassword();
            dispatch(loginInit());
          },
        },
        dispatch,
      );
    } else if (token) {
      let defaultMenu = 'contactlist';

      if (DEVICE_TYPE == 'd') {
        const AESUtil = getAesUtil();
        const encryptPassword = AESUtil.encrypt(password);

        const data = {
          autoLoginId: userId,
          autoLoginPw: encryptPassword,
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

        const firstMenu = userConfig && userConfig.get('firstMenu');
        if (firstMenu) defaultMenu = firstMenu;
      }

      if (!isExtUser) history.push(`/client/main/${defaultMenu}`);
      else history.push('/client/main/channellist');
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
