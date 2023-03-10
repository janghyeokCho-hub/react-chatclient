import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import loadable from '@loadable/component';
import MessageBox from '@C/chat/message/MessageBox';
import ChatBotMessageBox from '@C/chat/message/ChatBotMessageBox';
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox';
import TempMessageBox from '@C/chat/message/TempMessageBox';
import SystemMessageBox from '@C/chat/message/SystemMessageBox';
import { format } from 'date-fns';
import {
  isJSONStr,
  openPopup,
  openLayer,
  eumTalkRegularExp,
  convertEumTalkProtocol,
} from '@/lib/common';
import {
  setMessages,
  initMessages,
  setMessagesForSync,
  setUnreadCountForSync,
  readMessage,
  getRoomInfo,
} from '@/modules/room';
import {
  hasClass,
  messageCopy,
  getMsgElement,
  scrollIntoView,
} from '@/lib/util/domUtil';
import { evalConnector } from '@/lib/deviceConnector';
import { getMessage, getMessageBetween } from '@/lib/messageUtil';
import { deleteChatroomMessage } from '@/lib/message';
import LoadingWrap from '@COMMON/LoadingWrap';
import ShareContainer from '@C/share/ShareContainer';
import { checkFileTokenValidation } from '@/lib/fileUpload/coviFile';
import { getConfig } from '@/lib/util/configUtil';
import { isBlockCheck } from '@/lib/orgchart';
import { makeMessage } from '@/components/share/share';

const ListScrollBox = loadable(() =>
  import('@/components/chat/chatroom/normal/ListScrollBox'),
);

