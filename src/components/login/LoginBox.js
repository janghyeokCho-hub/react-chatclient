import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import LoadingWrap from '@COMMON/LoadingWrap';
import SelectBox from '@COMMON/buttons/SelectBox';
import MemoTextInput from '@COMMON/inputs/MemoTextInput';
import { getConfig } from '@/lib/util/configUtil';
import { evalConnector } from '@/lib/deviceConnector';
import { useDispatch } from 'react-redux';
import { openPopup } from '@/lib/common';

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

    const dispatch = useDispatch();

    useEffect(() => {
      if (DEVICE_TYPE == 'd') {
        const appConfig = evalConnector({
          method: 'getGlobal',
          name: 'APP_SECURITY_SETTING',
        });

        setAutoLogin(appConfig.get('autoLogin') ? true : false);
        setAutoLaunch(appConfig.get('autoLaunch') ? true : false);
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
                isExtUser ? covi.getDic('Email') : covi.getDic('LoginID')
              }
              onKeyPress={handleKeyPress}
              className="LoginInput"
              disabled={loading}
            ></MemoTextInput>

            <input
              ref={ref}
              type="password"
              value={password}
              placeholder={covi.getDic('Password')}
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
                ? covi.getDic('ExternalLogin')
                : covi.getDic('EmployeeLogin')}
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
                  message: covi.getDic('Msg_ApplyAndRefresh'),
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
                  checked={autoLogin}
                  onChange={e => {
                    setAutoLogin(e.target.checked);
                    handleConfig({ autoLogin: e.target.checked });
                  }}
                />
                <label htmlFor="chk01">
                  <span></span>
                  {covi.getDic('AutoLogin')}
                </label>
              </div>
              <div className="chkStyle01 mt10" style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  id="chk02"
                  checked={autoLaunch}
                  onChange={e => {
                    setAutoLaunch(e.target.checked);
                    handleConfig({ autoLaunch: e.target.checked });
                  }}
                />
                <label htmlFor="chk02">
                  <span></span>
                  {covi.getDic('AutoLaunch')}
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
