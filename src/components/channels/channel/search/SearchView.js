import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SearchIndexBox from '@C/chat/chatroom/search/SearchIndexBox'; // 그대로 사용
import SearchList from '@C/channels/channel/search/SearchList';
import SearchHeader from '@C/channels/channel/search/SearchHeader';
import LoadingWrap from '@/components/common/LoadingWrap';
import * as messageApi from '@/lib/message';
import * as common from '@/lib/common';

const SearchView = ({ onSearchBox }) => {
  const roomID = useSelector(({ channel }) => channel.currentChannel.roomId);

  const dispatch = useDispatch();

  const [searchText, setSearchText] = useState('');
  const [moveData, setMoveData] = useState(null);
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof covi.changeSearchText == 'string') {
      handleSearch(covi.changeSearchText);
      covi.changeSearchText = null;
    }
  }, []);

  const handleSearchBox = useCallback(() => {
    setMoveData(null);
    setSearchResult([]);
    setSearchText('');

    onSearchBox(false);
  }, [onSearchBox]);

  const setMoveMessagesData = useCallback(data => {
    if (data.status == 'SUCCESS') {
      if (data.search.length > 0 && data.firstPage.length > 0) {
        setMoveData({
          firstPage: data.firstPage,
          moveId: data.search[0],
        });
        setSearchResult(data.search);
      }
    } else {
      setSearchText('');
    }

    setLoading(false);
  }, []);

  const handleSearch = useCallback(
    searchText => {
      setLoading(true);
      // TODO: 멘션, eumtalk:// 사용부분에 대한 처리방안 필요
      if (!/eumtalk:\/\//.test(searchText)) setSearchText(searchText);
      setSearchResult([]);
      setMoveData(null);
      // 검색된 messageId 및 첫 페이지 데이터
      const param = {
        roomId: roomID,
        search: searchText,
        loadCnt: 100,
      };

      messageApi
        .searchChannelMessage(param)
        .then(({ data }) => {
          if (data.search == null || data.search.length == 0) {
            setMoveMessagesData(data);
            setSearchText('');
            common.openPopup(
              {
                type: 'Alert',
                message: covi.getDic('Msg_noSearchResult'),
              },
              dispatch,
            );
          } else {
            setMoveMessagesData(data);
          }
        })
        .catch(() => {
          // 초기화
          setSearchText('');
          setLoading(false);
        });
    },
    [roomID, searchText],
  );

  const handleIndex = useCallback(
    index => {
      setLoading(true);
      setMoveData(null);
      messageApi
        .getChannelMessages({
          roomId: roomID,
          startId: searchResult[index],
          loadCnt: 100,
          dist: 'CENTER',
        })
        .then(({ data }) => {
          if (data.status == 'SUCCESS') {
            setMoveData({
              firstPage: data.result,
              moveId: searchResult[index],
            });
          } else {
            setSearchText('');
          }

          setLoading(false);
        })
        .catch(() => {
          // 초기화
          setSearchText('');
          setLoading(false);
        });
    },
    [roomID, searchResult],
  );

  const handleSearchText = text => {
    setSearchText(text);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {loading && <LoadingWrap></LoadingWrap>}
      <SearchHeader
        searchText={searchText}
        onChange={handleSearchText}
        onSearchBox={handleSearchBox}
        onSearch={handleSearch}
        disabled={loading}
      ></SearchHeader>
      <SearchList
        moveData={moveData}
        markingText={searchText}
        roomID={roomID}
      ></SearchList>
      <SearchIndexBox
        length={searchResult.length}
        onChange={handleIndex}
      ></SearchIndexBox>
    </div>
  );
};

export default React.memo(SearchView);