const MessageList = ({
  onExtension,
  viewExtension,
  useMessageDelete,
  setReplyMessage,
  replyMode,
  setReplyMode,
}) => {
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const tempMessage = useSelector(({ message }) => message.tempMessage);
  const tempFiles = useSelector(({ message }) => message.tempFiles);
  const messages = useSelector(({ room }) => room.messages);
  const currentRoom = useSelector(({ room }) => room.currentRoom);

  const [mounted, setMounted] = useState(false);
  const [nextPage, setNextPage] = useState([]);

  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [topEnd, setTopEnd] = useState(false);
  const [reload, setReload] = useState(false);
  const [startSelectMessage, setStartSelectMessage] = useState(-1);
  const [endSelectMessage, setEndSelectMessage] = useState(-1);
  const cbRef = useRef(null);
  const dispatch = useDispatch();

  const disableCopy = async e => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 67) {
      window.getelestartMessageID;

      const start = document
        .getElementsByClassName('startMessageID')
        .item(0).value;
      const end = document.getElementsByClassName('endMessageID').item(0).value;

      messageCopy(messages, start, end).then(success => {
        if (success) {
          document.removeEventListener('keydown', disableCopy);
          setStartSelectMessage(-1);
          setEndSelectMessage(-1);
        }
      });

      e.returnValue = false;
    }
  };

  const handleSelectionChange = () => {
    const selectionValue = window.getSelection();

    let startMessageId = -1;
    let endMessageId = -1;

    try {
      const selectRange = selectionValue.getRangeAt(0);

      const selectElementContainer = selectRange.commonAncestorContainer;

      if (hasClass(selectElementContainer, 'messages-chat-list')) {
        // ?????? ???????????? ?????? ????????? ???????????? ?????? ????????? ??????
        startMessageId = getMsgElement(selectRange.startContainer).getAttribute(
          'data-messageid',
        );
        endMessageId = getMsgElement(
          selectRange.endContainer,
          true,
        ).getAttribute('data-messageid');

        if (startMessageId > endMessageId) {
          let tempId = startMessageId;
          startMessageId = endMessageId;
          endMessageId = tempId;
        }

        if (startSelectMessage != startMessageId)
          setStartSelectMessage(startMessageId);
        if (endSelectMessage != endMessageId) setEndSelectMessage(endMessageId);

        document.addEventListener('keydown', disableCopy);
      }
    } catch {
      setStartSelectMessage(-1);
      setEndSelectMessage(-1);
    }
  };

  const handleMouseDown = () => {
    setStartSelectMessage(-1);
    setEndSelectMessage(-1);
  };

  useEffect(() => {
    cbRef.current = handleSelectionChange;
    return () => {
      cbRef.current = null;
    };
  }, []);

  useEffect(() => {
    setMounted(true);

    const cb = e => cbRef.current(e);
    document.addEventListener('selectionchange', cb);
    document.addEventListener('mousedown', handleMouseDown);

    evalConnector({
      method: 'on',
      channel: 'onReSyncMessage',
      callback: () => {
        reSyncMessage();
      },
    });

    return () => {
      cbRef.current = null;
      document.removeEventListener('selectionchange', cb);
      document.removeEventListener('mousedown', handleMouseDown);
      evalConnector({
        method: 'removeListener',
        channel: 'onReSyncMessage',
      });
    };
  }, []);

  const reSyncMessage = useCallback(() => {
    dispatch(getRoomInfo({ roomID: currentRoom.roomID }));
    syncMessage(currentRoom.roomID);
  }, [dispatch, currentRoom]);

  useEffect(() => {
    if (currentRoom && currentRoom.roomID > -1) {
      setNextPage([]);
      setTopEnd(false);
      // ????????? ?????????
      // TODO: AppData ?????? ????????? ?????? ?????? ??????
      if (DEVICE_TYPE === 'd') {
        // NOTE:: ????????? 2??? ?????????
        // NOTE:: ?????? syncMessage ????????? ??? ????????? ??? ?????? +2 ??? ?????????
        syncMessage(currentRoom.roomID);
      }
    }
    return () => {
      setNextPage([]);
      setTopEnd(false);
    };
  }, []);

  useEffect(() => {
    getNext(currentRoom.roomID);
    setTimeout(() => {
      if (!messages?.length) {
        setReload(true);
      }
    }, 1000);
    return () => {
      setReload(false);
    };
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      if (messageLoading) {
        setMessageLoading(false);
      }
    }, 10000);

    return () => {
      setMessageLoading(false);
    };
  }, [messageLoading]);

  useEffect(() => {
    if (reload) {
      getMessages(currentRoom.roomID);
    }
  }, [reload]);

  const getMessages = async roomID => {
    console.log('getMessages called!');
    const response = await evalConnector({
      method: 'sendSync',
      channel: 'req-get-messages',
      message: {
        roomID: roomID,
        startId: null,
        dist: 'SYNC',
        loadCnt: 50,
      },
    });
    const messages = response?.data?.result;
    messages?.length && setTopEnd(false);

    dispatch(setMessagesForSync(messages));
    setReload(false);
  };

  const syncMessage = useCallback(
    roomID => {
      console.log('syncMessage called :::');
      //NOTE:: ??? ?????? ??? ?????? (x 2 + 4)??? ?????????
      evalConnector({
        method: 'removeListener',
        channel: 'onSyncUnreadCount',
      });

      evalConnector({
        method: 'removeListener',
        channel: 'onSyncUnreadCountMessages',
      });

      evalConnector({
        method: 'once',
        channel: 'onSyncUnreadCount',
        callback: (_, data) => {
          dispatch(
            setUnreadCountForSync({ roomID, unreadCnts: data.unreadCnts }),
          );
          if (data.sync) {
            dispatch(
              readMessage({
                roomID: roomID,
                isNotice: false,
              }),
            );
          }
        },
      });

      evalConnector({
        method: 'once',
        channel: 'onSyncUnreadCountMessages',
        callback: () => {
          //NOTE:: ??? ?????? ??? ?????? (x 2 + 4)??? ?????????
          console.log('onSyncUnreadCountMessages call');
          syncMessage(currentRoom.roomID);
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onSyncMessageSuccess',
        callback: async (_, targetRoomID) => {
          if (roomID == targetRoomID) {
            const response = await evalConnector({
              method: 'sendSync',
              channel: 'req-get-messages',
              message: {
                roomID: roomID,
                startId: null,
                dist: 'SYNC',
                loadCnt: 50,
              },
            });

            const messages = response.data.result;
            messages?.length && setTopEnd(false);
            dispatch(setMessagesForSync(messages));

            if (!messages || !messages?.length) {
              dispatch(
                readMessage({
                  roomID: roomID,
                  isNotice: false,
                }),
              );
            }
            setMessageLoading(false);
          }
        },
      });

      const isSync = evalConnector({
        method: 'sendSync',
        channel: 'req-sync-messages',
        message: {
          roomId: roomID,
        },
      });

      if (!isSync) {
        evalConnector({
          method: 'removeListener',
          channel: 'onSyncMessageSuccess',
        });
        setMessageLoading(false);
      } else {
        setMessageLoading(true);
      }
    },
    [dispatch],
  );

  const getNext = useCallback(
    roomID => {
      if (!loading && messages?.length && !topEnd) {
        // ????????? ???????????? ??? ???????????? ????????? ???????????? ??????
        setLoading(true);
        getMessage(roomID, messages[0].messageID, 'NEXT').then(({ data }) => {
          const { status, result } = data;
          if (status === 'SUCCESS') {
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

  /**
   * ?????? ??????????????? ?????? ????????? ????????? ???????????? ??????
   * @param {number} replyID
   * @returns
   */
  const goToOriginMsg = async (currentRoomID, replyID) => {
    const msgEle = document.getElementById(replyID);
    if (!msgEle) {
      try {
        const { data } = await getMessageBetween(
          currentRoomID,
          replyID,
          messages.at(-1).messageID,
          10,
          'CHAT',
        );
        const { status, result } = data;
        if (status === 'SUCCESS' && result?.length) {
          dispatch(setMessagesForSync(result));
        }
      } catch (e) {
        console.log(e);
      }
    }

    setTimeout(() => {
      const replyMsgEle = document.getElementById(replyID);
      if (replyMsgEle?.offsetParent) {
        scrollIntoView('center', replyMsgEle.offsetParent);
        replyMsgEle.classList.add('shake');
        // ?????? ????????? ????????? ?????? ?????? event class ??????
        setTimeout(() => {
          replyMsgEle.classList.remove('shake');
        }, 500);
      } else {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic(
              'Msg_NotMoveMessage',
              '?????? ???????????? ????????? ??? ????????????.',
            ),
          },
          dispatch,
        );
      }
    }, 500);
  };

  const handleScrollTop = useCallback(() => {
    if (!topEnd && !loading && nextPage?.length) {
      dispatch(setMessages({ messages: nextPage, dist: 'NEXT' }));
    }
  }, [dispatch, loading, nextPage, topEnd]);

  const handlePageInit = useCallback(() => {
    // TODO: messages??? ?????? split
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

        const useReply = getConfig('UseReply', 'N') === 'Y';
        if (useReply) {
          menus.push({
            code: 'replyMessage',
            isline: false,
            onClick: () => {
              setReplyMessage(message);
              setReplyMode(true);
            },
            name: covi.getDic('reply', '??????'),
          });
        }

        if (messageType === 'message') {
          menus.push({
            code: 'copyClipboardMessage',
            isline: false,
            onClick: async () => {
              const context = await makeMessage(message.context);
              navigator.clipboard.writeText(context);
              openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic('Msg_Copy', '?????????????????????.'),
                },
                dispatch,
              );
            },
            name: covi.getDic('Copy', '?????? ??????'),
          });
          menus.push({
            code: 'forwardMessage',
            isline: false,
            onClick: () => {
              openLayer(
                {
                  component: (
                    <ShareContainer
                      headerName={covi.getDic('Msg_Note_Forward', '????????????')}
                      message={message}
                      context={message.context}
                      messageType={messageType}
                    />
                  ),
                },
                dispatch,
              );
            },
            name: covi.getDic('Forward', '??????'),
          });
        } else if (messageType === 'files') {
          const useForwardFile = getConfig('UseForwardFile', 'N') === 'Y';
          // ????????? ????????? ?????? ?????? ????????? ???????????? ?????? ??????
          if (useForwardFile) {
            menus.push({
              code: 'forwardMessage',
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

                if (status === 200) {
                  openLayer(
                    {
                      component: (
                        <ShareContainer
                          headerName={covi.getDic(
                            'Msg_Note_Forward',
                            '????????????',
                          )}
                          message={message}
                          context={message.context}
                          messageType={messageType}
                        />
                      ),
                    },
                    dispatch,
                  );
                } else {
                  let popupMsg = '';
                  if (status === 204) {
                    popupMsg = covi.getDic(
                      'Msg_FileExpired',
                      '????????? ???????????????.',
                    );
                  } else if (status === 403) {
                    popupMsg = covi.getDic(
                      'Block_FileDownload',
                      '?????? ??????????????? ???????????? ????????????.',
                    );
                  } else {
                    popupMsg = covi.getDic(
                      'Msg_Error',
                      '????????? ??????????????????.<br/>??????????????? ??????????????????.',
                    );
                  }
                  openPopup(
                    {
                      type: 'Alert',
                      message: popupMsg,
                    },
                    dispatch,
                  );
                }
              },
              name: covi.getDic('Forward', '??????'),
            });
          }
        }
        if (useMessageDelete && message?.isMine === 'Y') {
          menus.push({
            name: covi.getDic('Delete', '??????'),
            code: 'deleteMessage',
            isline: false,
            onClick() {
              openPopup(
                {
                  type: 'Confirm',
                  message: covi.getDic(
                    'Msg_ChatroomDeleteMsg',
                    '???????????? ????????????????????????? ?????? ??? ????????? ????????????, ????????? ????????? ??? ????????? ???????????? ????????????.',
                  ),
                  async callback(result) {
                    if (!result) {
                      return;
                    }
                    if (!message?.messageID || !message?.roomID) {
                      return;
                    }
                    try {
                      await deleteChatroomMessage({
                        roomID: message.roomID,
                        messageIds: [message.messageID],
                      });
                      // ?????? ????????????: onDelMessage ????????? ?????? ?????? dispatch
                      // dispatch(
                      //   roomMessageDelete({
                      //     roomID: message.roomID,
                      //     messageIds: [message.messageID],
                      //   }),
                      // );
                    } catch (err) {
                      console.log(
                        'deleteChatroomMessage occured an error: ',
                        err,
                      );
                      openPopup(
                        {
                          type: 'Alert',
                          message: covi.getDic(
                            'Msg_Error',
                            '????????? ??????????????????.<br/>??????????????? ??????????????????.',
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
          const isFile = !!message.fileInfos;
          isBlock = isFile ? blockFile : blockChat;
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
          // time??? ????????? ?????????????????? ???????????? ??????????????????
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

        if (dateBox) {
          returnJSX.push(dateComponent);
        }

        if (message.botInfo) {
          returnJSX.push(
            <ChatBotMessageBox
              key={`chatbot_${message.messageID}`}
              message={message}
              isMine={message.isMine === 'Y'}
              startMessage={startSelectMessage}
              endMessage={endSelectMessage}
              nameBox={nameBox}
              timeBox={timeBox}
              getMenuData={getMenuData}
            ></ChatBotMessageBox>,
          );
        } else {
          if (message.messageType === 'N') {
            returnJSX.push(
              <MessageBox
                key={`messagebox_${message.messageID}`}
                message={message}
                isMine={message.isMine === 'Y'}
                startMessage={startSelectMessage}
                endMessage={endSelectMessage}
                nameBox={nameBox}
                timeBox={timeBox}
                getMenuData={getMenuData}
                isBlock={isBlock}
                selectionChange={handleSelectionChange}
                goToOriginMsg={goToOriginMsg}
              ></MessageBox>,
            );
          } else if (
            message.messageType === 'A' ||
            message.messageType === 'I'
          ) {
            returnJSX.push(
              <NoticeMessageBox
                key={`noticebox_${message.messageID}`}
                message={message}
                isMine={message.isMine === 'Y'}
                nameBox={nameBox}
                timeBox={timeBox}
                isBlock={isBlock}
              ></NoticeMessageBox>,
            );
          } else {
            // System Message
            returnJSX.push(
              <SystemMessageBox
                key={`systembox_${message.messageID}`}
                message={message}
              ></SystemMessageBox>,
            );
          }
        }
      });

      return returnJSX;
    }
  }, [messages, startSelectMessage, endSelectMessage, chineseWall]);

  const drawTempMessage = useMemo(() => {
    return tempMessage.map(message => {
      if (message.roomID == currentRoom.roomID)
        return (
          <TempMessageBox
            key={`tempbox_${message.tempId}`}
            message={message}
          ></TempMessageBox>
        );
    });
  }, [tempMessage, currentRoom]);

  const handleClick = useCallback(() => {
    onExtension('');
  }, [onExtension]);

  const layerClass = useMemo(() => {
    let layerClass = '';

    if (viewExtension !== '' && tempFiles?.length) {
      layerClass = 'layer-all';
    } else if (viewExtension !== '' && !tempFiles?.length) {
      layerClass = 'layer';
    } else if (viewExtension === '' && tempFiles?.length) {
      layerClass = 'layer-file';
    }

    return layerClass;
  }, [viewExtension, tempFiles]);

  return (
    <>
      <input
        className="startMessageID"
        style={{ display: 'none' }}
        value={startSelectMessage}
        readOnly
      />
      <input
        className="endMessageID"
        style={{ display: 'none' }}
        value={endSelectMessage}
        readOnly
      />

      {messageLoading && (
        <LoadingWrap style={{ top: 60, height: 'calc(100% - 183px)' }} />
      )}
      {mounted && (
        <ListScrollBox
          key={currentRoom.roomID}
          className={['messages-chat', layerClass].join(' ')}
          style={{ height: 'calc(100% - 183px)' }}
          onClick={handleClick}
          onScrollTop={handleScrollTop}
          pageInit={handlePageInit}
          replyMode={replyMode}
        >
          <ul className="messages-chat-list">
            {messages && drawMessage}
            {tempMessage && drawTempMessage}
          </ul>
        </ListScrollBox>
      )}
    </>
  );
};

export default React.memo(MessageList);
