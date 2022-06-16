import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Room from '@C/chat/Room';
import LoadingWrap from '@COMMON/LoadingWrap';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import { isJSONStr } from '@/lib/common';
import { getConfig } from '@/lib/util/configUtil';

const isEmptyObj = obj => {
  if (obj?.constructor === Object && Object.keys(obj).length === 0) {
    return true;
  }
  return false;
};

const getRoomSettings = (room = {}) => {
  return (
    (isJSONStr(room.setting) ? JSON.parse(room.setting) : room.setting) || {}
  );
};

const RoomItems = ({
  rooms,
  loading,
  onRoomChange,
  isDoubleClick,
  chineseWall = [],
}) => {
  const selectId = useSelector(({ room }) => room.selectId);

  const RENDER_UNIT = 5;
  const pinToTopLimit = useMemo(
    () => getConfig('PinToTop_Limit_Chat', -1),
    [rooms],
  );
  const [pinnedRooms, setPinnedRooms] = useState([]);

  const sortedRooms = useMemo(() => {
    const pinned = [];
    const unpinned = [];
    const result = [];

    if (pinToTopLimit >= 0) {
      rooms.forEach(r => {
        const setting = getRoomSettings(r);
        if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
          pinned.push(r);
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
      return result.concat([...pinned, ...unpinned]);
    } else {
      return result.concat(rooms).sort((a, b) => {
        return b.lastMessageDate - a.lastMessageDate;
      });
    }
  }, [rooms, pinToTopLimit]);

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
                pinToTopLimit={pinToTopLimit}
                chineseWall={chineseWall}
              />
            );
          })}
      </ul>
    </Scrollbars>
  );
};

export default RoomItems;
