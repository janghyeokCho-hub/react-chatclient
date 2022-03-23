import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import SearchBar from '@COMMON/SearchBar';

import { getPinnedRooms } from '@/lib/deviceConnector';

import ChatItem from './ChatItem';

const ChatList = ({ roomList, checkObj }) => {
  const RENDER_UNIT = 5;

  const myInfo = useSelector(({ login }) => login.userInfo);

  const [listMode, setListMode] = useState('N');
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState([]);
  const [pinnedRooms, setPinnedRooms] = useState(
    getPinnedRooms({ userId: myInfo.id, type: 'R' }) || [],
  );

  const handleSearch = useCallback(
    changeVal => {
      setSearchText(changeVal);

      if (changeVal === '') {
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
                  member.id != myInfo.id &&
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
    if (listMode == 'S') {
      handleSearch(searchText);
    }
  }, [roomList]);

  const sortedRooms = useMemo(() => {
    const pinned = [];
    const unpinned = roomList.filter(
      r => pinnedRooms.includes(r.roomID) === false,
    );

    pinnedRooms.forEach(p => {
      const pinnedRoom = roomList.find(r => r.roomID === p);
      if (pinnedRoom) {
        pinned.push(pinnedRoom);
      }
    });
    return [...pinned, ...unpinned];
  }, [roomList, pinnedRooms]);

  const { handleScrollUpdate, list } = useOffset(sortedRooms, {
    initialNumToRender: 1,
    renderPerBatch: RENDER_UNIT,
  });

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85,
  });

  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_chatSearch', '방 이름, 참여자 검색')}
        input={searchText}
        onChange={e => {
          handleSearch(e.target.value);
        }}
      />
      <Scrollbars
        style={{ height: '80%' }}
        autoHide={true}
        className="MessageList"
        onUpdate={handleUpdate}
      >
        <ul className="people">
          {listMode === 'N' &&
            roomList &&
            list((room, _) => {
              if (room.roomType !== 'A') {
                return (
                  <ChatItem
                    room={room}
                    key={room.roomID}
                    checkObj={checkObj}
                    isClick={false}
                  />
                );
              }
            })}
          {listMode === 'S' &&
            searchList &&
            searchList.map(room => {
              if (room.roomType !== 'A') {
                return (
                  <ChatItem
                    room={room}
                    key={room.roomID}
                    checkObj={checkObj}
                    isClick={false}
                  />
                );
              }
            })}
        </ul>
      </Scrollbars>
    </>
  );
};

export default ChatList;
