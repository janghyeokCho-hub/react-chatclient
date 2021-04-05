import React, { useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import Message from '@C/channels/message/Message';
import RightConxtMenu from '@C/common/popup/RightConxtMenu';
import { format } from 'date-fns';
import * as common from '@/lib/common';
import LinkMessageBox from '@C/chat/message/LinkMessageBox'; // 그대로 사용
import FileMessageBox from '@C/chat/message/FileMessageBox'; // 그대로 사용

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
}) => {
  const roomId = useSelector(({ channel }) => channel.currentChannel.roomId);
  const currMember = useSelector(
    ({ channel }) => channel.currentChannel.members,
  );
  const loading = useSelector(
    ({ loading }) => loading['channel/GET_CHANNEL_INFO'],
  );
  const loginId = useSelector(({ login }) => login.id);

  const dispatch = useDispatch();

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
    let drawText = (message.context && message.context) || '';
    let nameBoxVisible = nameBox;

    let senderInfo = null;

    let urlInfoJSX = null;
    let fileInfoJSX = null;

    let messageType = 'message';
    let mentionInfo = [];

    // protocol check
    if (common.eumTalkRegularExp.test(drawText)) {
      const processMsg = common.convertEumTalkProtocol(drawText);
      messageType = processMsg.type;
      drawText = processMsg.message;
      mentionInfo = processMsg.mentionInfo;
    }

    if (!isMine) {
      if (!(typeof message.senderInfo === 'object')) {
        senderInfo = JSON.parse(message.senderInfo);
      } else {
        senderInfo = message.senderInfo;
      }
    }

    if (messageType == 'message') {
      // 2. 검색 시 marking 처리 ---> marking은 props로 최하위 컴포넌트 까지 전달
      /*
      if (marking) {
        const regExp = new RegExp(marking, 'gi');
        drawText = drawText.replace(regExp, item => {
          return `<span style='background-color : #222; color : #fff;'>${item}</span>`;
        });
      }
      */

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

        drawText = common.convertURLMessage(drawText);

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
      } else if (message.linkInfo == null && DEVICE_TYPE != 'b') {
        const checkURLResult = common.checkURL(drawText);

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
                  <p className="msgname">
                    {common.getJobInfo(senderInfo)}
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
              <FileMessageBox
                messageId={message.messageID}
                fileObj={fileInfoJSON}
                id={!drawText && id}
              />
              <div className="chatinfo">
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
              <div className="chatinfo">
                {timeBox && (
                  <span className="Sendtime">
                    {format(new Date(message.sendDate), 'HH:mm')}
                  </span>
                )}
              </div>
              <FileMessageBox
                messageId={message.messageID}
                fileObj={fileInfoJSON}
                id={!drawText && id}
              />
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

    let menus = [];
    let menuId = '';
    if (getMenuData) {
      menus = getMenuData(message);
      menuId = `channelmessage_${message.messageID}`;
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
                    <p className="msgname">
                      {common.getJobInfo(senderInfo)}
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
                    marking={marking}
                    mentionInfo={mentionInfo}
                  >
                    {drawText}
                  </Message>
                </RightConxtMenu>
                {!fileInfoJSX && !urlInfoJSX && (
                  <div className="chatinfo">
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
                {!fileInfoJSX && !urlInfoJSX && (
                  <div className="chatinfo">
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
                    eleId={id}
                    marking={marking}
                    mentionInfo={mentionInfo}
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
  }, [message, marking]);

  return drawMessage;
};

MessageBox.defaultProps = {
  id: '',
  marking: '',
};

export default MessageBox;
