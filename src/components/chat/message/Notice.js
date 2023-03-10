import React, { useMemo, useCallback } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Plain, Link, Tag, Sticker, Mention } from '@C/chat/message/types';
import {
  getDictionary,
  isJSONStr,
  getSysMsgFormatStr,
  moveRoom,
  eumTalkRegularExp,
  convertEumTalkProtocol,
  openLayer,
} from '@/lib/common';
import { openPopup } from '@/lib/common';
import ParamUtil, { encryptText } from '@/lib/util/paramUtil';
import { evalConnector } from '@/lib/deviceConnector';
import { useChatFontSize } from '@/hooks/useChat';
import { getAttribute } from '@/lib/messageUtil';
import DocPropertyView from '@/components/chat/chatroom/layer/DocPropertyView';
import ChatInviteMember from '@/components/chat/chatroom/layer/InviteMember';
import ChannelInviteMember from '@/components/channels/channel/layer/InviteMember';
import { setCurrentDocument } from '@/modules/document';

const Notice = ({ type, value, title, func }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector(({ login }) => login.userInfo);
  const loginId = useSelector(({ login }) => login.id);
  const [fontSize] = useChatFontSize();
  const currentRoom = useSelector(({ room, channel }) => {
    if (room.currentRoom) {
      return room.currentRoom;
    } else if (channel.currentChannel) {
      return channel.currentChannel;
    } else {
      return {
        members: [],
      };
    }
  });

  const drawText = useMemo(() => {
    let procVal = value;
    let mentionInfo = [];
    let marking = '';

    if (isJSONStr(value)) {
      const jsonData = JSON.parse(value);
      procVal = getSysMsgFormatStr(
        covi.getDic(jsonData.templateKey),
        jsonData.datas,
      );
    }
    let procValMsgMessage = procVal;
    const pattern = new RegExp(
      /[<](LINK|NEWLINE|TAG|STICKER|MENTION)[^>]*[/>]/,
      'gi',
    );

    if (eumTalkRegularExp.test(procVal)) {
      const processMsg = convertEumTalkProtocol(procVal);
      procValMsgMessage = processMsg.message;
      mentionInfo = processMsg.mentionInfo;
    } else if (pattern.exec(procVal)) {
      const processMsg = convertEumTalkProtocol(procVal);
      procValMsgMessage = processMsg.message;
    }

    const pattern2 = new RegExp(
      /[<](LINK|NEWLINE|TAG|STICKER|MENTION)[^>]*[/>]/,
      'gi',
    );
    let returnJSX = [];

    let beforeLastIndex = 0;
    let match = null;

    while ((match = pattern2.exec(procValMsgMessage)) !== null) {
      if (match.index > 0 && match.index > beforeLastIndex) {
        returnJSX.push(
          <Plain
            key={returnJSX.length}
            text={procValMsgMessage.substring(beforeLastIndex, match.index)}
          ></Plain>,
        );
      }

      const attrs = getAttribute(match[0]);
      if (match[1] == 'LINK') {
        returnJSX.push(
          <Link
            key={returnJSX.length}
            text={procValMsgMessage.substring(beforeLastIndex, match.index)}
            {...attrs}
          ></Link>,
        );
      } else if (match[1] == 'NEWLINE') {
        returnJSX.push(<br key={returnJSX.length} />);
      } else if (match[1] == 'TAG') {
        returnJSX.push(
          <Tag key={returnJSX.length} marking={marking} {...attrs}></Tag>,
        );
      } else if (match[1] == 'STICKER') {
        returnJSX.push(<Sticker key={returnJSX.length} {...attrs}></Sticker>);
      } else if (match[1] == 'MENTION') {
        returnJSX.push(
          <Mention
            key={returnJSX.length}
            marking={marking}
            mentionInfo={mentionInfo}
            {...attrs}
          ></Mention>,
        );
      }
      beforeLastIndex = match.index + match[0].length;
    }

    if (beforeLastIndex < procValMsgMessage.length) {
      returnJSX.push(
        <Plain
          key={returnJSX.length}
          text={procValMsgMessage.substring(beforeLastIndex)}
        ></Plain>,
      );
    }

    return returnJSX;
  }, [value]);

  const actionHandler = useCallback(
    (type, data) => {
      if (type == 'link') {
        return async () => {
          // data object ?????? ?????? ??? ??????
          let url = '';

          if (typeof data === 'string') {
            url = data;
          } else if (typeof data === 'object' && data !== null) {
            url = data.baseURL;
            let paramStr = '';

            if (data.params) {
              for (const [key, value] of Object.entries(data.params)) {
                let expressionStr = value.param;
                if (!value.plain) {
                  const pUtil = new ParamUtil(value.param, userInfo);
                  expressionStr = pUtil.getURLParam();
                }

                if (value.enc) {
                  const { data } = await encryptText(expressionStr);

                  if (data.status === 'SUCCESS') {
                    expressionStr = data.result;
                  }
                }

                paramStr += `${
                  paramStr.length > 0 ? '&' : ''
                }${key}=${encodeURIComponent(expressionStr)}`;
              }
            }

            if (paramStr.length > 0) {
              if (url.indexOf('?') > -1) {
                url = `${url}&${paramStr}`;
              } else {
                url = `${url}?${paramStr}`;
              }
            }
          }

          if (DEVICE_TYPE == 'd') {
            window.openExternalPopup(url);
          } else {
            window.open(url, '_blank');
          }
        };
      } else if (type == 'moveChannel') {
        return () => {
          moveRoom(data, true, dispatch);
        };
      } else if (type == 'remote') {
        return () => {
          evalConnector({
            method: 'removeListener',
            channel: 'onRemoteAssistance',
          });

          evalConnector({
            method: 'send',
            channel: 'onRemoteAssistance',
            message: {
              sessionKey: data.sessionKey,
              isViewer: 'Y',
            },
          });
        };
      } else if (type == 'remotevnc') {
        return async () => {
          evalConnector({
            method: 'removeListener',
            channel: 'onVNCRemote',
          });

          evalConnector({
            method: 'send',
            channel: 'onVNCRemote',
            message: {
              isRepeater: data?.isRepeater,
              hostAddr: data?.hostAddr,
              roomId: data?.roomId,
              viewerOptions: data?.viewerOptions,
            },
          });
        };
      } else if (type == 'saeha') {
        return () => {
          const reqOptions = {
            method: 'GET',
            url: `${data.hostURL}/api/conf/room/${data.meetRoomId}`,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          };

          // 1. ?????? ?????? ?????? ?????? ????????? ??????
          axios(reqOptions)
            .then(response => {
              const resData = response.data;
              if (resData && resData.roomOpenStatusCd < 3) {
                // 2. ??????????????? inviteUsers??? ?????? ?????? ??? ??????
                data.inviteUsers.map(user => {
                  if (user.inviteId == loginId) {
                    // 3. ????????? ?????? ????????? ??????
                    if (DEVICE_TYPE == 'd') {
                      window.openExternalPopup(user.inviteUrl);
                    } else {
                      window.open(user.inviteUrl, '_blank');
                    }
                  }
                });
              } else {
                // 3. ?????????????????? ?????? ?????? ??????
                openPopup(
                  {
                    type: 'Alert',
                    message: covi.getDic(
                      'Msg_VideoChatEnd',
                      '?????? ?????? ?????? ?????? ?????? ???????????????.',
                    ),
                  },
                  dispatch,
                );
              }
            })
            .catch(error => {
              console.log(error);
              openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic(
                    'Msg_VideoChatEnd',
                    '?????? ?????? ?????? ?????? ?????? ???????????????.',
                  ),
                },
                dispatch,
              );
            });
        };
      } else if (type === 'openLayer') {
        return async () => {
          let component;
          if (data.componentName === 'DocPropertyView') {
            component = <DocPropertyView item={data.item} />;
          } else if (data.componentName === 'InviteMember') {
            if (data.roomType === 'C') {
              component = (
                <ChannelInviteMember
                  headerName={data.headerName}
                  roomId={data.roomId}
                  isNewRoom={data.isNewRoom}
                />
              );
            } else {
              component = (
                <ChatInviteMember
                  headerName={data.headerName}
                  roomId={data.roomId}
                  roomType={data.roomType}
                  isNewRoom={data.isNewRoom}
                />
              );
            }
          }

          if (component) {
            openLayer(
              {
                component: component,
              },
              dispatch,
            );
          }
        };
      }
    },
    [dispatch, userInfo],
  );

  const drawFunc = useMemo(() => {
    if (func) {
      let funcArr = [];
      if (Array.isArray(func)) {
        funcArr = func;
      } else {
        funcArr = new Array(func);
      }

      let returnJSX = [];
      funcArr.forEach((item, index) => {
        if (item.data?.componentName === 'InviteMember') {
          // 2022-10-19 ????????? ?????? ?????? ??????
          return;
        }
        if (
          item.type === 'openLayer' &&
          item.data?.componentName === 'InviteMember' &&
          item.data?.roomType === 'C'
        ) {
          // ???????????? ????????? ?????? ?????? ??????????????? ?????? ??? ????????? ?????? ?????? ??????
          const auths = currentRoom?.members.filter(
            member => member.channelAuth === 'Y',
          );
          if (!auths) {
            return;
          }
        }
        if (item.data.hostId && item.data.hostId.id == loginId) {
          return;
        }
        const handlerFunc = actionHandler(item.type, item.data);
        if (type == 'C') {
          returnJSX.push(
            <button
              key={`notice_button_${index}`}
              type="button"
              className="system-btn"
              onClick={e => handlerFunc()}
            >
              {covi.getDic(item.name)}
            </button>,
          );
        } else {
          returnJSX.push(
            <button
              key={`notice_button_${index}`}
              type="button"
              className="system-btn"
              onClick={e => handlerFunc()}
            >
              {item.name}
            </button>,
          );
        }
      });
      return returnJSX;
    } else {
      return <></>;
    }
  }, [func, currentRoom.members]);

  return (
    <>
      {type == 'I' && (
        <div
          style={{
            color: '#000',
            background: '#fff',
            display: 'inline-block',
            lineHeight: '140%',
            wordBreak: 'break-all',
            userSelect: 'text',
            borderRadius: '5px',
            maxWidth: '400px',
            border: '1px solid #eee',
            width: '250px',
            boxSizing: 'border-box',
            padding: '20px',
            textAlign: 'left',
            fontSize,
          }}
        >
          <span className="sys-tit" style={{ fontSize: fontSize + 2 }}>
            <span style={{ float: 'left' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22.469"
                height="19.05"
                viewBox="0 0 22.469 19.05"
              >
                <g id="??????_465" transform="translate(3296.9 -3961.1)">
                  <path
                    id="??????_12"
                    d="M3.5,17.25A2.754,2.754,0,0,1,.75,14.5v-2c0-.086,0-.172.012-.257L6.25,13.994V14.5A2.753,2.753,0,0,1,3.5,17.25Z"
                    transform="translate(-3291 3962)"
                    fill="none"
                    stroke="#444"
                    strokeWidth="1.8"
                  />
                  <rect
                    id="?????????_1651"
                    width="5"
                    height="7"
                    transform="translate(-3296 3967)"
                    fill="none"
                    stroke="#444"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                  <path
                    id="??????_1934"
                    d="M0,1,15.67-4V13L0,8Z"
                    transform="translate(-3291 3966)"
                    fill="none"
                    stroke="#444"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </g>
              </svg>
            </span>
            <span style={{ float: 'left', marginLeft: '10px' }}>
              {covi.getDic('AddNotice', '?????? ??????')}
            </span>
          </span>
          {drawText}
        </div>
      )}
      {(type === 'A' || type === 'C') && (
        <div className="msgtxt" style={{ color: '#000', fontSize }}>
          <span className="sys-tit" style={{ fontSize: fontSize + 2 }}>
            {(title && getDictionary(title)) ||
              getDictionary(
                '????????? ??????;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;',
              )}
          </span>
          {drawText}
          {drawFunc}
        </div>
      )}
    </>
  );
};

export default React.memo(Notice);
