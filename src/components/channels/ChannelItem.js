import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { newWinChannel, openChannel } from '@/modules/channel';
import RightConxtMenu from '../common/popup/RightConxtMenu';
import { newChannel } from '@/lib/deviceConnector';
import Config from '@/config/config';
import { getAesUtil } from '@/lib/aesUtil';
import {
  clearLayer,
  openPopup,
  makeMessageText,
  isJSONStr,
  makeDateTime,
} from '@/lib/common';
import { joinChannel as joinChannelAPI } from '@/lib/channel';
import { evalConnector } from '@/lib/deviceConnector';
import { modifyChannelSetting } from '@/modules/channel';
import { isBlockCheck } from '@/lib/orgchart';

const ChannelItem = ({
  channel,
  onChannelChange,
  isSelect,
  dbClickEvent,
  getMenuData,
  isJoin,
  getChannelSettings,
  isEmptyObj,
  pinnedChannels,
  isCategory = false,
  pinToTopLimit = -1,
}) => {
  const id = useSelector(({ login }) => login.id);
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const channels = useSelector(({ channel }) => channel.channels);
  const menuId = useMemo(() => 'channel_' + channel.roomId, [channel]);
  const [pinnedTop, setPinnedTop] = useState(false);
  const setting = useMemo(
    () => getChannelSettings && getChannelSettings(channel),
    [channel],
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (pinToTopLimit >= 0) {
      if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
        setPinnedTop(true);
      } else {
        setPinnedTop(false);
      }
    } else {
      setPinnedTop(false);
    }
  }, [channel, pinToTopLimit]);

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

      const openURL = `${DEVICE_TYPE === 'd' ? '#' : ''}/client/nw/channel/${
        channel.roomId
      }`;

      const channelObj = newChannel(winName, channel.roomId, openURL);

      dispatch(
        newWinChannel({ id: channel.roomId, obj: channelObj, name: winName }),
      );
    } else if (dbClickEvent && channel.newWin) {
      if (DEVICE_TYPE === 'd') {
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
            // no windows - window ??? ??????
            onChannelChange(channel.roomId);
            const winName = `wrf${channel.roomId}`;
            const openURL = `${
              DEVICE_TYPE === 'd' ? '#' : ''
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
            title: covi.getDic('Eumtalk', '?????????'),
            message: covi.getDic(
              'Msg_AskEnterChannel',
              '?????? ????????? ?????????????????????????',
            ),
            initValue: '',
            callback: result => {
              if (result) {
                //?????? ??????
                if (channel.openType !== 'O') {
                  openPopup(
                    {
                      type: 'Prompt',
                      inputType: 'password',
                      title: covi.getDic('ChannelPassword', '????????????'),
                      message: covi.getDic(
                        'Msg_InputChannelPassword',
                        '????????? ????????? ????????? ???????????????.',
                      ),
                      initValue: '',
                      callback: result => {
                        if (!result) {
                          openPopup(
                            {
                              type: 'Custom',
                              message: covi.getDic(
                                'Msg_InputChannelPassword',
                                '????????? ????????? ????????? ???????????????.',
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
                //?????? ?????? ??????
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
      joinChannelAPI(params).then(({ data }) => {
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
      if (channel.openType !== 'O' && channel.channelUnlock === 'N') {
        const params = {
          roomId: channel.roomId,
          openType: channel.openType,
          members: [id],
        };

        openPopup(
          {
            type: 'Prompt',
            inputType: 'password',
            title: covi.getDic('ChannelPassword', '????????????'),
            message: covi.getDic(
              'Msg_InputChannelPassword',
              '????????? ????????? ????????? ???????????????.',
            ),
            initValue: '',
            callback: result => {
              if (!result) {
                openPopup(
                  {
                    type: 'Custom',
                    message: covi.getDic(
                      'Msg_InputChannelPassword',
                      '????????? ????????? ????????? ???????????????.',
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
      let chageSetting = getChannelSettings(channel);
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
                '??? ?????? ????????? ??? ????????????.',
              ),
            },
            dispatch,
          );
          return;
        }
        chageSetting[key] = value;
      } else {
        if (isEmptyObj(chageSetting)) {
          chageSetting = {};
        } else {
          chageSetting[key] = value;
        }
      }
      dispatch(
        modifyChannelSetting({
          roomID: channel.roomId,
          key: key,
          value: value,
          setting: JSON.stringify(chageSetting),
        }),
      );
    },
    [channel, pinnedChannels, dispatch, pinToTopLimit],
  );

  const menus = useMemo(() => {
    if (!isCategory) {
      const pinToTop = {
        code: 'pinRoom',
        isline: false,
        onClick: () => {
          const today = new Date();
          handleChangeSetting('pinTop', `${today.getTime()}`, 'ADD');
        },
        name: covi.getDic('PinToTop', '????????????'),
      };
      const unpinToTop = {
        code: 'unpinRoom',
        isline: false,
        onClick: () => {
          handleChangeSetting('pinTop', '', 'DEL');
        },
        name: covi.getDic('UnpinToTop', '???????????? ??????'),
      };
      let menu = [];
      if (pinToTopLimit >= 0) {
        menu.push(pinnedTop ? unpinToTop : pinToTop);
      }
      const menuData = getMenuData(
        dispatch,
        channel,
        id,
        dbClickEvent,
        isSelect,
        handleDoubleClick,
      );
      if (menuData) {
        return menu.concat(menuData);
      } else {
        return menu;
      }
    }
  }, [
    dispatch,
    channel,
    id,
    dbClickEvent,
    isSelect,
    handleDoubleClick,
    pinnedTop,
    pinToTopLimit,
    pinnedChannels,
  ]);

  const messageDate = useMemo(
    () => makeDateTime(channel.lastMessageDate),
    [channel],
  );

  const [lastMessageText, setLastMessageText] = useState('');

  useEffect(() => {
    const changeTargetChannel = channels.find(c => c.roomId == channel.roomId);
    if (changeTargetChannel?.lastMessage && chineseWall?.length) {
      const lastMessageInfo = isJSONStr(changeTargetChannel.lastMessage)
        ? JSON.parse(changeTargetChannel.lastMessage)
        : changeTargetChannel.lastMessage;
      const targetInfo = {
        id: lastMessageInfo.sender,
        companyCode: lastMessageInfo.companyCode,
        deptCode: lastMessageInfo.deptCode,
      };
      const { blockChat, blockFile } = isBlockCheck({
        targetInfo,
        chineseWall,
      });
      const isFile = !!lastMessageInfo?.File;
      const result = isFile ? blockFile : blockChat;
      if (result) {
        setLastMessageText(covi.getDic('BlockChat', '????????? ????????? ?????????.'));
      } else {
        makeMessageText(changeTargetChannel.lastMessage, 'CHANNEL').then(
          setLastMessageText,
        );
      }
    } else {
      makeMessageText(changeTargetChannel?.lastMessage, 'CHANNEL').then(
        setLastMessageText,
      );
    }
  }, [channel, chineseWall, channels, lastMessageText]);

  return (
    <RightConxtMenu
      menuId={isCategory ? `category_${menuId}` : menuId}
      menus={isCategory ? null : menus}
    >
      <li
        key={channel.roomId}
        className={(isSelect && ['person', 'active'].join(' ')) || 'person'}
        onClick={() => handleClick(channel)}
        onDoubleClick={handleDoubleClick}
      >
        <>
          <div
            className={
              isJoin && channel.openType !== 'O'
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
        {channel.openType !== 'O' && <span className="private" />}
        <span className="channelName">
          <span>
            {channel.roomName === ''
              ? covi.getDic('NoTitle', '????????????')
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
              {channel.description === ''
                ? covi.getDic('NoDescription', '????????????')
                : channel.description}
            </span>
          </>
        ) : (
          <>
            <span className="time">
              {pinToTopLimit >= 0 && pinnedTop && '????'}
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
