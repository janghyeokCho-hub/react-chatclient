import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SearchIndexBox from '@C/chat/chatroom/search/SearchIndexBox';
import SearchList from '@C/chat/chatroom/search/SearchList';
import SearchHeader from '@C/chat/chatroom/search/SearchHeader';
import LoadingWrap from '@/components/common/LoadingWrap';
import * as messageApi from '@/lib/message';
import { evalConnector } from '@/lib/deviceConnector';
import * as common from '@/lib/common';
import { getMessage } from '@/lib/messageUtil';

const SearchView = ({ onSearchBox }) => {
  // match 가 null이 아닌경우, match가 null인 경우
  const roomID = useSelector(({ room }) => room.currentRoom.roomID);

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
      setSearchText(searchText);
      setSearchResult([]);
      setMoveData(null);

      // 검색된 messageId 및 첫 페이지 데이터
      const param = {
        roomID,
        search: searchText,
        loadCnt: 100,
      };

      // TODO: AppData 저장 여부값 조건 추가 필요
      if (DEVICE_TYPE == 'd') {
        Promise.resolve().then(() => {
          const response = evalConnector({
            method: 'sendSync',
            channel: 'req-get-search-messages',
            message: param,
          });

          if (
            response.data.search == null ||
            response.data.search.length == 0
          ) {
            setMoveMessagesData(response.data);
            setSearchText('');
            common.openPopup(
              {
                type: 'Alert',
                message: covi.getDic('Msg_noSearchResult'),
              },
              dispatch,
            );
          } else {
            setMoveMessagesData(response.data);
          }
        });
      } else {
        messageApi
          .searchMessage(param)
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
      }
    },
    [roomID, searchText, dispatch],
  );

  const handleIndex = useCallback(
    index => {
      setLoading(true);
      setMoveData(null);
      const getCenterMessage = async () => {
        try {
          const response = await getMessage(
            roomID,
            searchResult[index],
            'CENTER',
          );
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
