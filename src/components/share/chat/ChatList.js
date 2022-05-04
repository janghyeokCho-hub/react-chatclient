import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import SearchBar from '@COMMON/SearchBar';
import ChatItem from './ChatItem';
import { getConfig } from '@/lib/util/configUtil';
import { isEmptyObj, getSettings } from '../share';

const ChatList = ({ roomList, checkObj }) => {
  const RENDER_UNIT = 5;

  const myInfo = useSelector(({ login }) => login.userInfo);

  const [listMode, setListMode] = useState('N');
  const [searchText, setSearchText] = useState('');
  const [searchList, setSearchList] = useState([]);
  const pinToTopLimit = useMemo(
    () => getConfig('PinToTop_Limit_Chat', -1),
    [roomList],
  );

  const handleSearch = useCallback(
    changeVal => {
      setSearchText(changeVal);

      if (changeVal === '') {
        setListMode('N');
      } else {
        const filterList = roomList.filter(item => {
          let returnVal = false;
          if (item?.roomName?.toLowerCase().includes(changeVal.toLowerCase())) {
            return true;
          } else {
            if (item.members) {
              item.members.forEach(member => {
                if (
                  member.id != myInfo.id &&
                  member.name.toLowerCase().includes(changeVal.toLowerCase())
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
    const result = [];
    if (pinToTopLimit >= 0) {
      roomList.forEach(r => {
        const setting = getSettings(r, 'CHAT');
        if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
          pinned.push(r);
        } else {
          unpinned.push(r);
        }
      });

      pinned.sort((a, b) => {
        const aSetting = getSettings(a, 'CHAT');
        const bSetting = getSettings(b, 'CHAT');
        return bSetting.pinTop - aSetting.pinTop;
      });
      return result.concat([...pinned, ...unpinned]);
    } else {
      return result.concat(roomList).sort((a, b) => {
        return b.lastMessageDate - a.lastMessageDate;
      });
    }
  }, [roomList, pinToTopLimit]);

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
              const setting = getSettings(room, 'CHAT');

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
                const setting = getSettings(room, 'CHAT');

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
