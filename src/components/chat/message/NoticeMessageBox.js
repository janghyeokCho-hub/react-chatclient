import React, { useMemo } from 'react';
import ProfileBox from '@COMMON/ProfileBox';
import Notice from '@C/chat/message/Notice';

import { format } from 'date-fns';
import * as common from '@/lib/common';
import { useChatFontSize } from '@/hooks/useChat';

const NoticeMessageBox = ({ message, isMine, nameBox, timeBox }) => {
  const [fontSize] = useChatFontSize();

  const drawMessage = useMemo(() => {
    let drawData = message.context;
    let isJSONData = common.isJSONStr(drawData);
    let drawText = '';

    const smallFontSize = Math.max(10, fontSize - 2);

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
                    <p className="msgname" style={{ fontSize }}>{common.getJobInfo(senderInfo)}</p>
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

                <div className="chatinfo" style={{ fontSize: smallFontSize, lineHeight: 'normal' }}>
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
                <div className="chatinfo" style={{ fontSize: smallFontSize, lineHeight: 'normal' }}>
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
  }, [message, fontSize]);

  return <>{drawMessage}</>;
};

NoticeMessageBox.defaultProps = {
  id: '',
  marking: '',
};

export default NoticeMessageBox;
