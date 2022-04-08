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
import {
  getSysMsgFormatStr,
  clearLayer,
  openPopup,
  isJSONStr,
  getDictionary,
  eumTalkRegularExp,
  convertEumTalkProtocolPreviewForChannelItem,
} from '@/lib/common';
import { getConfig } from '@/lib/util/configUtil';
import * as channelApi from '@/lib/channel';
import { evalConnector } from '@/lib/deviceConnector';
import { modifyChannelSetting } from '@/modules/channel';

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
  let returnText = covi.getDic('Msg_NoMessages', '대화내용 없음');

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
      if (isJSONStr(msgObj.Message)) {
        const drawData = JSON.parse(msgObj.Message);

        if (drawData.msgType == 'C') {
          drawText = getDictionary(drawData.title);
        } else {
          drawText = drawData.context;
        }
      }
      // protocol check
      if (eumTalkRegularExp.test(drawText)) {
        const messageObj = await convertEumTalkProtocolPreviewForChannelItem(
          drawText,
        );
        if (messageObj.type == 'emoticon')
          returnText = covi.getDic('Emoticon', '이모티콘');
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
          returnText = getSysMsgFormatStr(
            covi.getDic('Tmp_imgExCnt', '사진 외 %s건'),
            [{ type: 'Plain', data: fileObj.length - 1 }],
          );
        } else {
          // 파일 외 %s건
          returnText = getSysMsgFormatStr(
            covi.getDic('Tmp_fileExCnt', '파일 외 %s건'),
            [{ type: 'Plain', data: fileObj.length - 1 }],
          );
        }
      } else {
        if (
          fileObj.ext == 'png' ||
          fileObj.ext == 'jpg' ||
          fileObj.ext == 'jpeg' ||
          fileObj.ext == 'bmp'
        ) {
          returnText = covi.getDic('Image', '사진');
        } else {
          returnText = covi.getDic('File', '파일');
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
  pinnedTop,
  pinnedChannels,
}) => {
  const id = useSelector(({ login }) => login.id);
  const channels = useSelector(({ channel }) => channel.channels);
  const pinToTopLimit = useMemo(
    () => getConfig('PinToTop_Limit_Channel', -1),
    [],
  );

  const menuId = useMemo(() => 'channel_' + channel.roomId, [channel]);
  const dispatch = useDispatch();

  useEffect(() => {
    evalConnector({
      method: 'on',
      channel: 'onNewDeleteMessage',
      callback: (_, args) => {
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
            title: covi.getDic('Eumtalk', '이음톡'),
            message: covi.getDic(
              'Msg_AskEnterChannel',
              '해당 채널에 참여하시겠습니까?',
            ),
            initValue: '',
            callback: result => {
              if (result) {
                //채널 입장
                if (channel.openType != 'O') {
                  openPopup(
                    {
                      type: 'Prompt',
                      inputType: 'password',
                      title: covi.getDic('ChannelPassword', '가입암호'),
                      message: covi.getDic(
                        'Msg_InputChannelPassword',
                        '가입시 필요한 암호를 입력하세요.',
                      ),
                      initValue: '',
                      callback: result => {
                        if (!result) {
                          openPopup(
                            {
                              type: 'Custom',
                              message: covi.getDic(
                                'Msg_InputChannelPassword',
                                '가입시 필요한 암호를 입력하세요.',
                              ),
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
            title: covi.getDic('ChannelPassword', '가입암호'),
            message: covi.getDic(
              'Msg_InputChannelPassword',
              '가입시 필요한 암호를 입력하세요.',
            ),
            initValue: '',
            callback: result => {
              if (!result) {
                openPopup(
                  {
                    type: 'Custom',
                    message: covi.getDic(
                      'Msg_InputChannelPassword',
                      '가입시 필요한 암호를 입력하세요.',
                    ),
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

  const handleChangeSetting = useCallback(
    (key, value, type) => {
      let setting = null;
      if (type === 'ADD') {
        if (
          pinToTopLimit > -1 &&
          pinToTopLimit !== 0 &&
          pinnedChannels?.length >= pinToTopLimit
        ) {
          openPopup(
            {
              type: 'Alert',
              message: covi.getDic(
                'Msg_PinToTop_LimitExceeded',
                '더 이상 고정할 수 없습니다.',
              ),
            },
            dispatch,
          );
          return;
        }

        if (channel.settingJSON === null) {
          setting = {};
        } else if (typeof channel.settingJSON === 'object') {
          setting = { ...channel.settingJSON };
        } else if (isJSONStr(channel.settingJSON)) {
          setting = JSON.parse(channel.settingJSON);
        }

        setting[key] = value;
      } else {
        if (channel.settingJSON === null) {
          setting = {};
        } else {
          setting = JSON.parse(channel.settingJSON);
          delete setting[key];
        }
      }
      dispatch(
        modifyChannelSetting({
          roomID: channel.roomId,
          key: key,
          value: value,
          setting: JSON.stringify(setting),
        }),
      );
    },
    [channel, pinnedChannels, dispatch],
  );

  const menus = useMemo(() => {
    const pinToTop = {
      code: 'pinRoom',
      isline: false,
      onClick: () => {
        const today = new Date();
        handleChangeSetting('pinTop', `${today.getTime()}`, 'ADD');
      },
      name: covi.getDic('PinToTop', '상단고정'),
    };
    const unpinToTop = {
      code: 'unpinRoom',
      isline: false,
      onClick: () => {
        handleChangeSetting('pinTop', '', 'DEL');
      },
      name: covi.getDic('UnpinToTop', '상단고정 해제'),
    };
    const menus = [
      pinToTopLimit >= 0 && (pinnedTop ? unpinToTop : pinToTop),
      ...getMenuData(
        dispatch,
        channel,
        id,
        dbClickEvent,
        isSelect,
        handleDoubleClick,
      ),
    ];
    return menus;
  }, [dispatch, channel, id, dbClickEvent, isSelect, handleDoubleClick]);

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
            {channel.roomName == ''
              ? covi.getDic('NoTitle', '제목없음')
              : channel.roomName}
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
                ? covi.getDic('NoDescription', '설명없음')
                : channel.description}
            </span>
          </>
        ) : (
          <>
            <span className="time">
              {pinnedTop && '📌'}
              {messageDate}
            </span>
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
