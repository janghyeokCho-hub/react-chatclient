import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import { getJobInfo } from '@/lib/common';
import Message from '@C/chat/message/Message';

const LatestMessage = () => {
  let hiddenTimer = null;

  const { latestMessage } = useSelector(({ channel }) => ({
    latestMessage: channel.messages[channel.messages.length - 1],
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

    if (!(typeof message.senderInfo === 'object')) {
      senderInfo = JSON.parse(message.senderInfo);
    } else {
      senderInfo = message.senderInfo;
    }

    return (
      <>
        <div style={{ height: '16px' }}>
          <ProfileBox
            userId={message.sender}
            userName={senderInfo.name}
            img={senderInfo.photoPath}
            handleClick={false}
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
          {message.context}
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

export default LatestMessage;
