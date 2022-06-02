import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MoveList from '@C/channels/channel/move/MoveList';
import MoveHeader from '@C/chat/chatroom/move/MoveHeader'; // 그대로 사용
import LoadingWrap from '@/components/common/LoadingWrap';
import * as messageApi from '@/lib/message';
import { setMoveView } from '@/modules/message';
import { evalConnector } from '@/lib/deviceConnector';

const MoveView = () => {
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const roomId = useSelector(({ channel }) => channel.currentChannel.roomId);
  const moveId = useSelector(({ message }) => message.moveId);

  const dispatch = useDispatch();

  const [moveData, setMoveData] = useState(null);
  const [loading, setLoading] = useState(false);

  const setMoveMessagesData = useCallback(
    data => {
      if (data.status == 'SUCCESS') {
        if (data.result?.length) {
          setMoveData({
            firstPage: data.result,
            moveId: moveId,
          });
        } else {
          openPopup(
            {
              type: 'Alert',
              message: covi.getDic(
                'Msg_noSearchResult',
                '검색결과가 없습니다.',
              ),
            },
            dispatch,
          );
        }
      }

      setLoading(false);
    },
    [moveId],
  );

  const handleMoveBox = useCallback(() => {
    setMoveData(null);
    // visible false
    dispatch(setMoveView({ moveRoomID: -1, visible: false, moveId: -1 }));
  }, [dispatch]);

  useEffect(() => {
    setLoading(true);
    setMoveData(null);

    // 검색된 messageId 및 첫 페이지 데이터
    const param = {
      roomId,
      startId: moveId,
      loadCnt: 100,
      dist: 'CENTER',
    };

    messageApi
      .getChannelMessages(param)
      .then(({ data }) => {
        setMoveMessagesData(data);
      })
      .catch(() => {
        // 초기화
        setLoading(false);
      });
    //
  }, [moveId]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {loading && <LoadingWrap></LoadingWrap>}
      <MoveHeader onMoveBox={handleMoveBox}></MoveHeader>
      <MoveList
        moveData={moveData}
        roomID={roomId}
        chineseWall={chineseWall}
      ></MoveList>
    </div>
  );
};

export default MoveView;
