import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getRooms, openRoom, updateRooms } from '@/modules/room';
import SearchBar from '@COMMON/SearchBar';
import RoomItems from '@C/chat/RoomItems';
import { openPopup } from '@/lib/common';
import useTyping from '@/hooks/useTyping';

const ChatRoomContainer = () => {
  const [searchText, setSearchText] = useState('');
  const [listMode, setListMode] = useState('N'); //Normal, Search
  const [searchList, setSearchList] = useState([]);

  const roomList = useSelector(({ room }) => room.rooms);
  const viewType = useSelector(({ room }) => room.viewType);
  const loading = useSelector(({ loading }) => loading['room/GET_ROOMS']);
  const userId = useSelector(({ login }) => login.id);
  const { needAlert, confirm } = useTyping();

  const dispatch = useDispatch();

  const handleRoomChange = useCallback(
    roomId => {
      confirm(dispatch, openRoom, { roomID: roomId });
    },
    [dispatch],
  );

  useEffect(() => {
    if (listMode == 'S') {
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
    if (updateList.length > 0) {
      dispatch(updateRooms({ updateList }));
    }
  }, [roomList]);

  useEffect(() => {
    if (roomList == null || roomList.length == 0) dispatch(getRooms());
  }, []);
  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_chatSearch')}
        input={searchText}
        onChange={e => {
          handleSearch(e.target.value);
        }}
      />
      {listMode == 'N' && (
        <>
          {roomList.length > 0 && (
            <RoomItems
              rooms={roomList}
              loading={loading}
              onRoomChange={handleRoomChange}
              isDoubleClick={viewType == 'S' && SCREEN_OPTION != 'G'}
            />
          )}
          {roomList.length == 0 && (
            <div className="nodataBox" style={{ marginTop: '80px' }}>
              <p className="subtxt">{covi.getDic('Msg_NoChatRoom')}</p>
            </div>
          )}
        </>
      )}
      {listMode == 'S' && (
        <RoomItems
          rooms={searchList}
          loading={false}
          onRoomChange={handleRoomChange}
          isDoubleClick={viewType == 'S' && SCREEN_OPTION != 'G'}
        />
      )}
    </>
  );
};

export default ChatRoomContainer;
