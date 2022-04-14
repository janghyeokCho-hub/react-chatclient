import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Room from '@C/chat/Room';
import LoadingWrap from '@COMMON/LoadingWrap';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import { isJSONStr } from '@/lib/common';

const isEmptyObj = obj => {
  if (obj && obj.constructor === Object && Object.keys(obj).length === 0) {
    return true;
  }
  return false;
};

const getRoomSettings = room => {
  let setting = null;

  if (room.setting === null) {
    setting = {};
  } else if (typeof room.setting === 'object') {
    setting = { ...room.setting };
  } else if (isJSONStr(room.setting)) {
    setting = JSON.parse(room.setting);
  }
  return setting;
};

const RoomItems = ({ rooms, loading, onRoomChange, isDoubleClick }) => {
  const selectId = useSelector(({ room }) => room.selectId);
  const RENDER_UNIT = 5;
  const [pinnedRooms, setPinnedRooms] = useState([]);

  const sortedRooms = useMemo(() => {
    const pinned = [];
    const unpinned = [];

    rooms.forEach(r => {
      const setting = getRoomSettings(r);
      if (setting) {
        if (isEmptyObj(setting)) {
          unpinned.push(r);
        } else {
          if (!!setting.pinTop) {
            pinned.push(r);
          } else {
            unpinned.push(r);
          }
        }
      } else {
        unpinned.push(r);
      }
    });
    setPinnedRooms(pinned);

    pinned.sort((a, b) => {
      const aSetting = getRoomSettings(a);
      const bSetting = getRoomSettings(b);
      return bSetting.pinTop - aSetting.pinTop;
    });
    return [...pinned, ...unpinned];
  }, [rooms]);

  const { handleScrollUpdate, list } = useOffset(sortedRooms, {
    initialNumToRender: 1,
    renderPerBatch: RENDER_UNIT,
  });

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85,
  });

  return (
    <Scrollbars
      style={{ height: 'calc(100% - 124px)' }}
      autoHide={true}
      className="MessageList"
      onUpdate={handleUpdate}
    >
      <ul className="people">
        {loading && <LoadingWrap />}
        {!loading &&
          list((room, _) => {
            const isSelect = room.roomID === selectId;

            return (
              <Room
                key={room.roomID}
                room={room}
                onRoomChange={onRoomChange}
                dbClickEvent={isDoubleClick}
                isSelect={isSelect}
                getRoomSettings={getRoomSettings}
                isEmptyObj={isEmptyObj}
                pinnedRooms={pinnedRooms}
              />
            );
          })}
      </ul>
    </Scrollbars>
  );
};

export default RoomItems;
