import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { evalConnector, quit, isMainWindow } from '@/lib/deviceConnector';
// import { withRouter } from 'react-router-dom';

const ErrorPage = () => {
  const { object } = useSelector(({ error }) => ({
    object: error.object,
  }));
  const [errMsg, setErrMsg] = useState(
    covi.getDic('Msg_Error', '에러가 발생했습니다.'),
  );
  useEffect(() => {
    // desktop의 경우 오류 발생 시 해당 log 저장 처리 필요
    // browser의 경우 console에 표시

    if (DEVICE_TYPE == 'b') {
      console.dir(object);
    } else {
      console.dir(object);
      evalConnector({
        method: 'send',
        channel: 'req-save-error',
        message: (object && object.stack) || 'empty message',
      });
    }
  }, []);

  const handleClose = () => {
    // 오류 발생 시 새로고침 처리
    if (DEVICE_TYPE === 'd' && isMainWindow()) {
      location.reload();
    } else {
      location.reload();
    }
  };

  const handleExist = () => {
    if (DEVICE_TYPE == 'b') {
      window.close();
    } else {
      quit();
    }
  };

  useEffect(() => {
    if (object && object.response && object.response.status === 403) {
      const newMsg = covi.getDic(
        'Msg_Error_Denied',
        '접속이 불가능합니다.<br />관리자에게 문의해주세요.',
      );
      setErrMsg(newMsg);
    } else {
      const newMsg = covi.getDic(
        'Msg_Error',
        '에러가 발생했습니다.<br />관리자에게 문의해주세요.',
      );
      setErrMsg(newMsg);
    }
  }, [object]);

  return (
    <>
      <div className="start-chat-wrap">
        <div className="posi-center" style={{ top: '20%' }}>
          <div className="start-chat-img"></div>
          <p className="infotxt mt10"></p>
        </div>
      </div>
      <div className="popup-layer-wrap" style={{ zIndex: '999!important' }}>
        <div className="popup-layer type02">
          <p
            className="normaltxt"
            dangerouslySetInnerHTML={{
              __html: errMsg,
            }}
          ></p>
          <div className="btnbox">
            <a onClick={handleExist}>
              <span className="colortxt-point">{covi.getDic('Quit')}</span>
            </a>
            <a onClick={handleClose}>
              <span className="colortxt-point">{covi.getDic('Refresh')}</span>
            </a>
          </div>
        </div>
      </div>
      <div
        className="bg_dim_layer error"
        style={{ zIndex: '998!important' }}
      ></div>
    </>
  );
};

export default ErrorPage;
