import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import {
  getJobInfo,
  eumTalkRegularExp,
  convertEumTalkProtocolPreview,
} from '@/lib/common';
import { isBlockCheck } from '@/lib/orgchart';

let hiddenTimer = null;

const LatestMessage = () => {
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const { latestMessage } = useSelector(({ room }) => ({
    latestMessage: room.messages[room.messages.length - 1],
  }));

  const [beforeId, setBeforeId] = useState(
    (latestMessage && latestMessage.messageID) || 0,
  );
  const [visible, setVisible] = useState(false);

  const handleVisible = useCallback(() => {
    setVisible(true);

    if (hiddenTimer != null) clearTimeout(hiddenTimer);
    hiddenTimer = setTimeout(() => {
      setVisible(false);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (hiddenTimer != null) clearTimeout(hiddenTimer);
    };
  }, []);

  const drawMessage = useCallback(message => {
    let senderInfo = null;
    let context = null;

    if (!(typeof message.senderInfo === 'object')) {
      senderInfo = JSON.parse(message.senderInfo);
    } else {
      senderInfo = message.senderInfo;
    }

    let isBlock = false;
    if (chineseWall?.length) {
      const targetInfo = {
        ...senderInfo,
        id: senderInfo?.sender,
      };

      const { blockChat, blockFile } = isBlockCheck({
        targetInfo,
        chineseWall,
      });
      const isFile = !!message?.File;
      isBlock = isFile ? blockFile : blockChat;
    }

    if (isBlock) {
      context = covi.getDic('BlockChat', '차단된 메시지 입니다.');
    } else {
      context = message.context;
    }

    // protocol check
    if (eumTalkRegularExp.test(context)) {
      const messageObj = convertEumTalkProtocolPreview(context);
      if (messageObj.type == 'emoticon')
        context = covi.getDic('Emoticon', '이모티콘');
      else context = messageObj.message.split('\n')[0];
    } else {
      context = context.split('\n')[0];
    }

    if (context == '') context = covi.getDic('File', '파일');

    return (
      <>
        <div style={{ height: '16px' }}>
          <ProfileBox
            userId={message.sender}
            userName={senderInfo.name}
            img={senderInfo.photoPath}
            handleClick={false}
            isInherit={true}
          ></ProfileBox>
          <p
            className="msgname"
            style={{
              display: 'block',
              float: 'left',
              fontWeight: 'bold',
              color: '#000',
            }}
          >
            {getJobInfo(senderInfo)}
            {senderInfo.isMobile === 'Y' && (
              <span style={{ padding: '0px 5px' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="9"
                  height="12"
                  viewBox="0 0 7 10"
                >
                  <g transform="translate(-185 -231)">
                    <rect
                      width="7"
                      height="10"
                      transform="translate(185 231)"
                      fill="#4f5050"
                    ></rect>
                    <rect
                      width="5"
                      height="6"
                      transform="translate(186 232)"
                      fill="#fff"
                    ></rect>
                    <circle
                      cx="0.5"
                      cy="0.5"
                      r="0.5"
                      transform="translate(188 239)"
                      fill="#fff"
                    ></circle>
                  </g>
                </svg>
              </span>
            )}
          </p>
        </div>
        <div
          className="msgtxt"
          style={{
            marginLeft: '55px',
            marginTop: '5px',
            minWidth: '150px',
            maxWidth: '300px',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {context}
        </div>
      </>
    );
  }, []);

  useEffect(() => {
    if (
      latestMessage &&
      latestMessage.messageID != beforeId &&
      latestMessage.isMine != 'Y'
    ) {
      setBeforeId(latestMessage.messageID);
      handleVisible();
    }
  }, [latestMessage]);

  return (
    <>
      {visible && (
        <div
          style={{
            float: 'right',
            backgroundColor: '#ececec',
            display: 'inline-block',
            padding: '5px 12px',
            borderRadius: '15px',
            color: '#666',
            fontSize: '12px',
            margin: '0px 50px 0 0',
            lineHeight: '16px',
            maxWidth: '400px',
          }}
        >
          {drawMessage(latestMessage)}
        </div>
      )}
    </>
  );
};

export default React.memo(LatestMessage);
