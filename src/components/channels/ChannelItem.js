// components\chat\Room.js

import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  format,
  isValid,
  startOfToday,
  differenceInMilliseconds,
} from 'date-fns';
import { newWinChannel, openChannel } from '@/modules/channel';
import RightConxtMenu from '../common/popup/RightConxtMenu';
import { newChannel } from '@/lib/deviceConnector';
import Config from '@/config/config';
import { getAesUtil } from '@/lib/aesUtil';
import { clearLayer, openPopup } from '@/lib/common';
import * as channelApi from '@/lib/channel';
import * as common from '@/lib/common';
import { evalConnector } from '@/lib/deviceConnector';

const makeDateTime = timestamp => {
  if (timestamp && isValid(new Date(timestamp))) {
    const toDay = startOfToday();
    const procTime = new Date(timestamp);
    let dateText = '';

    if (differenceInMilliseconds(procTime, toDay) >= 0) {
      // 오늘보다 큰 경우 시간 표시
      dateText = format(procTime, 'HH:mm');
    } else {
      // 오늘과 이틀이상 차이나는 경우 날짜로 표시
      dateText = format(procTime, 'yyyy.MM.dd');
    }

    // 오늘과 하루 차이인 경우 어제로 표시 -- 차후에 추가 ( 다국어처리 )

    return dateText;
  } else {
    return '';
  }
};

const makeMessageText = async lastMessage => {
  let returnText = covi.getDic('Msg_NoMessages');

  try {
    let msgObj = null;

    if (typeof lastMessage == 'string') {
      msgObj = JSON.parse(lastMessage);
    } else if (typeof lastMessage == 'object') {
      msgObj = lastMessage;
    }

    if (!msgObj) return returnText;

    if (msgObj.Message !== '' && msgObj.Message !== null) {
      // returnText = commonApi.getPlainText(msgObj.Message);
      let drawText = (msgObj.Message && msgObj.Message) || '';
      if (common.isJSONStr(msgObj.Message)) {
        const drawData = JSON.parse(msgObj.Message);

        if (drawData.msgType == 'C') {
          drawText = common.getDictionary(drawData.title);
        } else {
          drawText = drawData.context;
        }
      }
      // protocol check
      if (common.eumTalkRegularExp.test(drawText)) {
        const messageObj =
          await common.convertEumTalkProtocolPreviewForChannelItem(drawText);
        if (messageObj.type == 'emoticon') returnText = covi.getDic('Emoticon');
        else returnText = messageObj.message.split('\n')[0];
      } else {
        // 첫줄만 노출
        returnText = drawText.split('\n')[0];
      }
    } else if (msgObj.File) {
      let fileObj = null;

      if (typeof msgObj.File == 'string') {
        fileObj = JSON.parse(msgObj.File);
      } else if (typeof msgObj.File == 'object') {
        fileObj = msgObj.File;
      }

      if (!fileObj) return returnText;

      // files 일경우
      if (fileObj.length != undefined && fileObj.length > 1) {
        const firstObj = fileObj[0];
        if (
          firstObj.ext == 'png' ||
          firstObj.ext == 'jpg' ||
          firstObj.ext == 'jpeg' ||
          firstObj.ext == 'bmp'
        ) {
          // 사진 외 %s건
          returnText = common.getSysMsgFormatStr(covi.getDic('Tmp_imgExCnt'), [
            { type: 'Plain', data: fileObj.length - 1 },
          ]);
        } else {
          // 파일 외 %s건
          returnText = common.getSysMsgFormatStr(covi.getDic('Tmp_fileExCnt'), [
            { type: 'Plain', data: fileObj.length - 1 },
          ]);
        }
      } else {
        if (
          fileObj.ext == 'png' ||
          fileObj.ext == 'jpg' ||
          fileObj.ext == 'jpeg' ||
          fileObj.ext == 'bmp'
        ) {
          returnText = covi.getDic('Image');
        } else {
          returnText = covi.getDic('File');
        }
      }
    }
  } catch (e) {
    // console.log(e);
  }

  return returnText;
};

