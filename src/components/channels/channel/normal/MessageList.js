import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import loadable from '@loadable/component';
import MessageBox from '@C/channels/message/MessageBox';
import TempMessageBox from '@C/chat/message/TempMessageBox';
import SystemMessageBox from '@C/chat/message/SystemMessageBox';
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox'; // 그대로 사용
import NoticeBox from '@C/channels/channel/normal/NoticeBox';
import { format } from 'date-fns';
import { setMessages, initMessages } from '@/modules/channel';
import { setChannelNotice } from '@/lib/channel';
import { getChannelMessages, deleteChannelMessage } from '@/lib/message';
import {
  isJSONStr,
  openPopup,
  eumTalkRegularExp,
  convertEumTalkProtocol,
  convertEumTalkProtocolPreviewForChannelItem,
} from '@/lib/common';
import { scrollIntoView } from '@/lib/util/domUtil';
import { openLayer } from '@/lib/common';
import ShareContainer from '@C/share/ShareContainer';
import { checkFileTokenValidation } from '@/lib/fileUpload/coviFile';
import { getConfig } from '@/lib/util/configUtil';
import { isBlockCheck } from '@/lib/orgchart';

const ListScrollBox = loadable(() =>
  import('@/components/chat/chatroom/normal/ListScrollBox'),
);

const makeMessage = async msg => {
  const flag = eumTalkRegularExp.test(msg);
  if (flag) {
    const convertedMessage = await convertEumTalkProtocolPreviewForChannelItem(
      msg,
    );
    if (!convertedMessage?.message) {
      return msg;
    }
    return convertedMessage.message;
  } else {
    return msg;
  }
};

