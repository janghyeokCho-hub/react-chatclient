import React, { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import Message from '@C/chat/message/Message';
import RightConxtMenu from '@C/common/popup/RightConxtMenu';
import { format } from 'date-fns';
import {
  eumTalkRegularExp,
  convertEumTalkProtocol,
  checkURL,
  convertURLMessage,
  getJobInfo,
  isJSONStr,
} from '@/lib/common';
import LinkMessageBox from '@C/chat/message/LinkMessageBox';
import FileMessageBox from '@C/chat/message/FileMessageBox';
import { useChatFontSize } from '@/hooks/useChat';
import { setMessageLinkInfo } from '@/modules/room';
import { evalConnector } from '@/lib/deviceConnector';

const MessageBox = ({
  message,
  isMine,
  isCopy,
  startMessage,
  endMessage,
  nameBox,
  timeBox,
  id,
  marking,
  getMenuData,
  isBlock,
}) => {
  const currMember = useSelector(({ room }) => room.currentRoom.members);
  const [fontSize] = useChatFontSize();
  const dispatch = useDispatch();

  const isOldMember = useMemo(() => {
    return currMember?.find(item => item.id == message.sender) === undefined;
  }, [currMember, message]);

  const handleMessageLinkInfo = useCallback(
    data => {
      dispatch(setMessageLinkInfo(data));
    },
    [dispatch],
  );

  const drawMessage = useMemo(() => {
    // 차단된 메시지 다국어 처리
    let drawText = isBlock
      ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
      : message?.context || '';
    let nameBoxVisible = nameBox;

    let senderInfo = null;

    let urlInfoJSX = null;
    let fileInfoJSX = null;

    let messageType = 'message';

    let menus = [];
    let menuId = '';
    let fileMenuId = '';
    if (!isBlock && getMenuData) {
      menus = getMenuData(message);
      menuId = `chatmessage_${message.messageID}`;
      fileMenuId = `chatfilemessage_${message.messageID}`;
    }

    const smallFontSize = Math.max(10, fontSize - 2);

    // 처리가 필요한 message의 경우 ( protocol 이 포함된 경우 )
    if (!isBlock && eumTalkRegularExp.test(drawText)) {
      const processMsg = convertEumTalkProtocol(drawText);
      messageType = processMsg.type;
      drawText = processMsg.message;
    }

    if (!isMine) {
      senderInfo = isJSONStr(message.senderInfo)
        ? JSON.parse(message.senderInfo)
        : message.senderInfo;
    }

    if (!isBlock && messageType === 'message') {
      let index = 0;

      if (drawText) {
        index = 1;
      }

      // 링크 썸네일 처리
      if (message.linkInfo) {
        let linkInfoObj = isJSONStr(message.linkInfo)
          ? JSON.parse(message.linkInfo)
          : message.linkInfo;

        if (linkInfoObj?.thumbNailInfo) {
          const linkThumbnailObj = linkInfoObj.thumbNailInfo;

          index = 2;
          urlInfoJSX = (
            <li
              className={['text-only', isMine ? 'replies' : 'sent'].join(' ')}
              key={`${message.messageID}_linkThumnail`}
            >
              {!isMine && (
                <LinkMessageBox
                  link={linkInfoObj.link}
                  thumbnailInfo={linkThumbnailObj}
                />
              )}
              {!message.fileInfos && (
                <div
                  className="chatinfo"
                  style={{ fontSize: smallFontSize, lineHeight: 'normal' }}
                >
                  {message.unreadCnt > 0 && (
                    <span className="Unreadcount">{message.unreadCnt}</span>
                  )}
                  {timeBox && (
                    <span className="Sendtime">
                      {format(new Date(message.sendDate), 'HH:mm')}
                    </span>
                  )}
                </div>
              )}
              {isMine && (
                <LinkMessageBox
                  link={linkInfoObj.link}
                  thumbnailInfo={linkThumbnailObj}
                />
              )}
            </li>
          );
        }
      } else if (!message?.linkInfo && DEVICE_TYPE !== 'b') {
        const checkURLResult = checkURL(drawText);

        if (checkURLResult.isURL) {
          evalConnector({
            method: 'once',
            channel: `onLinkThumbnailInfo_${message.messageID}`,
            callback: (_, args) => {
              handleMessageLinkInfo(args);
            },
          });

          evalConnector({
            method: 'send',
            channel: 'get-url-graph-data',
            message: {
              messageId: message.messageID,
              roomId: message.roomID,
              url: checkURLResult.url,
              returnChannel: `onLinkThumbnailInfo_${message.messageID}`,
            },
          });
        }
      }

      drawText = convertURLMessage(drawText);

      if (message.fileInfos) {
        const fileInfoJSON = isJSONStr(message.fileInfos)
          ? JSON.parse(message.fileInfos)
          : message.fileInfos;

        if (!isMine) {
          fileInfoJSX = (
            <li
              className={
                nameBoxVisible && index == 0 ? 'sent' : 'text-only sent'
              }
            >
              {nameBoxVisible && index == 0 && (
                <>
                  <ProfileBox
                    userId={message.sender}
                    userName={senderInfo.name}
                    presence={senderInfo.presence}
                    isInherit={isOldMember ? false : true}
                    img={senderInfo.photoPath}
                  ></ProfileBox>
                  <p className="msgname" style={{ fontSize }}>
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
                </>
              )}
              <RightConxtMenu menuId={fileMenuId} menus={menus}>
                <FileMessageBox
                  messageId={message.messageID}
                  fileObj={fileInfoJSON}
                  id={!drawText && id}
                />
              </RightConxtMenu>
              <div
                className="chatinfo"
                style={{ fontSize: smallFontSize, lineHeight: 'normal' }}
              >
                {message.unreadCnt > 0 && (
                  <span className="Unreadcount">{message.unreadCnt}</span>
                )}
                {timeBox && (
                  <span className="Sendtime">
                    {format(new Date(message.sendDate), 'HH:mm')}
                  </span>
                )}
              </div>
            </li>
          );
        } else {
          fileInfoJSX = (
            <li
              className={
                nameBoxVisible && index == 0 ? 'replies' : 'text-only replies'
              }
            >
              <div
                className="chatinfo"
                style={{ fontSize: smallFontSize, lineHeight: 'normal' }}
              >
                {message.unreadCnt > 0 && (
                  <span className="Unreadcount">{message.unreadCnt}</span>
                )}
                {timeBox && (
                  <span className="Sendtime">
                    {format(new Date(message.sendDate), 'HH:mm')}
                  </span>
                )}
              </div>
              <RightConxtMenu menuId={fileMenuId} menus={menus}>
                <FileMessageBox
                  messageId={message.messageID}
                  fileObj={fileInfoJSON}
                  id={!drawText && id}
                />
              </RightConxtMenu>
            </li>
          );
        }
      }

      // NEW LINE 처리
      drawText = drawText.replace(/(\r\n|\n|\r)/gi, '<NEWLINE />');
    }

    let copy = false;
    if (startMessage > 0 && endMessage > 0) {
      if (
        startMessage <= message.messageID &&
        endMessage >= message.messageID
      ) {
        copy = true;
      }
    }

    if (!isMine) {
      return (
        <>
          {drawText && (
            <>
              <li className={nameBoxVisible ? 'sent' : 'text-only sent'}>
                {copy && (
                  <div
                    className="copyBox"
                    style={{
                      position: 'absolute',
                      display: 'inline-block',
                      marginLeft: 'auto',
                      backgroundColor: '#00000044',
                      width: '150px',
                      height: '100%',
                    }}
                  ></div>
                )}
                {nameBoxVisible && (
                  <>
                    <ProfileBox
                      userId={message.sender}
                      userName={senderInfo.name}
                      presence={senderInfo.presence}
                      isInherit={isOldMember ? false : true}
                      img={senderInfo.photoPath}
                    ></ProfileBox>
                    <p className="msgname" style={{ fontSize }}>
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
                  </>
                )}
                <RightConxtMenu menuId={menuId} menus={menus}>
                  <Message
                    className={
                      messageType == 'message'
                        ? 'msgtxt'
                        : `msgtxt ${messageType}`
                    }
                    style={isCopy ? { userSelect: 'none' } : {}}
                    eleId={id}
                    marking={marking}
                    messageID={message.messageID}
                    isMine={isMine}
                  >
                    {drawText}
                  </Message>
                </RightConxtMenu>
                {!fileInfoJSX && !urlInfoJSX && (
                  <div
                    className="chatinfo"
                    style={{ fontSize: smallFontSize, lineHeight: 'normal' }}
                  >
                    {message.unreadCnt > 0 && (
                      <span className="Unreadcount">{message.unreadCnt}</span>
                    )}
                    {timeBox && (
                      <span className="Sendtime">
                        {format(new Date(message.sendDate), 'HH:mm')}
                      </span>
                    )}
                  </div>
                )}
              </li>
              {urlInfoJSX && urlInfoJSX}
            </>
          )}
          {fileInfoJSX && fileInfoJSX}
        </>
      );
    } else {
      return (
        <>
          {drawText && (
            <>
              <li className={nameBoxVisible ? 'replies' : 'text-only replies'}>
                {copy && (
                  <div
                    className="copyBox"
                    style={{
                      position: 'absolute',
                      display: 'inline-block',
                      marginLeft: 'auto',
                      backgroundColor: '#00000044',
                      width: '100%',
                      height: '100%',
                    }}
                  ></div>
                )}
                {!fileInfoJSX && !urlInfoJSX && (
                  <div
                    className="chatinfo"
                    style={{ fontSize: smallFontSize, lineHeight: 'normal' }}
                  >
                    {message.unreadCnt > 0 && (
                      <span className="Unreadcount">{message.unreadCnt}</span>
                    )}
                    {timeBox && (
                      <span className="Sendtime">
                        {format(new Date(message.sendDate), 'HH:mm')}
                      </span>
                    )}
                  </div>
                )}
                <RightConxtMenu menuId={menuId} menus={menus}>
                  <Message
                    className={
                      messageType == 'message'
                        ? 'msgtxt'
                        : `msgtxt ${messageType}`
                    }
                    style={isCopy ? { userSelect: 'none' } : {}}
                    eleId={id}
                    marking={marking}
                    messageID={message.messageID}
                    isMine={isMine}
                  >
                    {drawText}
                  </Message>
                </RightConxtMenu>
              </li>
              {urlInfoJSX && urlInfoJSX}
            </>
          )}
          {fileInfoJSX && fileInfoJSX}
        </>
      );
    }
  }, [
    message,
    marking,
    startMessage,
    endMessage,
    fontSize,
    timeBox,
    nameBox,
    isBlock,
  ]);

  return drawMessage;
};

MessageBox.defaultProps = {
  id: '',
  marking: '',
};

export default React.memo(MessageBox);
