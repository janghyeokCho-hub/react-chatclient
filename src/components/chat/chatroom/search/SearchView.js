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
import { setChineseWall } from '@/modules/login';
import { getChineseWall, isBlockCheck } from '@/lib/orgchart';

const SearchView = ({ onSearchBox }) => {
  // match 가 null이 아닌경우, match가 null인 경우
  const roomID = useSelector(({ room }) => room.currentRoom.roomID);
  const userInfo = useSelector(({ login }) => login.userInfo);
  const userChineseWall = useSelector(({ login }) => login.chineseWall);
  const [chineseWallState, setChineseWallState] = useState([]);

  const dispatch = useDispatch();

  const [searchText, setSearchText] = useState('');
  const [moveData, setMoveData] = useState(null);
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getChineseWallList = async () => {
      const { result, status } = await getChineseWall({
        userId: userInfo?.id,
        myInfo: userInfo,
      });
      if (status === 'SUCCESS') {
        setChineseWallState(result);
        if (DEVICE_TYPE === 'd' && !isMainWindow()) {
          dispatch(setChineseWall(result));
        }
      } else {
        setChineseWallState([]);
      }
    };

    if (userChineseWall?.length) {
      setChineseWallState(userChineseWall);
    } else {
      getChineseWallList();
    }

    return () => {
      setChineseWallState([]);
    };
  }, []);

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

  const setMoveMessagesData = useCallback(
    data => {
      if (data.status == 'SUCCESS') {
        // 차이니즈월 적용
        let { firstPage, search } = data;
        const blockList = firstPage?.map(item => {
          const senderInfo = common.isJSONStr(item.senderInfo)
            ? JSON.parse(item.senderInfo)
            : item.senderInfo;
          const targetInfo = {
            ...senderInfo,
            id: item.sender,
          };
          console.log('targetInfo : ', targetInfo);
          console.log('chineseWallState : ', chineseWallState);
          const { blockChat } = isBlockCheck({
            targetInfo,
            chineseWall: chineseWallState,
          });
          return blockChat && item.messageID;
        });

        search = search.filter(item => !blockList.includes(item));

        if (search?.length && firstPage?.length) {
          setMoveData({
            firstPage: firstPage,
            moveId: search[0],
          });
          setSearchResult(search);
        }
      } else {
        setSearchText('');
      }

      setLoading(false);
    },
    [chineseWallState],
  );

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
                  message: covi.getDic(
                    'Msg_noSearchResult',
                    '검색결과가 없습니다.',
                  ),
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
