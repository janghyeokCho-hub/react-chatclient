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
          message: covi.getDic('Msg_InvalidApproach', '잘못된 접근입니다.'),
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
              alertMsg = covi.getDic('Msg_JoinSuccess', '가입되었습니다.');
            } else if (data.status == 'FAIL') {
              alertMsg = covi.getDic(
                'Msg_JoinFail',
                '초대된 사용자가 아닙니다.',
              );
            } else if (data.status == 'ERROR') {
              alertMsg = covi.getDic(
                'Msg_Error',
                '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
              );
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
      return covi.getDic('Msg_MissingItems', '누락된 항목이 존재합니다.');
    } else if (password == '') {
      return covi.getDic('Msg_MissingItems', '누락된 항목이 존재합니다.');
    } else if (passwordChk == '') {
      return covi.getDic('Msg_MissingItems', '누락된 항목이 존재합니다.');
    } else if (name == '') {
      return covi.getDic('Msg_MissingItems', '누락된 항목이 존재합니다.');
    } else if (password !== passwordChk) {
      return covi.getDic(
        'Msg_ComparePwdErr',
        '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      );
    } else {
      return true;
    }
  }, [email, password, passwordChk, name]);

  return (
    <div className="LoginWrap">
      <div className="JoinBox">
        <div className="JoinBox_inputWrap">
          <p className="JoinBox_tit">
            {covi.getDic('GenAccount', '계정 생성')}
          </p>
          <div className="JoinBox_info">
            <p
              className="JoinBox_info_p"
              dangerouslySetInnerHTML={{
                __html: covi.getDic(
                  'Msg_JoinExUser',
                  '외부사용자 계정을 생성합니다.<br />계정 생성 시, 초대된 채널에 가입됩니다.',
                ),
              }}
            ></p>
          </div>
          <div className="input full">
            <label className="string optional" for="secretCode">
              {covi.getDic('SecretCode', '인증코드')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('SecretCode', '인증코드')}
              type="text"
              value={secretCode}
              disabled="disabled"
            />
          </div>
          <div className="input full">
            <label className="string optional" for="email">
              {covi.getDic('Email', '이메일')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('Email', '이메일')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <p
              className="email_info"
              dangerouslySetInnerHTML={{
                __html: covi.getDic(
                  'Msg_JoinExEmail',
                  '로그인 시 사용할 이메일 입니다.<br/>초대 메일을 받은 이메일 주소를 입력해주세요.',
                ),
              }}
            ></p>
          </div>
          <div className="input full">
            <label className="string optional" for="password">
              {covi.getDic('Password', '비밀번호')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('Password', '비밀번호')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="input full">
            <label className="string optional" for="password">
              {covi.getDic('PasswordConfirm', '비밀번호 확인')}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic('PasswordConfirm', '비밀번호 확인')}
              type="password"
              value={passwordChk}
              onChange={e => setPasswordChk(e.target.value)}
            />
          </div>
          {/* 2021.06.29
           * '이름'필드의 제목을 커스터마이징 할 경우가 아니라면
           * InviteExtUser_Name 다국어를 추가하지 않는다.
           */}
          <div className="input full">
            <label className="string optional" for="name">
              {covi.getDic('InviteExtUser_Name', covi.getDic('Name'))}
              <span className="tx_must">*</span>
            </label>
            <input
              className="string optional"
              placeholder={covi.getDic(
                'InviteExtUser_Name',
                covi.getDic('Name'),
              )}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        </div>
        <button className="LoginBtn Type1" type="button" onClick={handleClick}>
          {covi.getDic('Join', '가입하기')}
        </button>
        {!agentDetect.mobile() && (
          <div className="LoginBottom">
            <a
              onClick={() => {
                history.push('/client/login');
              }}
            >
              {covi.getDic(
                'Msg_ExExistAccount',
                '이미 계정이 있으세요? 로그인하기',
              )}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinForm;
