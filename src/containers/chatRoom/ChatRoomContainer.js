import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getRooms, openRoom, updateRooms } from '@/modules/room';
import SearchBar from '@COMMON/SearchBar';
import RoomItems from '@C/chat/RoomItems';
import useTyping from '@/hooks/useTyping';
import { setChineseWall } from '@/modules/login';
import { getChineseWall } from '@/lib/orgchart';
import { isMainWindow } from '@/lib/deviceConnector';
import { getConfig } from '@/lib/util/configUtil';

const ChatRoomContainer = () => {
  const { id } = useSelector(({ login }) => ({
    id: login.id,
  }));
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const [searchText, setSearchText] = useState('');
  const [listMode, setListMode] = useState('N'); //Normal, Search
  const [searchList, setSearchList] = useState([]);
  const [chineseWallState, setChineseWallState] = useState([]);

  const roomList = useSelector(({ room }) => room.rooms);
  const viewType = useSelector(({ room }) => room.viewType);
  const loading = useSelector(({ loading }) => loading['room/GET_ROOMS']);
  const userId = useSelector(({ login }) => login.id);
  const { confirm } = useTyping();

  const dispatch = useDispatch();

  const handleRoomChange = useCallback(
    roomId => {
      confirm(dispatch, openRoom, { roomID: roomId });
    },
    [dispatch],
  );

  useEffect(() => {
    const getChineseWallList = async () => {
      const { result, status } = await getChineseWall({
        userId: id,
      });
      if (status === 'SUCCESS') {
        setChineseWallState(result);
        if (DEVICE_TYPE === 'd' && !isMainWindow()) {
          dispatch(setChineseWall(result));
        }
      } else {
        setChineseWallState([]);
      }
    };

    if (chineseWall?.length) {
      setChineseWallState(chineseWall);
    } else {
      const useChineseWall = getConfig('UseChineseWall', false);
      if (useChineseWall) {
        getChineseWallList();
      } else {
        setChineseWallState([]);
      }
    }

    return () => {
      setChineseWallState([]);
    };
  }, [chineseWall]);

  useEffect(() => {
    if (listMode === 'S') {
      handleSearch(searchText);
    }
  }, [roomList]);

  const handleSearch = useCallback(
    changeVal => {
      setSearchText(changeVal);

      if (changeVal == '') {
        setListMode('N');
      } else {
        const filterList = roomList.filter(item => {
          let returnVal = false;

          if (
            item.roomName &&
            item.roomName.toLowerCase().indexOf(changeVal.toLowerCase()) > -1
          ) {
            return true;
          } else {
            if (item.members) {
              item.members.forEach(member => {
                if (
                  member.id != userId &&
                  member.name.toLowerCase().indexOf(changeVal.toLowerCase()) >
                    -1
                ) {
                  returnVal = true;
                  return false;
                }
              });
            } else {
              returnVal = false;
            }
          }

          return returnVal;
        });

        setSearchList(filterList);
        setListMode('S');
      }
    },
    [roomList],
  );

  useEffect(() => {
    // roomList가 변할때 updatedate가 null인 속성들을 찾아 요청 및 데이터 채워줌
    let updateList = [];
    if (roomList) {
      roomList.forEach(r => {
        if (r.updateDate === null) updateList.push(r.roomID);
      });
    }
    if (updateList?.length > 0) {
      dispatch(updateRooms({ updateList }));
    }
  }, [roomList]);

  useEffect(() => {
    if (roomList == null || roomList?.length == 0) dispatch(getRooms());
  }, []);
  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_chatSearch', '방 이름, 참여자 검색')}
        input={searchText}
        onChange={e => {
          handleSearch(e.target.value);
        }}
      />
      {listMode === 'N' && (
        <>
          {roomList?.length && (
            <RoomItems
              rooms={roomList}
              loading={loading}
              onRoomChange={handleRoomChange}
              isDoubleClick={viewType === 'S' && SCREEN_OPTION !== 'G'}
              chineseWall={chineseWallState}
            />
          )}
          {!roomList?.length && (
            <div className="nodataBox" style={{ marginTop: '80px' }}>
              <p className="subtxt">
                {covi.getDic(
                  'Msg_NoChatRoom',
                  '대화를 시작한 채팅방이 없습니다.',
                )}
              </p>
            </div>
          )}
        </>
      )}
      {listMode === 'S' && (
        <RoomItems
          rooms={searchList}
          loading={false}
          onRoomChange={handleRoomChange}
          isDoubleClick={viewType === 'S' && SCREEN_OPTION !== 'G'}
          chineseWall={chineseWallState}
        />
      )}
    </>
  );
};

export default ChatRoomContainer;
