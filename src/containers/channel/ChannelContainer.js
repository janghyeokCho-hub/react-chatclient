// containers\chatRoom\chatRoomContainer.js

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { getChannels, updateChannels, openChannel } from '@/modules/channel';
import * as channelApi from '@/lib/channel';

import SearchBar from '@COMMON/SearchBar';
import ChannelItems from '@C/channels/ChannelItems';
import { getConfig } from '@/lib/util/configUtil';
import useTyping from '@/hooks/useTyping';
import { specialCharFilter } from '@/modules/util';

const ChannelContainer = () => {
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);
  const myInfo = useSelector(({ login }) => login.userInfo);

  const [searchText, setSearchText] = useState('');
  const [listMode, setListMode] = useState('N'); //Normal, Search
  const [searchList, setSearchList] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const channelList = useSelector(({ channel }) => channel.channels);
  const viewType = useSelector(({ channel }) => channel.viewType);
  const loading = useSelector(({ loading }) => loading['channel/GET_CHANNELS']);
  const userId = useSelector(({ login }) => login.id);
  const { needAlert, confirm } = useTyping();

  const dispatch = useDispatch();

  const IsSaaSClient = getConfig('IsSaaSClient', 'N');

  const handleChannelChange = useCallback(
    roomId => {
      confirm(dispatch, openChannel, { roomId });
    },
    [dispatch],
  );

  // const handleChannelChange = useCallback(
  //   roomId => {
  //     dispatch(openChannel({ roomId }));
  //   },
  //   [dispatch],
  // );

  const handleSearchChange = useCallback(
    e => {
      const changeVal = specialCharFilter(e.target.value);
      setSearchText(changeVal);

      if (changeVal == '') {
        setListMode('N');
      } else {
        setSearchLoading(true);
        let reqDatas;
        if (IsSaaSClient == 'Y') {
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
            if (data.status == 'SUCCESS') {
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
          .catch(() => {
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
        if (c.categoryCode === null) updateList.push(c.roomId);
        else if (c.updateDate === null) updateList.push(c.roomId);
      });
    }

    if (updateList.length > 0) {
      dispatch(
        updateChannels({
          userId,
          updateList,
        }),
      );
    }
  }, [channelList]);

  useEffect(() => {
    if (channelList == null || channelList.length == 0)
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
        placeholder={covi.getDic('Msg_channelSearch')}
        input={searchText}
        onChange={handleSearchChange}
        disabled={isExtUser == 'Y'}
      />
      <div className="ListDivisionLine noarrow">
        {listMode == 'N'
          ? covi.getDic('SubscribedChannel')
          : covi.getDic('SearchResult')}
      </div>
      {listMode == 'N' && (
        <ChannelItems
          channels={channelList}
          loading={loading}
          onChannelChange={handleChannelChange}
          isDoubleClick={viewType == 'S' && SCREEN_OPTION != 'G'}
          isSearch={listMode === 'S'}
        />
      )}
      {listMode == 'S' && (
        <ChannelItems
          channels={searchList}
          loading={searchLoading}
          onChannelChange={handleChannelChange}
          isDoubleClick={viewType == 'S' && SCREEN_OPTION != 'G'}
          isSearch={listMode === 'S'}
        />
      )}
    </>
  );
};

export default ChannelContainer;
