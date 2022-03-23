import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import LoadingWrap from '@COMMON/LoadingWrap';
import SelectBox from '@COMMON/buttons/SelectBox';
import MemoTextInput from '@COMMON/inputs/MemoTextInput';
import { getConfig } from '@/lib/util/configUtil';
import { evalConnector } from '@/lib/deviceConnector';
import { useDispatch } from 'react-redux';
import { openPopup } from '@/lib/common';
import SecurityPopup from '@COMMON/popup/SecurityPopup';

const LoginBox = forwardRef(
  (
    {
      onLogin,
      loading,
      userId,
      password,
      onChangeId,
      onChangePw,
      isExtUser,
      handleBack,
    },
    ref,
  ) => {
    const [autoLogin, setAutoLogin] = useState(false);
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [lang, setLang] = useState(covi.settings.lang);

    const [popUpVisible, setPopUpVisible] = useState(false);

    const autoLoginLock = getConfig('ForceAutoLogin', 'N') === 'Y';
    const autoLaunchLock = getConfig('ForceAutoLaunch', 'N') === 'Y';
    const IpSecurityCheck = getConfig('UseIpSecurity', {
      use: false,
      forcePolicyUse: false,
      forceValue: 0,
    });
    const [securityLevel, setSecurityLevel] = useState(
      IpSecurityCheck?.forceValue || IpSecurityCheck.forceValue,
    );

    const dispatch = useDispatch();

    useEffect(() => {
      if (DEVICE_TYPE == 'd') {
        const appConfig = evalConnector({
          method: 'getGlobal',
          name: 'APP_SECURITY_SETTING',
        });
        if (!autoLogin && autoLoginLock) {
          // 서버설정->자동로그인 강제설정일 경우 config 업데이트
          evalConnector({
            method: 'sendSync',
            channel: 'save-static-config',
            message: {
              autoLogin: true,
            },
          });
        }
        if (!autoLaunch && autoLaunchLock) {
          // 자동재시작 강제 on 설정일 경우 config 업데이트
          evalConnector({
            method: 'sendSync',
            channel: 'save-static-config',
            message: {
              autoLaunch: true,
            },
          });
        }

        setAutoLogin(
          autoLoginLock || appConfig.get('autoLogin') ? true : false,
        );
        setAutoLaunch(
          autoLaunchLock || appConfig.get('autoLaunch') ? true : false,
        );
      }
    }, []);

    const handleKeyPress = e => {
      if (e.key === 'Enter') {
        onLogin();
      }
    };

    const handleConfig = data => {
      evalConnector({
        method: 'send',
        channel: 'save-static-config',
        message: data,
      });
    };

    const clientLangList = useMemo(() => {
      const langList = getConfig('ClientLangList');

      if (typeof langList == 'object') return langList;
      else return [{ name: '한국어', value: 'ko' }];
    }, []);

    const popUpOpen = () => {
      setPopUpVisible(!popUpVisible);
    };

    return (
      <>
        {loading && <LoadingWrap />}
        {handleBack && (
          <div
            onClick={handleBack}
            style={{ position: 'absolute', padding: '10px', cursor: 'pointer' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7.131"
              height="12.78"
              viewBox="0 0 7.131 12.78"
            >
              <path
                id="패스_2901"
                data-name="패스 2901"
                d="M698.2,291.6a.524.524,0,0,0-.742.741l5.579,5.592-5.579,5.4a.524.524,0,0,0,.742.742l6.236-6.139Z"
                transform="translate(704.432 304.223) rotate(180)"
                fill="#000"
              ></path>
            </svg>
          </div>
        )}

        <div className="LoginBox">
          <h1 className="logo-img"></h1>

          {/* IP 보안 */}
          {DEVICE_TYPE == 'd' && IpSecurityCheck?.use !== false && (
            <>
              <div className="IpSecurityBox">
                <button className="IpSecurityBtn" onClick={popUpOpen}>
                  {securityLevel == -1 ? (
                    <span className="offBtn">OFF</span>
                  ) : (
                    <span className="onBtn">ON</span>
                  )}
                </button>
                <div className="IpSecurityText">
                  {covi.getDic('IpSecurity', 'IP 보안')}
                </div>
              </div>
              {popUpVisible && (
                <SecurityPopup
                  popUpVisible={popUpVisible}
                  setPopUpVisible={setPopUpVisible}
                  securityLevel={securityLevel}
                  setSecurityLevel={setSecurityLevel}
                />
              )}
            </>
          )}

          <div className="LoginInputBox">
            {/*}
            <input
              type="text"
              value={userId}
              placeholder={
                isExtUser ? covi.getDic('Email') : covi.getDic('LoginID')
              }
              onChange={e => onChangeId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="LoginInput"
              disabled={loading}
            />
            {*/}
            <MemoTextInput
              memKey="id"
              changeValue={onChangeId}
              value={userId}
              placeholder={
                isExtUser
                  ? covi.getDic('Email', '이메일')
                  : covi.getDic('LoginID', '아이디')
              }
              onKeyPress={handleKeyPress}
              className="LoginInput"
              disabled={loading}
            ></MemoTextInput>

            <input
              ref={ref}
              type="password"
              value={password}
              placeholder={covi.getDic('Password', '비밀번호')}
              onChange={e => onChangePw(e.target.value)}
              onKeyPress={handleKeyPress}
              className="LoginInput mb10"
              disabled={loading}
            />
          </div>
          <div>
            <button
              type="button"
              onClick={e => {
                onLogin();
              }}
              className="LoginBtn Type1"
              disabled={loading}
            >
              {isExtUser
                ? covi.getDic('ExternalLogin', '외부사용자 로그인')
                : covi.getDic('EmployeeLogin', '임직원 로그인')}
            </button>
          </div>
          <SelectBox
            items={clientLangList}
            order={1}
            defaultValue={lang}
            onChange={(item, canceled) => {
              openPopup(
                {
                  type: 'Confirm',
                  message: covi.getDic(
                    'Msg_ApplyAndRefresh',
                    '적용을 위해 모든창이 닫히고 앱이 새로고침 됩니다. 진행하시겠습니까?',
                  ),
                  callback: result => {
                    if (result) {
                      localStorage.setItem('covi_user_lang', item.value);

                      if (DEVICE_TYPE == 'd') {
                        handleConfig({ lang: item.value });
                        evalConnector({
                          method: 'send',
                          channel: 'reload-app',
                          message: { clearConfigs: true, isLangChange: true },
                        });
                        // reload App
                      } else {
                        location.reload();
                      }
                    } else {
                      canceled();
                    }
                  },
                },
                dispatch,
              );
            }}
          ></SelectBox>
          {DEVICE_TYPE == 'd' && (
            <>
              <div className="chkStyle01" style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  id="chk01"
                  disabled={autoLoginLock === true}
                  checked={autoLogin}
                  onChange={e => {
                    // 자동로그인 강제설정일 경우 자동로그인 변경 X
                    if (autoLoginLock) {
                      return;
                    }

                    setAutoLogin(e.target.checked);
                    handleConfig({ autoLogin: e.target.checked });
                  }}
                />
                <label htmlFor="chk01">
                  <span
                    style={{ backgroundColor: autoLoginLock ? '#999' : '' }}
                  ></span>
                  {covi.getDic('AutoLogin', '자동로그인')}
                </label>
              </div>
              <div className="chkStyle01 mt10" style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  id="chk02"
                  checked={autoLaunch}
                  onChange={e => {
                    if (autoLaunchLock) {
                      return;
                    }
                    setAutoLaunch(e.target.checked);
                    handleConfig({ autoLaunch: e.target.checked });
                  }}
                />
                <label htmlFor="chk02">
                  <span
                    style={{ backgroundColor: autoLaunchLock ? '#999' : '' }}
                  ></span>
                  {covi.getDic('AutoLaunch', '시작 시 자동실행')}
                </label>
              </div>
            </>
          )}
        </div>
        {/*
      TODO: 아래 기능 구현되면 표시
      <div className="LoginBottom">
        <Link to="/client/login/password">비밀번호 재설정</Link>
          </div>*/}
      </>
    );
  },
);
export default LoginBox;
