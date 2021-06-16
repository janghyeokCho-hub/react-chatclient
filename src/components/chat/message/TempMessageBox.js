import React, { useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { reSendMessage, removeTempMessage } from '@/modules/message';
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
            name: covi.getDic('ReSend'),
            callback: () => {
              dispatch(reSendMessage(message));
            },
          },
          {
            name: covi.getDic('Delete'),
            callback: () => {
              dispatch(removeTempMessage(message.tempId));
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
                  <span className="resend"></span>
                  <span className="delete"></span>
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
                    <span className="resend"></span>
                    <span className="delete"></span>
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
