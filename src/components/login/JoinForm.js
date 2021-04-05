import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { openPopup } from '@/lib/common';
import * as channelApi from '@/lib/channel';
import { getAesUtil } from '@/lib/aesUtil';

var MobileDetect = require('mobile-detect'),
  agentDetect = new MobileDetect(window.navigator.userAgent);

//const loginURL = '/client/login?type=external';
const successURL = '/client/login/joinsucess';

const JoinForm = ({ location, history }) => {
  const params = location.search;

  const [secretCode, setSecretCode] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordChk, setPasswordChk] = useState('');
  const [name, setName] = useState('');

  const dispatch = useDispatch();

  useEffect(() => {
    checkSecretCode();
  }, []);

  const checkSecretCode = useCallback(async () => {
    let status = false;

    if (params != '' && params.indexOf('code=') > -1) {
      const urlParam = params.replace('?code=', '');

      if (urlParam != '') {
        const responce = await channelApi.checkSecretCode({
          secretCode: urlParam,
        });

        if (responce.data.status == 'SUCCESS') {
          status = true;

          setSecretCode(Buffer.from(urlParam, 'base64').toString('utf8'));
        }
      }
    }

    if (!status) {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_InvalidApproach'), // 잘못된 접근입니다.
          callback: () => {
            history.goBack();
          },
        },
        dispatch,
      );
    }
  }, [dispatch]);

  const handleClick = useCallback(
    e => {
      const valiReturn = checkValidation();
      if (valiReturn === true) {
        const AESUtil = getAesUtil();
        const encryptPassword = AESUtil.encrypt(password);

        // 로딩중

        channelApi
          .joinExternalUser({
            secretCode,
            email,
            password: encryptPassword,
            name,
          })
          .then(({ data }) => {
            let alertMsg = '';
            if (data.status == 'SUCCESS') {
              // 로딩중 끝
              alertMsg = covi.getDic('Msg_JoinSuccess');
            } else if (data.status == 'FAIL') {
              alertMsg = covi.getDic('Msg_JoinFail');
            } else if (data.status == 'ERROR') {
              alertMsg = covi.getDic('Msg_Error');
            }
            openPopup(
              {
                type: 'Alert',
                message: alertMsg,
                callback: () => {
                  if (data.status == 'SUCCESS') {
                    history.push({
                      pathname: successURL,
                      state: {
                        name: name,
                        logonID: data.logonID,
                      },
                    });
                  }
                },
              },
              dispatch,
            );
          });
      } else {
        openPopup(
          {
            type: 'Alert',
            message: valiReturn,
          },
          dispatch,
        );
      }
    },
    [secretCode, email, password, passwordChk, name],
  );

  const checkValidation = useCallback(() => {
    if (email == '') {
      return covi.getDic('Msg_MissingItems');
    } else if (password == '') {
      return covi.getDic('Msg_MissingItems');
    } else if (passwordChk == '') {
      return covi.getDic('Msg_MissingItems');
    } else if (name == '') {
      return covi.getDic('Msg_MissingItems');
    } else if (password !== passwordChk) {
      return covi.getDic('Msg_ComparePwdErr');
    } else {
      return true;
    }
  }, [email, password, passwordChk, name]);

  return (
    <div className="LoginWrap">
      <div className="JoinBox">
        <div className="JoinBox_inputWrap">
          <p className="JoinBox_tit">{covi.getDic('GenAccount')}</p>
          <div className="JoinBox_info">
            <p
              className="JoinBox_info_p"
              dangerouslySetInnerHTML={{
                __html: covi.getDic('Msg_JoinExUser'),
              }}
            ></p>
          </div>
          <div className="input full">
            <label className="string optional" for="secretCode">
              {covi.getDic('SecretCode')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('SecretCode')}
              type="text"
              value={secretCode}
              disabled="disabled"
            />
          </div>
          <div className="input full">
            <label className="string optional" for="email">
              {covi.getDic('Email')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('Email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <p
              className="email_info"
              dangerouslySetInnerHTML={{
                __html: covi.getDic('Msg_JoinExEmail'),
              }}
            ></p>
          </div>
          <div className="input full">
            <label className="string optional" for="password">
              {covi.getDic('Password')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('Password')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="input full">
            <label className="string optional" for="password">
              {covi.getDic('PasswordConfirm')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('PasswordConfirm')}
              type="password"
              value={passwordChk}
              onChange={e => setPasswordChk(e.target.value)}
            />
          </div>
          <div className="input full">
            <label className="string optional" for="name">
              {covi.getDic('Name')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('Name')}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        </div>
        <button className="LoginBtn Type1" type="button" onClick={handleClick}>
          {covi.getDic('Join')}
        </button>
        {!agentDetect.mobile() && (
          <div className="LoginBottom">
            <a
              onClick={() => {
                history.push('/client/login');
              }}
            >
              {covi.getDic('Msg_ExExistAccount')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinForm;
