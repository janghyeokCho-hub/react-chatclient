import React, { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import ProfileBox from '@COMMON/ProfileBox';
import Message from '@C/channels/message/Message';
import RightConxtMenu from '@C/common/popup/RightConxtMenu';
import { format } from 'date-fns';
import {
  convertURLMessage,
  checkURL,
  getJobInfo,
  convertEumTalkProtocol,
  eumTalkRegularExp,
} from '@/lib/common';
import LinkMessageBox from '@C/chat/message/LinkMessageBox'; // 그대로 사용
import FileMessageBox from '@C/chat/message/FileMessageBox'; // 그대로 사용
import { useChatFontSize } from '@/hooks/useChat';

import { setMessageLinkInfo } from '@/modules/channel';

import { evalConnector } from '@/lib/deviceConnector';

const MessageBox = ({
  message,
  isMine,
  nameBox,
  timeBox,
  id,
  marking,
  getMenuData,
  isBlock,
}) => {
  const [fontSize] = useChatFontSize();
  const currMember = useSelector(
    ({ room, channel }) =>
      room.currentRoom?.members || channel.currentChannel?.members,
  );
  const loading = useSelector(
    ({ loading }) => loading['channel/GET_CHANNEL_INFO'],
  );
  const loginId = useSelector(({ login }) => login.id);

  const dispatch = useDispatch();
  const { data: searchOptionState } = useSWR('message/search', null);

  const isOldMember = useMemo(() => {
    return !loading && typeof currMember != 'undefined'
      ? currMember.find(item => item.id == message.sender) == undefined
      : loading;
  }, [currMember, loading]);

  const handleMessageLinkInfo = useCallback(
    args => {
      dispatch(setMessageLinkInfo(args));
    },
    [dispatch],
  );

  const drawMessage = useMemo(() => {
    let drawText = isBlock
      ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
      : message?.context || '';
    let nameBoxVisible = nameBox;

    let senderInfo = null;

    let urlInfoJSX = null;
    let fileInfoJSX = null;

    let messageType = 'message';
    let mentionInfo = [];

    let menus = [];
    let menuId = '';
    let fileMenuId = '';
    if (!isBlock && getMenuData) {
      menus = getMenuData(message);
      menuId = `channelmessage_${message.messageID}`;
      fileMenuId = `channelfilemessage_${message.messageID}`;
    }

    let _marking = null;

    if (!isMine) {
      if (!(typeof message.senderInfo === 'object')) {
        senderInfo = JSON.parse(message.senderInfo);
      } else {
        senderInfo = message.senderInfo;
      }
    }

    if (searchOptionState?.type === 'Context') {
      _marking = marking;
    } else if (
      searchOptionState?.type === 'Note_Sender' &&
      searchOptionState?.value &&
      message?.sender
    ) {
      if (message.sender === searchOptionState.value) {
        _marking = '.*';
      }
    }

    const smallFontSize = Math.max(10, fontSize - 2);
    // protocol check
    if (!isBlock && eumTalkRegularExp.test(drawText)) {
      const processMsg = convertEumTalkProtocol(drawText);
      messageType = processMsg.type;
      drawText = processMsg.message;
      mentionInfo = processMsg.mentionInfo;
    }

    if (!isBlock && messageType == 'message') {
      let index = 0;
      if (drawText) {
        index = 1;
      }
      // 링크 썸네일 처리
      if (message.linkInfo) {
        let linkInfoObj = null;
        if (typeof message.linkInfo == 'object') {
          linkInfoObj = message.linkInfo;
        } else {
          linkInfoObj = JSON.parse(message.linkInfo);
        }

        drawText = convertURLMessage(drawText);

        if (linkInfoObj.thumbNailInfo) {
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
                <div className="chatinfo">
                  {timeBox && (
                    <span
                      className="Sendtime"
                      style={{ fontSize: smallFontSize }}
                    >
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
      } else if (message.linkInfo == null && DEVICE_TYPE != 'b') {
        const checkURLResult = checkURL(drawText);

        if (checkURLResult.isURL) {
          evalConnector({
            method: 'once',
            channel: `onLinkThumbnailInfo_${message.messageID}`,
            callback: (event, args) => {
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

      if (message.fileInfos) {
        const fileInfoJSON = JSON.parse(message.fileInfos);

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
              <div className="chatinfo">
                {timeBox && (
                  <span
                    className="Sendtime"
                    style={{ fontSize: smallFontSize }}
                  >
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
                className="copyBox"
                style={{
                  backgroundColor: '#00000055',
                  width: 150,
                  height: '100%',
                }}
              ></div>
              <div className="chatinfo">
                {timeBox && (
                  <span
                    className="Sendtime"
                    style={{ fontSize: smallFontSize }}
                  >
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

      // Tag 처리
      const tagPattern = new RegExp(/(#)([a-z가-힣0-9ㄱ-ㅎ]+)/, 'gmi');
      drawText = drawText.replace(tagPattern, `<TAG text="$1$2" value="$2" />`);

      // Mention 처리
      if (mentionInfo.length > 0) {
        mentionInfo.map((m, idx) => {
          const member = currMember.find(item => item.id == m.id);
          if (member) {
            mentionInfo[idx] = { isMine: member.id == loginId, ...member };
          }
        });
      }

      // NEW LINE 처리
      drawText = drawText.replace(/\n/gi, '<NEWLINE />');
    }

    if (!isMine) {
      return (
        <>
          {drawText && (
            <>
              <li className={nameBoxVisible ? 'sent' : 'text-only sent'}>
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
                    eleId={id}
                    marking={_marking}
                    mentionInfo={mentionInfo}
                    isMine={isMine}
                  >
                    {drawText}
                  </Message>
                </RightConxtMenu>
                {!fileInfoJSX && !urlInfoJSX && (
                  <div className="chatinfo">
                    {timeBox && (
                      <span
                        className="Sendtime"
                        style={{ fontSize: smallFontSize }}
                      >
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
          <li className={nameBoxVisible ? 'replies' : 'text-only replies'}>
            <div
              className="copyBox"
              style={{
                backgroundColor: '#00000055',
                width: 150,
                height: '100%',
              }}
            ></div>
            {!fileInfoJSX && !urlInfoJSX && (
              <div className="chatinfo">
                {timeBox && (
                  <span
                    className="Sendtime"
                    style={{ fontSize: smallFontSize }}
                  >
                    {format(new Date(message.sendDate), 'HH:mm')}
                  </span>
                )}
              </div>
            )}
            <RightConxtMenu menuId={menuId} menus={menus}>
              {drawText ? (
                <Message
                  className={
                    messageType == 'message'
                      ? 'msgtxt'
                      : `msgtxt ${messageType}`
                  }
                  eleId={id}
                  marking={_marking}
                  mentionInfo={mentionInfo}
                  isMine={isMine}
                >
                  {drawText}
                </Message>
              ) : (
                fileInfoJSX
              )}
            </RightConxtMenu>
          </li>
          {urlInfoJSX && urlInfoJSX}
          {message.context && fileInfoJSX && fileInfoJSX}
        </>
      );
    }
  }, [
    message,
    marking,
    fontSize,
    nameBox,
    timeBox,
    isBlock,
    searchOptionState,
  ]);

  return drawMessage;
};

MessageBox.defaultProps = {
  id: '',
  marking: '',
};

export default React.memo(MessageBox);
