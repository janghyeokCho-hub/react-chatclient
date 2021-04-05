import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Room from '@C/chat/Room';
import LoadingWrap from '@COMMON/LoadingWrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { leaveRoomUtil } from '@/lib/roomUtil';
import { evalConnector } from '@/lib/deviceConnector';
import useOffset from '@/hooks/useOffset';

const RoomItems = ({ rooms, loading, onRoomChange, isDoubleClick }) => {
  const selectId = useSelector(({ room }) => room.selectId);
  const RENDER_UNIT = 5;
  const { handleScrollUpdate, list } = useOffset(rooms, { initialNumToRender: 1, renderPerBatch : RENDER_UNIT });
  const handleUpdate = handleScrollUpdate({
    threshold: 0.85
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
              />
            )
          })
        }
      </ul>
    </Scrollbars>
  );
};

export default RoomItems;
