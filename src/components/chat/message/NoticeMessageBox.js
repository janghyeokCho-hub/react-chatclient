import React, { useMemo } from 'react';
import ProfileBox from '@COMMON/ProfileBox';
import Notice from '@C/chat/message/Notice';

import { format } from 'date-fns';
import * as common from '@/lib/common';

const NoticeMessageBox = ({ message, isMine, nameBox, timeBox }) => {
  const drawMessage = useMemo(() => {
    let drawData = message.context;
    let isJSONData = common.isJSONStr(drawData);
    let drawText = '';

    if (isJSONData) {
      drawData = JSON.parse(drawData);
      drawText = drawData.context;
    } else {
      drawText = drawData;
    }

    let nameBoxVisible = nameBox;
    let senderInfo = null;
    let messageType = 'message';

    if (!(typeof message.senderInfo === 'object')) {
      senderInfo = JSON.parse(message.senderInfo);
    } else {
      senderInfo = message.senderInfo;
    }

    if (messageType == 'message') {
      drawText = common.convertURLMessage(drawText);

      // NEW LINE 처리
      drawText = drawText.replace(/\n/gi, '<NEWLINE />');
    }

    if (!isMine) {
      return (
        <>
          {drawText && (
            <>
              <li
                className={
                  nameBoxVisible
                    ? 'sent system-talk'
                    : 'text-only sent system-talk'
                }
              >
                {nameBoxVisible && (
                  <>
                    <ProfileBox
                      userId={message.sender}
                      userName={senderInfo.name}
                      img={senderInfo.photoPath}
                      handleClick={false}
                    ></ProfileBox>
                    <p className="msgname">{common.getJobInfo(senderInfo)}</p>
                  </>
                )}
                {(isJSONData && (
                  <Notice
                    type={drawData.msgType == 'C' ? 'C' : message.messageType}
                    title={drawData.title}
                    value={drawText}
                    func={drawData.func}
                  ></Notice>
                )) || (
                  <Notice type={message.messageType} value={drawText}></Notice>
                )}

                <div className="chatinfo">
                  {message.unreadCnt > 0 && message.messageType != 'I' && (
                    <span className="Unreadcount">{message.unreadCnt}</span>
                  )}
                  {timeBox && (
                    <span className="Sendtime">
                      {format(new Date(message.sendDate), 'HH:mm')}
                    </span>
                  )}
                </div>
              </li>
            </>
          )}
        </>
      );
    } else {
      return (
        <>
          {drawText && (
            <>
              <li className="replies system-talk">
                <div className="chatinfo">
                  {message.unreadCnt > 0 && message.messageType != 'I' && (
                    <span className="Unreadcount">{message.unreadCnt}</span>
                  )}
                  {timeBox && (
                    <span className="Sendtime">
                      {format(new Date(message.sendDate), 'HH:mm')}
                    </span>
                  )}
                </div>
                {(isJSONData && (
                  <Notice
                    type={drawData.msgType == 'C' ? 'C' : message.messageType}
                    title={drawData.title}
                    value={drawText}
                    func={drawData.func}
                  ></Notice>
                )) || (
                  <Notice type={message.messageType} value={drawText}></Notice>
                )}
              </li>
            </>
          )}
        </>
      );
    }
  }, [message]);

  return <>{drawMessage}</>;
};

NoticeMessageBox.defaultProps = {
  id: '',
  marking: '',
};

export default NoticeMessageBox;