const MessageList = ({ onExtension, viewExtension, useMessageDelete }) => {
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const tempMessage = useSelector(({ message }) => message.tempChannelMessage);
  const tempFiles = useSelector(({ message }) => message.tempFiles);
  const messages = useSelector(({ channel }) => channel.messages);
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);

  const [mounted, setMounted] = useState(false);
  const [nextPage, setNextPage] = useState([]);

  const [loading, setLoading] = useState(false);
  const [topEnd, setTopEnd] = useState(false);
  const [bottomEnd, setBottomEnd] = useState(true);

  const [newMessageSeperator, setNewMessageSeperator] = useState(null);
  const [showNewMessageSeperator, setShowNewMessageSeperator] = useState(false);
  const [clickNewMessageSeperator, setClickNewMessageSeperator] =
    useState(false);
  const [noticeIsBlock, setNoticeIsBlock] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentChannel?.roomId > -1) {
      setNextPage([]);
      setTopEnd(false);
    }
  }, [currentChannel.roomId]);

  useEffect(() => {
    getNext(currentChannel.roomId);
  }, [messages]);

  useEffect(() => {
    if (newMessageSeperator) {
      const eleObj = document.getElementById('newMessageSeperator');

      if (eleObj) {
        const eleObjPos = eleObj.getBoundingClientRect();
        if (eleObjPos.top <= 0) {
          setShowNewMessageSeperator(true);
        }
      }
    }
  }, [newMessageSeperator]);

  useEffect(() => {
    if (clickNewMessageSeperator) {
      const newMessageSeperatorObj = document.getElementById(
        'newMessageSeperator',
      );

      setTimeout(() => {
        if (newMessageSeperatorObj) {
          scrollIntoView('center', newMessageSeperatorObj);
        }
        if (messages <= 40) {
          // 이전 메세지 리스트가 생기지 않는 경우
          setShowNewMessageSeperator(false);
        } else {
          console.log('here !');
          setTimeout(() => {
            // 이전 메세지 리스트 동기화 후, 다시 스크롤 이동
            scrollIntoView('center', newMessageSeperatorObj);
            setShowNewMessageSeperator(false);
          }, 500);
        }
      }, 500);
    }
  }, [clickNewMessageSeperator]);

  const getNext = useCallback(
    roomID => {
      if (!loading && messages?.length && !topEnd) {
        // 실제로 불러와야 할 메시지가 달라진 경우에만 처리
        setLoading(true);
        const startID = messages[0].messageID;
        getChannelMessages({
          roomId: roomID,
          startId: startID,
          loadCnt: 100,
          dist: 'NEXT',
        }).then(({ data }) => {
          if (data.status === 'SUCCESS') {
            const result = data.result;
            if (result?.length) {
              setNextPage(result);
            } else {
              setNextPage([]);
              setTopEnd(true);
            }
            setLoading(false);
          } else {
            setNextPage([]);
            setTopEnd(true);
            setLoading(false);
          }
        });
      }
    },
    [loading, messages, topEnd],
  );

  const handleScrollTop = useCallback(() => {
    if (!topEnd && !loading && nextPage?.length) {
      dispatch(setMessages({ messages: nextPage, dist: 'NEXT' }));
    }
  }, [dispatch, loading, nextPage, topEnd]);

  const handlePageInit = useCallback(() => {
    // TODO: messages에 내용 split
    setTopEnd(false);
    setNextPage([]);
    dispatch(initMessages());
  }, [dispatch]);

  const getMenuData = useCallback(
    message => {
      const menus = [];

      if (message.messageType !== 'S' && message.messageType !== 'I') {
        let messageType = 'message';
        if (eumTalkRegularExp.test(message.context)) {
          const processMsg = convertEumTalkProtocol(message.context);
          messageType = processMsg.type;
        }

        if (!!message?.fileInfos) {
          messageType = 'files';
        }

        if (messageType === 'message') {
          if (!message.fileInfos) {
            menus.push(
              {
                code: 'copyClipboardMessage',
                isline: false,
                onClick: async () => {
                  const context = await makeMessage(message.context);
                  navigator.clipboard.writeText(context);
                  openPopup(
                    {
                      type: 'Alert',
                      message: covi.getDic('Msg_Copy', '복사되었습니다.'),
                    },
                    dispatch,
                  );
                },
                name: covi.getDic('Copy', '내용 복사'),
              },
              {
                code: 'shareMessage',
                isline: false,
                onClick: () => {
                  openLayer(
                    {
                      component: (
                        <ShareContainer
                          headerName={covi.getDic(
                            'Msg_Note_Forward',
                            '전달하기',
                          )}
                          message={message}
                          context={message.context}
                          messageType={messageType}
                        />
                      ),
                    },
                    dispatch,
                  );
                },
                name: covi.getDic('Forward', '전달'),
              },
              {
                code: 'setNoticeMessage',
                isline: false,
                onClick: () => {
                  openPopup(
                    {
                      type: 'Confirm',
                      message: covi.getDic(
                        'Msg_RegNotice',
                        '공지는 1건만 등록됩니다. 해당 메시지를 공지로 등록하시겠습니까?',
                      ),
                      callback: result => {
                        if (result) {
                          setChannelNotice({
                            messageID: message.messageID,
                          });
                        }
                      },
                    },
                    dispatch,
                  );
                },
                name: covi.getDic('Notice', 'Notice'),
              },
            );
          }
        } else if (messageType === 'files') {
          const useForwardFile = getConfig('UseForwardFile', false);
          // 파일을 전달할 경우 파일 토큰의 유효성을 먼저 검증
          if (useForwardFile) {
            menus.push({
              code: 'shareMessage',
              isline: false,
              onClick: async () => {
                let files = isJSONStr(message.fileInfos)
                  ? JSON.parse(message.fileInfos)
                  : message.fileInfos;
                if (!Array.isArray(files) && files) {
                  files = Array(files);
                }
                files = files.map(item => item.token);
                const { status } = await checkFileTokenValidation({
                  token: files,
                  serviceType: 'CHAT',
                });

                let popMessage = null;
                switch (status) {
                  case 204:
                    popMessage = covi.getDic(
                      'Msg_FileExpired',
                      '만료된 파일입니다.',
                    );
                    break;
                  case 403:
                    popMessage = covi.getDic(
                      'Msg_FilePermission',
                      '권한이 없는 파일입니다.',
                    );
                    break;
                }

                if (popMessage) {
                  openPopup(
                    {
                      type: 'Alert',
                      message: popMessage,
                    },
                    dispatch,
                  );
                  return;
                } else {
                  openLayer(
                    {
                      component: (
                        <ShareContainer
                          headerName={covi.getDic(
                            'Msg_Note_Forward',
                            '전달하기',
                          )}
                          message={message}
                          context={message.context}
                          messageType={messageType}
                        />
                      ),
                    },
                    dispatch,
                  );
                }
              },
              name: covi.getDic('Forward', '전달'),
            });
          }
        }

        if (useMessageDelete && message.isMine == 'Y') {
          menus.push({
            name: covi.getDic('Delete', '삭제'),
            code: 'deleteMessage',
            isline: false,
            onClick: async () => {
              openPopup(
                {
                  type: 'Confirm',
                  message: covi.getDic(
                    'Msg_DeleteMsg',
                    '메시지를 삭제하시겠습니까? 삭제 후 복원이 불가하며, 채널 동기화 후 화면에 보여지지 않습니다.',
                  ),
                  callback: async result => {
                    if (!result) {
                      return;
                    }
                    if (!message?.messageID || !message?.roomID) {
                      return;
                    }
                    let token = [];
                    if (message.fileInfos) {
                      if (Array.isArray(JSON.parse(message.fileInfos))) {
                        token = JSON.parse(message.fileInfos).map(f => f.token);
                      } else {
                        token.push(JSON.parse(message.fileInfos).token);
                      }
                    }

                    try {
                      await deleteChannelMessage({
                        token,
                        messageId: message.messageID,
                      });
                    } catch (err) {
                      console.log(
                        'deleteChannelMessage occured an error: ',
                        err,
                      );
                      openPopup(
                        {
                          type: 'Alert',
                          message: covi.getDic(
                            'Msg_Error',
                            '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
                          ),
                        },
                        dispatch,
                      );
                    }
                  },
                },
                dispatch,
              );
            },
          });
        }
      }

      return menus;
    },
    [dispatch],
  );

  const drawMessage = useMemo(() => {
    if (messages?.length) {
      let lastDate = '';
      // new message seperator
      let hasNewMessageSeperator = newMessageSeperator;
      if (!hasNewMessageSeperator) {
        hasNewMessageSeperator =
          messages[messages.length - 1].sendDate > currentChannel.lastViewedAt;
      }

      let currentSender = '';
      let currentTime = Math.floor(
        messages[messages.length - 1].sendDate / 60000,
      );
      let returnJSX = [];
      messages.forEach((message, index) => {
        let isBlock = false;
        if (message?.isMine === 'N' && chineseWall?.length) {
          const senderInfo = isJSONStr(message?.senderInfo)
            ? JSON.parse(message?.senderInfo)
            : message?.senderInfo;
          const { blockChat, blockFile } = isBlockCheck({
            targetInfo: {
              ...senderInfo,
              id: message.sender,
            },
            chineseWall,
          });
          const isFile = !!message?.fileInfos;
          isBlock = isFile ? blockFile : blockChat;

          if (message.messageType === 'I') {
            setNoticeIsBlock(isBlock);
          }
        }

        let nameBox = !(message.sender == currentSender);
        let sendDate = format(new Date(message.sendDate), 'yyyyMMdd');
        let nextSendTime = '';
        let nextSender = '';
        let dateBox = !(lastDate == sendDate);

        if (message.sender !== currentSender) {
          currentSender = message.sender;
        }
        if (message.messageType === 'S') {
          currentSender = '';
        }
        if (dateBox) {
          nameBox = true;
        }

        if (messages.length > index + 1) {
          nextSendTime = Math.floor(messages[index + 1].sendDate / 60000);
          nextSender = messages[index + 1].sender;
        }

        let timeBox = !(nextSendTime == currentTime);
        if (!timeBox) {
          // time은 같지만 다른사용자의 채팅으로 넘어가는경우
          timeBox = !(currentSender == nextSender);
        }

        currentTime = nextSendTime;

        let dateComponent = '';
        if (dateBox) {
          lastDate = sendDate;
          dateComponent = (
            <SystemMessageBox
              key={`date_${lastDate}`}
              message={message.sendDate}
              date={true}
            ></SystemMessageBox>
          );
        }

        // new message seperator
        if (
          hasNewMessageSeperator &&
          message.sendDate > currentChannel.lastViewedAt
        ) {
          returnJSX.push(
            <li
              key={`newmessageseperator_${currentChannel.lastViewedAt}`}
              className="meassage-newline"
              id="newMessageSeperator"
            >
              <p>{covi.getDic('Msg_readFar', '여기까지 읽었습니다.')}</p>
            </li>,
          );
          setTimeout(() => {
            setNewMessageSeperator(true);
          }, 500);
          hasNewMessageSeperator = false;
        }
        //

        if (dateBox) returnJSX.push(dateComponent);

        if (message.messageType === 'S') {
          // System Message
          returnJSX.push(
            <SystemMessageBox
              key={message.messageID}
              message={message}
            ></SystemMessageBox>,
          );
        } else if (message.messageType === 'I' || message.messageType === 'A') {
          // Channel Notice
          returnJSX.push(
            <NoticeMessageBox
              key={message.messageID}
              message={message}
              isMine={message.isMine === 'Y'}
              nameBox={nameBox}
              timeBox={timeBox}
              isBlock={isBlock}
            ></NoticeMessageBox>,
          );
        } else {
          // Normal Message
          returnJSX.push(
            <MessageBox
              key={message.messageID}
              message={message}
              isMine={message.isMine === 'Y'}
              nameBox={nameBox}
              timeBox={timeBox}
              getMenuData={getMenuData}
              isBlock={isBlock}
            ></MessageBox>,
          );
        }
      });

      return returnJSX;
    }
  }, [messages, chineseWall]);

  const drawTempMessage = useMemo(() => {
    return tempMessage.map(message => {
      if (message.roomID == currentChannel.roomId)
        return (
          <TempMessageBox
            key={message.tempId}
            message={message}
          ></TempMessageBox>
        );
    });
  }, [tempMessage, currentChannel]);

  const handleClick = useCallback(() => {
    onExtension('');
  }, [onExtension]);

  const layerClass = useMemo(() => {
    let layerClass = '';

    if (viewExtension !== '' && tempFiles?.length) {
      layerClass = 'layer-all';
    } else if (viewExtension !== '' && tempFiles.length === 0) {
      layerClass = 'layer';
    } else if (viewExtension === '' && tempFiles?.length) {
      layerClass = 'layer-file';
    }

    return layerClass;
  }, [viewExtension, tempFiles]);

  return (
    <>
      {mounted && (
        <>
          <ListScrollBox
            key={currentChannel.roomId}
            className={['messages-chat', layerClass].join(' ')}
            style={{ height: 'calc(100% - 183px)' }}
            onClick={handleClick}
            onScrollTop={handleScrollTop}
            pageInit={handlePageInit}
            isTopEnd={topEnd}
            isBottomEnd={bottomEnd}
            isClickNewMessageSeperator={clickNewMessageSeperator}
            isShowNewMessageSeperator={showNewMessageSeperator}
            handleShowNewMessageSeperator={setShowNewMessageSeperator}
          >
            <ul className="messages-chat-list">
              {messages && drawMessage}
              {tempMessage && drawTempMessage}
            </ul>
          </ListScrollBox>
          {showNewMessageSeperator && (
            <a className="NewMessageBtn">
              <span
                onClick={() => {
                  setClickNewMessageSeperator(true);
                }}
              >
                <span>
                  {covi.getDic(
                    'MoveToFirstUnreadMessage',
                    '읽지 않은 첫번째 메세지로 이동',
                  )}
                </span>
                <span className="ico-arrow"></span>
              </span>
              <span
                style={{ position: 'absolute', right: '-25px', top: '7px' }}
                onClick={() => {
                  setShowNewMessageSeperator(false);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 16 16"
                >
                  <g transform="translate(0.488)">
                    <path
                      d="M8,0A8,8,0,1,1,0,8,8,8,0,0,1,8,0Z"
                      transform="translate(-0.488)"
                      fill="#308dff"
                    ></path>
                    <g transform="translate(4.513 5.224)">
                      <path
                        d="M128.407,133.742a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12l2.284-2.165,2.284,2.165a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12.39.39,0,0,0,0-.565l-2.277-2.158,2.277-2.165a.39.39,0,0,0,0-.564.437.437,0,0,0-.6,0l-2.277,2.165L129,128.3a.444.444,0,0,0-.6,0,.39.39,0,0,0,0,.564l2.284,2.158-2.277,2.165A.371.371,0,0,0,128.407,133.742Z"
                        transform="translate(-128.279 -128.173)"
                        fill="#fff"
                      ></path>
                    </g>
                  </g>
                </svg>
              </span>
            </a>
          )}
          {currentChannel?.notice && <NoticeBox isBlock={noticeIsBlock} />}
        </>
      )}
    </>
  );
};

export default React.memo(MessageList);
