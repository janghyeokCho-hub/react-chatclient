import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import SearchBar from '@COMMON/SearchBar';

import { getPinnedRooms } from '@/lib/deviceConnector';

import ChannelItem from './ChannelItem';

const ChannelList = ({ channels, checkObj }) => {
  const RENDER_UNIT = 5;

  const myInfo = useSelector(({ login }) => login.userInfo);
  const joinedChannelList = useSelector(({ channel }) => channel.channels);

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
        const filterList = channels.filter(item => {
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
    [channels],
  );

  useEffect(() => {
    if (listMode == 'S') {
      handleSearch(searchText);
    }
  }, [channels]);

  const sortedRooms = useMemo(() => {
    const pinned = [];
    const unpinned = channels.filter(
      r => pinnedRooms.includes(r.roomId) === false,
    );

    pinnedRooms.forEach(p => {
      const pinnedRoom = channels.find(r => r.roomId === p);
      if (pinnedRoom) {
        pinned.push(pinnedRoom);
      }
    });
    return [...pinned, ...unpinned];
  }, [channels, pinnedRooms]);

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
            channels &&
            list((channel, _) => {
              const isJoined = joinedChannelList?.findIndex(
                chan => chan.roomId === channel.roomId,
              );
              return (
                <ChannelItem
                  channel={channel}
                  key={channel.roomId}
                  checkObj={checkObj}
                  isClick={false}
                  isJoin={isJoined === -1}
                />
              );
            })}
          {listMode === 'S' &&
            searchList &&
            searchList.map(channel => {
              const isJoined = joinedChannelList?.findIndex(
                chan => chan.roomId === channel.roomId,
              );
              return (
                <ChannelItem
                  channel={channel}
                  key={channel.roomId}
                  checkObj={checkObj}
                  isClick={false}
                  isJoin={isJoined === -1}
                />
              );
            })}
        </ul>
      </Scrollbars>
    </>
  );
};

export default ChannelList;
