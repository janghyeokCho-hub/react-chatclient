import React, { useCallback, useEffect, useState, useLayoutEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Room from '@C/chat/Room';
import LoadingWrap from '@COMMON/LoadingWrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { leaveRoomUtil } from '@/lib/roomUtil';
import { evalConnector, getPinnedRooms, savePinnedRooms } from '@/lib/deviceConnector';
import useOffset from '@/hooks/useOffset';
import { getConfig } from '@/lib/util/configUtil';
import { openPopup } from '@/lib/common';

const RoomItems = ({ rooms, loading, onRoomChange, isDoubleClick }) => {
  const dispatch = useDispatch();
  const selectId = useSelector(({ room }) => room.selectId);
  const myInfo = useSelector(({ login }) => login.userInfo);
  const RENDER_UNIT = 5;
  const [pinnedRooms, setPinnedRooms] = useState(getPinnedRooms({ userId: myInfo.id, type: 'R' }) || []);
  const pinToTopLimit = useMemo(() => getConfig('PinToTop_Limit_Chat', -1), []);

  const sortedRooms = useMemo(() => {
    const pinned = []
    const unpinned = rooms.filter(r => pinnedRooms.includes(r.roomID) === false);

    pinnedRooms.forEach(p => {
      const pinnedRoom = rooms.find(r => r.roomID === p);
      if (pinnedRoom) {
        pinned.push(pinnedRoom);
      }
    });
    return [...pinned, ...unpinned];
  }, [rooms, pinnedRooms]);

  const { handleScrollUpdate, list } = useOffset(sortedRooms, { initialNumToRender: 1, renderPerBatch : RENDER_UNIT });
  const handleUpdate = handleScrollUpdate({
    threshold: 0.85
  });

  const onPinChange = useCallback((type, roomID) => {
    if (type === 'ADD') {
      if (pinToTopLimit > -1 && pinToTopLimit !==0 && pinnedRooms?.length >= pinToTopLimit) {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_PinToTop_LimitExceeded', '더 이상 고정할 수 없습니다.')
          },
          dispatch
        );
        return;
      }
      // 상단고정 추가
      setPinnedRooms((state) => [...state, roomID])
    } else if (type === 'DEL') {
      // 상단고정 삭제
      setPinnedRooms((state) => state.filter(r => r !== roomID));
    }
  }, [pinnedRooms]);

  useLayoutEffect(() => {
    // 상단고정 변경시 로컬데이터 update
    savePinnedRooms({ userId: myInfo.id, type: 'R', data: pinnedRooms });
  }, [pinnedRooms]);

  return (
    <Scrollbars
      style={{ height: 'calc(100% - 124px)' }}
      autoHide={true}
      className="MessageList"
      onUpdate={handleUpdate}
    >
      <ul className="people">
        {loading && <LoadingWrap />}
        {
          !loading &&
          list((room, _) => {
            const isSelect = room.roomID === selectId;
            return (
              <Room
                  key={room.roomID}
                  room={room}
                  onRoomChange={onRoomChange}
                  dbClickEvent={isDoubleClick}
                  isSelect={isSelect}
                  pinnedTop={pinnedRooms.includes(room?.roomID)}
                  onPinChange={onPinChange}
              />
            )
          })
        }
      </ul>
    </Scrollbars>
  );
};

export default RoomItems;
