// components\chat\RoomItems.js

import React, { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ChannelItem from '@C/channels/ChannelItem';
import LoadingWrap from '@COMMON/LoadingWrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { leaveRoomUtil } from '@/lib/roomUtil';
import { evalConnector } from '@/lib/deviceConnector';
import useOffset from '@/hooks/useOffset';

const ChannelItems = ({
  channels,
  loading,
  onChannelChange,
  isDoubleClick,
  isSearch,
}) => {
  const selectId = useSelector(({ channel }) => channel.selectedId);
  const joinedChannelList = useSelector(({ channel }) => channel.channels);

  const [isNotis, setIsNotis] = useState({});
  const RENDER_UNIT = 5;
  const { handleScrollUpdate, list } = useOffset(channels, { initialNumToRender: 1, renderPerBatch : RENDER_UNIT });
  const handleUpdate = handleScrollUpdate({
    threshold: 0.85
  });

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      const userConfig = evalConnector({
        method: 'getGlobal',
        name: 'USER_SETTING',
      });

      // notiExRooms에 없거나 등록된경우에도 false로 등록됨으로 not 연산자 처리
      if (userConfig && userConfig.config) {
        const notiExRooms = userConfig.get('notiExRooms');
        setIsNotis(notiExRooms);
      }
    }
  }, []);

  const getMenuData = useCallback(
    (dispatch, channel, id, dbClickEvent, isSelect, handleDoubleClick) => {
      const menus = [
        {
          code: 'openChannel',
          isline: false,
          onClick: () => {
            if (dbClickEvent) {
              handleDoubleClick();
            } else {
              if (!isSelect) onChannelChange(channel.roomId);
            }
          },
          name: covi.getDic('OpenChannel'),
        },
      ];

      /*
      if (DEVICE_TYPE != 'b') {
        menus.push({
          code: 'line',
          isline: true,
          onClick: () => {},
          name: '',
        });

        menus.push({
          code: 'notiOff',
          isline: false,
          onClick: () => {
            const result = evalConnector({
              method: 'sendSync',
              channel: 'room-noti-setting',
              message: { roomID: room.roomID, noti: !isNotis[room.roomID] },
            });

            let tempNotis = isNotis;
            tempNotis[room.roomID] = !isNotis[room.roomID];
            setIsNotis(tempNotis);
          },
          name: !isNotis[room.roomID] ? '알림 끄기' : '알림 켜기',
        });
      } */

      return menus;
    },
    [isNotis],
  );

  return (
    <Scrollbars
      style={{ height: 'calc(100% - 156px)' }}
      autoHide={true}
      className="MessageList"
      onUpdate={handleUpdate}
    >
      <ul className="people">
        {loading && <LoadingWrap />}
        {
          !loading &&
          list((channel, _) => {
            const isSelect = channel.roomId === selectId;
            const isJoined = joinedChannelList?.findIndex((chan) => chan.roomId === channel.roomId);
            return (
              <ChannelItem
                key={channel.roomId}
                channel={channel}
                onChannelChange={onChannelChange}
                dbClickEvent={isJoined !== -1 && isDoubleClick}
                isSelect={isSelect}
                getMenuData={getMenuData}
                isJoin={isJoined === -1}
              />
            );
          })
        }
      </ul>
    </Scrollbars>
  );
};

export default React.memo(ChannelItems);
