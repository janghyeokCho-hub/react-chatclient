import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import SearchBar from '@COMMON/SearchBar';
import ChatItem from './ChatItem';
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

const ChatList = ({ roomList, checkObj }) => {
  const RENDER_UNIT = 5;

  const myInfo = useSelector(({ login }) => login.userInfo);

  const [listMode, setListMode] = useState('N');
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState([]);

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
    const unpinned = [];

    roomList.forEach(r => {
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
      }
    });

    pinned.sort((a, b) => {
      const aSetting = getRoomSettings(a);
      const bSetting = getRoomSettings(b);
      return bSetting.pinTop - aSetting.pinTop;
    });
    return [...pinned, ...unpinned];
  }, [roomList]);

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
              const setting = getRoomSettings(room);

              let isPinTop = false;
              if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
                isPinTop = true;
              }

              if (room.roomType !== 'A') {
                return (
                  <ChatItem
                    room={room}
                    key={room.roomID}
                    checkObj={checkObj}
                    isClick={false}
                    pinnedTop={isPinTop}
                  />
                );
              }
            })}
          {listMode === 'S' &&
            searchList &&
            searchList.map(room => {
              if (room.roomType !== 'A') {
                const setting = getRoomSettings(room);

                let isPinTop = false;
                if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
                  isPinTop = true;
                }

                return (
                  <ChatItem
                    room={room}
                    key={room.roomID}
                    checkObj={checkObj}
                    isClick={false}
                    pinnedTop={isPinTop}
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
