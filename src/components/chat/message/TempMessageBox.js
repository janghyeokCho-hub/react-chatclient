import React, { useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  reSendMessage,
  removeTempMessage,
  reSendChannelMessage,
  removeChannelTempMessage,
} from '@/modules/message';
import Message from '@/components/chat/message/Message';
import {
  openPopup,
  eumTalkRegularExp,
  convertEumTalkProtocol,
} from '@/lib/common';
import FileMessageBox from './FileMessageBox';
import Config from '@/config/config';

const TempMessageBox = ({ message }) => {
  const dispatch = useDispatch();

  const handleFailMessage = useCallback(() => {
    openPopup(
      {
        type: 'Select',
        buttons: [
          {
            name: covi.getDic('ReSend', '재발송'),
            callback: () => {
              dispatch(
                message.roomType === 'C'
                  ? reSendChannelMessage(message)
                  : reSendMessage(message),
              );
            },
          },
          {
            name: covi.getDic('Delete', '삭제'),
            callback: () => {
              dispatch(
                message.roomType === 'C'
                  ? removeChannelTempMessage(message.tempId)
                  : removeTempMessage(message.tempId),
              );
            },
          },
        ],
      },
      dispatch,
    );
  }, [dispatch]);

  const drawFileContext = useMemo(() => {
    if (message.sendFileInfo) {
      const flieInfoObj = message.sendFileInfo.fileInfos;

      if (flieInfoObj.length == 1 && flieInfoObj[0].image) {
        return (
          <li className="text-only replies">
            <p className="msgtxt">
              <img
                src={flieInfoObj[0].thumbDataURL}
                width={flieInfoObj[0].width}
                height={flieInfoObj[0].height}
                alt={flieInfoObj[0].fileName}
              />
            </p>
          </li>
        );
      } else {
        return (
          <li className="text-only replies">
            <div className="chatinfo">
              {message.status === 'send' && <div className="sending"></div>}
              {message.status === 'fail' && (
                <a className="resend-delete" onClick={handleFailMessage}>
                  <span className="resend">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="23"
                      height="22"
                      viewBox="-6 -6 23 22"
                    >
                      <path
                        d="M12.794,8.064h-1.5v-.13a5.172,5.172,0,1,0-1.983,4.215L8.423,11.2A3.891,3.891,0,1,1,10,7.934v.13H8.313l2.209,2.462,2.272-2.462Z"
                        transform="translate(-0.961 -2.878)"
                        fill="#fff"
                      />
                    </svg>
                  </span>
                  <span className="delete">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="23"
                      height="22"
                      viewBox="-6 -6 23 22"
                    >
                      <g transform="translate(0 0)">
                        <g transform="translate(0 0)">
                          <path
                            d="M128.471,136.971a.621.621,0,0,0,.441.189.6.6,0,0,0,.441-.189l3.42-3.42,3.42,3.42a.621.621,0,0,0,.441.189.6.6,0,0,0,.441-.189.64.64,0,0,0,0-.892l-3.41-3.41,3.41-3.42a.64.64,0,0,0,0-.892.63.63,0,0,0-.892,0l-3.41,3.42-3.42-3.41a.631.631,0,0,0-.892.892l3.42,3.41-3.41,3.42A.608.608,0,0,0,128.471,136.971Z"
                            transform="translate(-128.279 -128.173)"
                            fill="#fff"
                          />
                        </g>
                      </g>
                    </svg>
                  </span>
                </a>
              )}
            </div>
            <FileMessageBox
              messageId={`test_${message.tempId}`}
              fileObj={flieInfoObj.length == 1 ? flieInfoObj[0] : flieInfoObj}
              tempObj={{
                status: message.status,
                handleFailMessage: handleFailMessage,
              }}
              inprogress={message.inprogress}
              total={message.total}
              isTemp={true}
            />
          </li>
        );
      }
    }
  }, [message]);

  const messageContext = useMemo(() => {
    let messageType = 'message';
    let drawText = message.context;

    // 처리가 필요한 message의 경우 ( protocol 이 포함된 경우 )
    if (eumTalkRegularExp.test(drawText)) {
      const processMsg = convertEumTalkProtocol(drawText);
      messageType = processMsg.type;
      drawText = processMsg.message;
    }

    drawText = drawText.replace(/\n/gi, '<NEWLINE />');

    return (
      <Message
        className={
          messageType == 'message' ? 'msgtxt' : `msgtxt ${messageType}`
        }
      >
        {drawText}
      </Message>
    );
  }, [message]);

  return (
    <>
      {message.messageType === 'N' && (
        <>
          <li className="text-only replies">
            {message.sendFileInfo == undefined && (
              <div className="chatinfo">
                {message.status === 'send' && <div className="sending"></div>}
                {message.status === 'fail' && (
                  <a className="resend-delete" onClick={handleFailMessage}>
                    <span className="resend">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="23"
                        height="22"
                        viewBox="-6 -6 23 22"
                      >
                        <path
                          d="M12.794,8.064h-1.5v-.13a5.172,5.172,0,1,0-1.983,4.215L8.423,11.2A3.891,3.891,0,1,1,10,7.934v.13H8.313l2.209,2.462,2.272-2.462Z"
                          transform="translate(-0.961 -2.878)"
                          fill="#fff"
                        />
                      </svg>
                    </span>
                    <span className="delete">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="23"
                        height="22"
                        viewBox="-6 -6 23 22"
                      >
                        <g transform="translate(0 0)">
                          <g transform="translate(0 0)">
                            <path
                              d="M128.471,136.971a.621.621,0,0,0,.441.189.6.6,0,0,0,.441-.189l3.42-3.42,3.42,3.42a.621.621,0,0,0,.441.189.6.6,0,0,0,.441-.189.64.64,0,0,0,0-.892l-3.41-3.41,3.41-3.42a.64.64,0,0,0,0-.892.63.63,0,0,0-.892,0l-3.41,3.42-3.42-3.41a.631.631,0,0,0-.892.892l3.42,3.41-3.41,3.42A.608.608,0,0,0,128.471,136.971Z"
                              transform="translate(-128.279 -128.173)"
                              fill="#fff"
                            />
                          </g>
                        </g>
                      </svg>
                    </span>
                  </a>
                )}
              </div>
            )}
            {message.context && messageContext}
          </li>
          {message.sendFileInfo && drawFileContext}
        </>
      )}
    </>
  );
};

export default TempMessageBox;
