import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { openPopup } from '@/lib/common';
import { getSysMsgFormatStr } from '@/lib/common';

var MobileDetect = require('mobile-detect'),
  agentDetect = new MobileDetect(window.navigator.userAgent);

const loginURL = '/client/login?type=external';
let domainURL = window.covi.baseURL;
if (domainURL == '') domainURL = window.location.origin;
const downloadURL = domainURL + '/down';
console.log(downloadURL);
const isMobile = agentDetect.mobile();
const JoinSuccess = ({ location, history }) => {
  let name, logonID;
  const dispatch = useDispatch();
  if (location.state) {
    console.log(location.state);
    name = location.state.name;
    logonID = location.state.logonID;
  }
  if (!name || !logonID) {
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
    return null;
  }
  const welcomeMsg = isMobile
    ? covi.getDic(
        'JoinSuccess_welcome_msg_mobile',
        '앱에서 생성하신 계정으로 로그인시면 이음톡의 서비스를 이용하실수 있습니다.<br/>아래 버튼을 클릭하여 앱을 다운로드 받으세요',
      )
    : covi.getDic(
        'JoinSuccess_welcome_msg_desktop',
        '생성하신 계정으로 로그인하여 이음톡의 서비스를 이용하세요.<br/> 이음톡 앱을 다운로드 받으시면 보다 편리하게 사용하실 수 있습니다.',
      );
  return (
    <div className="LoginWrap">
      <div className="JoinBox successWelcome">
        <p className="JoinBox_tit welcome_title">
          {covi.getDic('JoinSuccess_welcomeTitle', '환영합니다!')}
        </p>
        <div className="JoinBox_info" style={{ userSelect: 'text' }}>
          <p
            className="JoinBox_info_p welcome_info_p1"
            dangerouslySetInnerHTML={{
              __html: getSysMsgFormatStr(
                covi.getDic(
                  'JoinSuccess_welcome_notice_userName',
                  '%s님, 이음톡 가입을 환영합니다.',
                ),
                [{ type: 'Plain', data: name }],
              ),
            }}
          ></p>
          <p
            className="JoinBox_info_p welcome_info_p1"
            dangerouslySetInnerHTML={{
              __html: getSysMsgFormatStr(
                covi.getDic(
                  'JoinSuccess_welcome_notice_userMail',
                  '%s님의 아이디는 <b style="font-size: 18px;">%s</b> 입니다.',
                ),
                [
                  { type: 'Plain', data: name },
                  { type: 'Plain', data: logonID },
                ],
              ),
            }}
          ></p>
          <p
            className="JoinBox_info_p welcome_info_p2"
            dangerouslySetInnerHTML={{
              __html: welcomeMsg,
            }}
          />
        </div>
        <div className="welcomeBtn_div">
          {!isMobile ? (
            <div>
              <button
                className="LoginBtn Type1"
                type="button"
                onClick={() => {
                  history.push(loginURL);
                }}
              >
                {covi.getDic('Login', '로그인')}
              </button>
              <button
                className="LoginBtn Type2"
                type="button"
                style={{ border: '1px solid #999999' }}
                onClick={() => {
                  window.location.href = downloadURL;
                }}
              >
                {covi.getDic('App_Down', 'APP 다운로드')}
              </button>
            </div>
          ) : (
            <button
              className="LoginBtn Type1"
              type="button"
              onClick={() => {
                window.location.href = downloadURL;
              }}
            >
              {covi.getDic('App_Down', 'APP 다운로드')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default JoinSuccess;