const ChannelItem = ({
  channel,
  onChannelChange,
  isSelect,
  dbClickEvent,
  getMenuData,
  isJoin,
}) => {
  const id = useSelector(({ login }) => login.id);
  const channels = useSelector(({ channel }) => channel.channels);

  const menuId = useMemo(() => 'channel_' + channel.roomId, [channel]);
  const dispatch = useDispatch();

  useEffect(() => {
    evalConnector({
      method: 'on',
      channel: 'onNewDeleteMessage',
      callback: (event, args) => {
        console.log('onNewDeleteMessage called >> ', args);
      },
    });
    return () => {
      evalConnector({
        method: 'removeListener',
        channel: 'onNewDeleteMessage',
      });
    };
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (dbClickEvent && !channel.newWin) {
      onChannelChange(channel.roomId);

      const winName = `wrf${channel.roomId}`;

      const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/channel/${
        channel.roomId
      }`;

      const channelObj = newChannel(winName, channel.roomId, openURL);

      dispatch(
        newWinChannel({ id: channel.roomId, obj: channelObj, name: winName }),
      );
    } else if (dbClickEvent && channel.newWin) {
      if (DEVICE_TYPE == 'd') {
        if (channel.winObj) {
          try {
            if (channel.winObj) {
              if (channel.winObj.isMinimized()) {
                channel.winObj.restore();
              }

              channel.winObj.focus();
            }
          } catch (e) {
            console.log('No Such Window');
            // no windows - window 재 맵핑
            onChannelChange(channel.roomId);
            const winName = `wrf${channel.roomId}`;
            const openURL = `${
              DEVICE_TYPE == 'd' ? '#' : ''
            }/client/nw/channel/${channel.roomId}`;
            const channelObj = newChannel(winName, channel.roomId, openURL);
            dispatch(
              newWinChannel({
                id: channel.roomId,
                obj: channelObj,
                name: winName,
              }),
            );
          }
        }
      }
    }
  }, [dispatch, channel, dbClickEvent]);

  const handleJoinChannel = useCallback(
    channel => {
      if (!channel.isJoin) {
        if (!isSelect) {
          onChannelChange(channel.roomId);
        }
      } else {
        const params = {
          roomId: channel.roomId,
          openType: channel.openType,
          members: [id],
        };

        openPopup(
          {
            type: 'Confirm',
            title: covi.getDic('Eumtalk'),
            message: covi.getDic('Msg_AskEnterChannel'),
            initValue: '',
            callback: result => {
              if (result) {
                //채널 입장
                if (channel.openType != 'O') {
                  openPopup(
                    {
                      type: 'Prompt',
                      inputType: 'password',
                      title: covi.getDic('ChannelPassword'),
                      message: covi.getDic('Msg_InputChannelPassword'),
                      initValue: '',
                      callback: result => {
                        if (!result) {
                          openPopup(
                            {
                              type: 'Custom',
                              message: covi.getDic('Msg_InputChannelPassword'),
                            },
                            dispatch,
                          );
                        } else {
                          const AESUtil = getAesUtil();
                          params.secretKey = AESUtil.encrypt(result);
                          joinChannel(params);
                        }
                      },
                    },
                    dispatch,
                  );
                } else {
                  joinChannel(params);
                }
              } else {
                //채널 입장 취소
              }
            },
          },
          dispatch,
        );
      }
    },
    [dispatch, id],
  );

  const joinChannel = useCallback(
    params => {
      channelApi.joinChannel(params).then(({ data }) => {
        if (data.status === 'SUCCESS') {
          const roomId = params.roomId;
          dispatch(openChannel({ roomId }));
          clearLayer(dispatch);
        }
      });
    },
    [dispatch],
  );

  const handleClick = useCallback(
    channel => {
      if (channel.openType != 'O' && channel.channelUnlock == 'N') {
        const params = {
          roomId: channel.roomId,
          openType: channel.openType,
          members: [id],
        };

        openPopup(
          {
            type: 'Prompt',
            inputType: 'password',
            title: covi.getDic('ChannelPassword'),
            message: covi.getDic('Msg_InputChannelPassword'),
            initValue: '',
            callback: result => {
              if (!result) {
                openPopup(
                  {
                    type: 'Custom',
                    message: covi.getDic('Msg_InputChannelPassword'),
                  },
                  dispatch,
                );
              } else {
                const AESUtil = getAesUtil();
                params.secretKey = AESUtil.encrypt(result);
                joinChannel(params);
              }
            },
          },
          dispatch,
        );
      } else {
        if (!isJoin && !isSelect) {
          onChannelChange(channel.roomId);
        }
      }
    },
    [dispatch, id],
  );

  const menus = useMemo(
    () =>
      getMenuData(
        dispatch,
        channel,
        id,
        dbClickEvent,
        isSelect,
        handleDoubleClick,
      ),
    [dispatch, channel, id, dbClickEvent, isSelect, handleDoubleClick],
  );

  const messageDate = useMemo(
    () => makeDateTime(channel.lastMessageDate),
    [channel],
  );

  const [lastMessageText, setLastMessageText] = useState('');

  useLayoutEffect(() => {
    const changeTargetChannel = channels.find(c => c.roomId == channel.roomId);
    if (changeTargetChannel) {
      makeMessageText(
        changeTargetChannel.lastMessage,
        changeTargetChannel.lastMessageType,
      ).then(setLastMessageText);
    } else {
      makeMessageText(channel.lastMessage, channel.lastMessageType).then(
        setLastMessageText,
      );
    }
  }, [channel]);

  return (
    <RightConxtMenu menuId={menuId} menus={menus}>
      <li
        key={channel.roomId}
        className={(isSelect && ['person', 'active'].join(' ')) || 'person'}
        onClick={() => handleClick(channel)}
        onDoubleClick={handleDoubleClick}
      >
        <>
          <div
            className={
              isJoin && channel.openType != 'O'
                ? ['profile-photo', 'private-img'].join(' ')
                : 'profile-photo'
            }
          >
            {(!isJoin || (isJoin && channel.openType === 'O')) &&
              (channel.iconPath ? (
                <img
                  src={`${Config.ServerURL.HOST}${channel.iconPath}`}
                  onError={e => {
                    e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
                    e.target.onerror = null;
                  }}
                ></img>
              ) : (
                <div className="spare-text">
                  {(channel.roomName && channel.roomName[0]) || 'N'}
                </div>
              ))}
          </div>
        </>
        {channel.openType != 'O' && <span className="private" />}
        <span className="channelName">
          <span>
            {channel.roomName == '' ? covi.getDic('NoTitle') : channel.roomName}
          </span>
          <span className="categoryName">
            {channel.categoryName ? `(${channel.categoryName})` : ''}
          </span>
        </span>
        {isJoin ? (
          <>
            <span
              className="addchannel-btn"
              onClick={() => handleJoinChannel(channel)}
            ></span>
            <span className="preview">
              {channel.description == ''
                ? covi.getDic('NoDescription')
                : channel.description}
            </span>
          </>
        ) : (
          <>
            <span className="time">{messageDate}</span>
            <span className="preview">{lastMessageText}</span>
          </>
        )}

        {channel.unreadCnt > 0 && (
          <span className="count">{channel.unreadCnt}</span>
        )}
      </li>
    </RightConxtMenu>
  );
};

export default React.memo(ChannelItem);
