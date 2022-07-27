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
  tagPattern,
  isJSONStr,
  openPopup,
} from '@/lib/common';
import LinkMessageBox from '@C/chat/message/LinkMessageBox'; // 그대로 사용
import FileMessageBox from '@C/chat/message/FileMessageBox'; // 그대로 사용
import { useChatFontSize } from '@/hooks/useChat';
import { setMessageLinkInfo } from '@/modules/channel';
import { evalConnector } from '@/lib/deviceConnector';
import { getConfig } from '@/lib/util/configUtil';
import { createBookmark, getBookmarkList, deleteBookmark } from '@/lib/message';

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
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);
  const useBookmark = getConfig('UseBookmark', 'N') === 'Y';

  const loginId = useSelector(({ login }) => login.id);
  const currMember = useSelector(
    ({ room, channel }) =>
      room.currentRoom?.members || channel.currentChannel?.members,
  );
  const loading = useSelector(
    ({ loading }) => loading['channel/GET_CHANNEL_INFO'],
  );

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

  //bookmarkList 불러오기
  const { data: bookmarkList, mutate: setBookmarkList } = useSWR(
    `bookmark/${currentChannel.roomId}`,
    async () => {
      const response = await getBookmarkList(currentChannel.roomId.toString());
      if (response.data.status === 'SUCCESS') {
        return response.data.list;
      }
      return [];
    },
  );

  const handleAddBookmark = message => {
    const sendData = {
      roomId: currentChannel.roomId.toString(),
      messageId: message.messageID.toString(),
    };

    createBookmark(sendData)
      .then(async ({ data }) => {
        let popupMsg = '';

        if (data?.status == 'SUCCESS') {
          const response = await getBookmarkList(
            currentChannel.roomId.toString(),
          );
          let list = [];

          if (response.data.status === 'SUCCESS') {
            list = response.data.list;
          }
          setBookmarkList(list);

          popupMsg = covi.getDic(
            'Msg_Bookmark_Registeration',
            '책갈피가 등록되었습니다.',
          );
        } else {
          popupMsg = covi.getDic(
            'Msg_Bookmark_Registeration_fail',
            '책갈피가 등록에 실패했습니다.',
          );
        }
        openPopup(
          {
            type: 'Alert',
            message: popupMsg,
          },
          dispatch,
        );
      })
      .catch(error => console.log('Send Error   ', error));
  };

  //책갈피 삭제

  const handleDeleteBookmark = bookmark => {
    const param = {
      roomId: bookmark.roomId.toString(),
      bookmarkId: bookmark.bookmarkId,
    };
    deleteBookmark(param)
      .then(({ data }) => {
        let popupMsg = '';

        if (data?.status == 'SUCCESS') {
          setBookmarkList(
            bookmarkList?.filter(
              bookmarkOrigin =>
                bookmarkOrigin.bookmarkId !== bookmark.bookmarkId,
            ),
          );
          popupMsg = covi.getDic(
            'Msg_Bookmark_Delete',
            '책갈피가 삭제되었습니다.',
          );
        } else {
          popupMsg = covi.getDic(
            'Msg_Bookmark_Delete_fail',
            '책갈피 삭제에 실패했습니다.',
          );
        }
        openPopup(
          {
            type: 'Alert',
            message: popupMsg,
          },
          dispatch,
        );
      })
      .catch(error => console.log('Send Error   ', error));
  };

  const menus = useMemo(() => {
    let _menus = getMenuData(message);

    const isExistOnBookmark =
      bookmarkList?.filter(bookmark => bookmark.messageId === message.messageID)
        .length > 0;
    const bookmark = bookmarkList?.find((bookmark = {}) => {
      if (bookmark.messageId === message.messageID) return bookmark;
    });

    if (useBookmark === true) {
      if (isExistOnBookmark === true) {
        _menus.push({
          code: 'deleteBookmark',
          isline: false,
          onClick: () => handleDeleteBookmark(bookmark),
          name: covi.getDic('DeleteBookmark', '책갈피삭제'),
        });
      } else {
        _menus.push({
          code: 'addBookmark',
          isline: false,
          onClick: () => handleAddBookmark(message),
          name: covi.getDic('AddBookmark', '책갈피등록'),
        });
      }
    }

    if (isBlock) {
      _menus = [];
    }
    return _menus;
  }, [bookmarkList]);

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

    let menuId = '';
    let fileMenuId = '';
    if (!isBlock && getMenuData) {
      menuId = `channelmessage_${message.messageID}`;
      fileMenuId = `channelfilemessage_${message.messageID}`;
    }

    let _marking = null;

    if (!isMine) {
      senderInfo = isJSONStr(message.senderInfo)
        ? JSON.parse(message.senderInfo)
        : message.senderInfo;
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

        drawText = convertURLMessage(drawText);

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
      drawText = drawText.replace(tagPattern, `<TAG text="$1$2" value="$2" />`);

      // Mention 처리
      if (mentionInfo?.length) {
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
                    messageType === 'message'
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
    menus,
  ]);

  return drawMessage;
};

MessageBox.defaultProps = {
  id: '',
  marking: '',
};

export default React.memo(MessageBox);
