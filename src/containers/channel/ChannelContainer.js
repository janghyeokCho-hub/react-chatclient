// containers\chatRoom\chatRoomContainer.js

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { getChannels, updateChannels, openChannel } from '@/modules/channel';
import * as channelApi from '@/lib/channel';

import SearchBar from '@COMMON/SearchBar';
import ChannelItems from '@C/channels/ChannelItems';
import { getConfig } from '@/lib/util/configUtil';
import useTyping from '@/hooks/useTyping';

const ChannelContainer = () => {
  const myInfo = useSelector(({ login }) => login.userInfo);
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);

  const [searchText, setSearchText] = useState('');
  const [listMode, setListMode] = useState('N'); //Normal, Search
  const [searchList, setSearchList] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const channelList = useSelector(({ channel }) => channel.channels);
  const viewType = useSelector(({ channel }) => channel.viewType);
  const loading = useSelector(({ loading }) => loading['channel/GET_CHANNELS']);
  const userId = useSelector(({ login }) => login.id);
  const { confirm } = useTyping();

  const dispatch = useDispatch();

  const IsSaaSClient = getConfig('IsSaaSClient', 'N');

  const handleChannelChange = useCallback(
    roomId => {
      confirm(dispatch, openChannel, { roomId });
    },
    [dispatch],
  );

  const handleSearchChange = useCallback(
    e => {
      const changeVal = e.target.value;
      setSearchText(changeVal);
      if (!changeVal) {
        setListMode('N');
      } else {
        setSearchLoading(true);
        let reqDatas;
        if (IsSaaSClient === 'Y') {
          reqDatas = {
            type: 'name',
            value: changeVal,
            companyCode: myInfo.CompanyCode,
          };
        } else {
          reqDatas = {
            type: 'name',
            value: changeVal,
          };
        }
        channelApi
          .searchChannel({
            reqDatas,
          })
          .then(({ data }) => {
            if (data.status === 'SUCCESS') {
              // setSearchList(data.result);
              const searchChannels = data.result;
              searchChannels.map(sc => {
                const channelIdx = channelList.findIndex(
                  c => c.roomId === sc.roomId,
                );
                if (channelIdx > -1) {
                  sc.isJoin = false;
                } else {
                  sc.isJoin = true;
                }
              });

              setSearchList(searchChannels);
            } else {
              setSearchText('');
            }
            setListMode('S');
            setSearchLoading(false);
          })
          .catch(e => {
            console.error(e);
            // 초기화
            setSearchText('');
            setSearchLoading(false);
          });
      }
    },
    [searchList],
  );

  useEffect(() => {
    // channelList가 변할때 categoryCode가 null인 속성들을 찾아 요청 및 데이터 채워줌
    let updateList = [];
    if (channelList) {
      channelList.forEach(c => {
        if (!c.categoryCode) {
          updateList.push(c.roomId);
        } else if (!c.updateDate) {
          updateList.push(c.roomId);
        }
      });
    }

    if (updateList?.length) {
      dispatch(
        updateChannels({
          userId,
          updateList,
        }),
      );
    }
  }, [channelList]);

  useEffect(() => {
    dispatch(
      getChannels({
        userId,
        members: [userId],
      }),
    );
  }, []);

  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_channelSearch', '채널이름 검색')}
        input={searchText}
        onChange={handleSearchChange}
        disabled={isExtUser === 'Y'}
      />
      <div className="ListDivisionLine noarrow">
        {listMode === 'N'
          ? covi.getDic('SubscribedChannel', '가입한 채널')
          : covi.getDic('SearchResult', '검색 결과')}
      </div>
      {listMode === 'N' && (
        <ChannelItems
          channels={channelList}
          loading={loading}
          onChannelChange={handleChannelChange}
          isDoubleClick={viewType === 'S' && SCREEN_OPTION !== 'G'}
          isSearch={listMode === 'S'}
        />
      )}
      {listMode === 'S' && (
        <ChannelItems
          channels={searchList}
          loading={searchLoading}
          onChannelChange={handleChannelChange}
          isDoubleClick={viewType === 'S' && SCREEN_OPTION !== 'G'}
          isSearch={listMode === 'S'}
        />
      )}
    </>
  );
};

export default ChannelContainer;
