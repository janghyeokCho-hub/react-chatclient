import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SearchIndexBox from '@C/common/search/SearchIndexBox';
import { SearchList, SearchHeader } from '@C/common/search';
import LoadingWrap from '@/components/common/LoadingWrap';
import * as messageApi from '@/lib/message';
import { evalConnector } from '@/lib/deviceConnector';
import * as common from '@/lib/common';
import { getMessage } from '@/lib/messageUtil';
import useSWR from 'swr';

function requestSearchMessage(param, isChannel = false) {
  if (DEVICE_TYPE == 'd' && !isChannel) {
    return evalConnector({
      method: 'invoke',
      channel: 'req-get-search-messages',
      message: param,
    });
  } else {
    if (isChannel) {
      return messageApi.searchChannelMessage(param);
    } else {
      return messageApi.searchMessage(param);
    }
  }
}

const SearchView = ({ onSearchBox }) => {
  const isChannel = useSelector(
    ({ channel }) => channel.currentChannel?.roomId,
  );
  const roomID = useSelector(
    ({ room, channel }) =>
      room.currentRoom?.roomID || channel.currentChannel?.roomId,
  );
  const currentLastMessage = useSelector(
    ({ room, channel }) => room?.messages?.at(-1) || channel?.messages?.at(-1),
  );

  const currMember = useSelector(
    ({ room, channel }) =>
      room.currentRoom?.members || channel.currentChannel?.members,
  );
  const dispatch = useDispatch();

  const [searchText, setSearchText] = useState('');
  const [moveData, setMoveData] = useState(null);
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: searchOptionState, mutate: setSearchOptionState } = useSWR(
    'message/search',
    null,
  );

  useEffect(() => {
    if (typeof covi.changeSearchText == 'string') {
      handleSearch(covi.changeSearchText);
      covi.changeSearchText = null;
    }
  }, []);

  useLayoutEffect(() => {
    return () => {
      // clean-up
      setSearchText('');
      setSearchOptionState(null);
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
    async (searchOption, searchText) => {
      setLoading(true);
      setSearchResult([]);
      setMoveData(null);
      setSearchOptionState({
        type: searchOption,
        roomId: roomID,
        value: searchText,
      });

      try {
        // 검색된 messageId 및 첫 페이지 데이터
        const param = {
          roomID,
          roomId: roomID,
          search: searchText,
          searchOption,
          loadCnt: 50,
          messageId: currentLastMessage?.messageID, // for sender search
        };
        const response = await requestSearchMessage(param, isChannel);
        if (response?.data?.status !== 'SUCCESS' || !response?.data?.search) {
          setMoveMessagesData(response.data);
          setSearchText('');
          common.openPopup(
            {
              type: 'Alert',
              message: covi.getDic(
                'Msg_noSearchResult',
                '검색결과가 없습니다.',
              ),
            },
            dispatch,
          );
        } else {
          setMoveMessagesData(response.data);
        }
      } catch (err) {
        // 초기화
        setSearchText('');
        setLoading(false);
      }
    },
    [roomID, searchText, dispatch, isChannel, currentLastMessage],
  );

  const handleIndex = useCallback(
    index => {
      setLoading(true);
      setMoveData(null);
      const getCenterMessage = async () => {
        try {
          let response;
          if (isChannel) {
            response = await messageApi.getChannelMessages({
              roomId: roomID,
              startId: searchResult[index],
              loadCnt: 100,
              dist: 'CENTER',
            });
          } else {
            response = await getMessage(roomID, searchResult[index], 'CENTER');
          }
          if (response.data.status == 'SUCCESS') {
            const data = response.data.result;

            setMoveData({
              firstPage: data,
              moveId: searchResult[index],
            });
          } else {
            setSearchText('');
          }

          setLoading(false);
        } catch (e) {
          // 초기화
          setSearchText('');
          setLoading(false);
        }
      };
      getCenterMessage();
    },
    [roomID, searchText, dispatch, isChannel, currentLastMessage, searchResult],
  );

  const handleSearchText = text => {
    setSearchText(text);
  };

  const handleRequestNext = useCallback(async () => {
    const lastSearchMessageId = searchResult?.at(-1);
    console.log('Handle Next', lastSearchMessageId);
    if (!Number(lastSearchMessageId)) {
      return;
    }
    const param = {
      roomID: searchOptionState?.roomId,
      roomId: searchOptionState?.roomId,
      search: searchOptionState?.value,
      searchOption: searchOptionState?.type,
      loadCnt: 50,
      messageId: Math.max(0, lastSearchMessageId - 1), // for sender search
    };
    try {
      const response = await requestSearchMessage(param, isChannel);
      if (
        response?.data?.status === 'SUCCESS' ||
        response?.data?.search?.length
      ) {
        setSearchResult(state => state.concat(response.data.search));
      } else {
        throw new Error('Searh result is empty');
      }
    } catch (err) {
      // handle error
      common.openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_noSearchResult', '검색결과가 없습니다.'),
        },
        dispatch,
      );
    }
  }, [dispatch, searchResult, searchOptionState, isChannel]);

  const handleEmptyTarget = useCallback(() => {
    common.openPopup(
      {
        type: 'Alert',
        message: covi.getDic(
          'Msg_SelectSearchTarget',
          '검색할 대상을 클릭해주세요.',
        ),
      },
      dispatch,
    );
  }, [dispatch]);

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
        onEmptyTarget={handleEmptyTarget}
        disabled={loading}
        roomId={roomID}
        currMember={currMember}
      ></SearchHeader>
      <SearchList
        moveData={moveData}
        markingText={searchText}
        roomID={roomID}
      ></SearchList>
      <SearchIndexBox
        length={searchResult.length}
        onChange={handleIndex}
        handleNext={handleRequestNext}
      ></SearchIndexBox>
    </div>
  );
};

export default React.memo(SearchView);
