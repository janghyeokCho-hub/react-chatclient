import React from 'react';
import { useDispatch } from 'react-redux';
import { openPopup } from '@/lib/common';
import { getSysMsgFormatStr } from '@/lib/common';
import ReactTooltip from 'react-tooltip';
import QuestionIcon from '@/icons/svg/QuestionIcon';
import { DomianEnterImg } from '@/image/base64StringImg';

let domainURL = window.covi.baseURL;
if (domainURL == '') domainURL = window.location.origin;
const downloadURL = domainURL + '/down';

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

  const toolTipMsg = `<img src=${DomianEnterImg} width="300" />`;

  return (
    <div className="LoginWrap">
      <div className="Join_Success_Box successWelcome">
        <h1 className="logo-img"/>
        <p className="JoinBox_tit welcome_title">
          {covi.getDic('JoinSuccess_welcomeTitle', '환영합니다!')}
        </p>
        <div className="welcome_context" style={{ userSelect: 'text' }}>
          <p
            className="JoinBox_info_p welcome_info_p2"
            dangerouslySetInnerHTML={{
              __html: getSysMsgFormatStr(
                covi.getDic(
                  'JoinSuccess_welcome_notice_userName',
                  '%s님, 이음톡 가입을 환영합니다.',
                ),
                [{ type: 'Plain', data: name }],
              ),
            }}
          />
          <p
            className="JoinBox_info_p welcome_info_p1"
            dangerouslySetInnerHTML={{
              __html: getSysMsgFormatStr(
                covi.getDic(
                  'JoinSuccess_welcome_notice_userMil',
                  '%s님의 아이디는 <b>%s</b> 입니다.',
                ),
                [
                  { type: 'Plain', data: name },
                  { type: 'Plain', data: logonID },
                ],
              ),
            }}
          />
          <p className="JoinBox_info_p welcome_info_p2">
            {covi.getDic(
              'JoinSuccess_welcome_msg',
              '앱 다운로드를 통해 이음톡 서비스를 이용하실 수 있습니다.',
            )}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <p
              className="JoinBox_info_p welcome_info_p2"
              dangerouslySetInnerHTML={{
                __html: getSysMsgFormatStr(
                  covi.getDic(
                    'JoinSuccess_domian_Info_Msg',
                    '앱 실행 시 도메인 <b style="color: blue;">%s</b>을 입렵해 주세요.',
                  ),
                  [{ type: 'Plain', data: domainURL }],
                ),
              }}
            />
            <span data-tip={toolTipMsg} data-html={true}>
              <QuestionIcon />
            </span>
          </div>
        </div>
        <div className="welcomeBtn_div">
          <button
            className="LoginBtn Type1"
            type="button"
            onClick={() => {
              window.location.href = downloadURL;
            }}
          >
            {covi.getDic('App_Down', 'APP 다운로드')}
          </button>
        </div>
        <ReactTooltip />
      </div>
    </div>
  );
};
export default JoinSuccess;
