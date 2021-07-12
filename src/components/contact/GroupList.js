import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDictionary } from '@/lib/common';
import SearchBar from '@COMMON/SearchBar';
import { Scrollbars } from 'react-custom-scrollbars';
import SearchOrgChart from '@C/orgchart/SearchOrgChart';
import useOffset from '@/hooks/useOffset';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';
import UserInfoBox from '@COMMON/UserInfoBox';

const GroupList = ({checkObj, group }) => {
  const groupUsers = group.sub;
  const RENDER_UNIT = 10;
  const userID = useSelector(({ login }) => login.id);
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const { renderOffset, handleScrollUpdate } = useOffset(searchResult, { renderPerBatch: RENDER_UNIT });
  const searchListEl = useRef(null);
  const contactListEl = useRef(null);
  const dispatch = useDispatch();

  const debounceTimer = createTakeLatestTimer(200);

  const handleChange = useCallback(
    e => {
      const text = e.target.value;
      setSearchText(text);

      if (text !== '') {
        debounceTimer.takeLatest(() => {
          /* 
            그룹멤버 검색으로 변경 or JS 에서 라이크검색로직 -> 추후서버로직으로변경
            검색 text가 user명에 속해잇으면 보이도록
          */
          setSearchResult(group.sub.filter((user)=> (user.name.split(";")[0]).includes(text) ));

        }, 200);

        searchListEl.current.container.style.display = '';
        contactListEl.current.container.style.display = 'none';
      } else {
        searchListEl.current.container.style.display = 'none';
        contactListEl.current.container.style.display = '';

        debounceTimer.cancel();
        setSearchResult([]);
      }
    },
    [userID, group],
  );

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85
  });

  return (
    <>
        <SearchBar
            placeholder={getDictionary(group.folderName)+" "+covi.getDic('Search_Member', '멤버 검색')}
            input={searchText}
            onChange={handleChange}
        />
        <Scrollbars
            ref={searchListEl}
            autoHide={true}
            className="PeopleList"
            onUpdate={handleUpdate}
            style={{  height: 'calc(100% - '+ (checkObj?.checkedList?.length > 0 ? '220px': '124px' )+')', display: 'none' }}
        >
        <SearchOrgChart
            viewType="checklist"
            checkObj={checkObj}
            searchData={searchResult}
            offset = {{
            renderOffset
            }}
        />
        </Scrollbars>
        <Scrollbars
            ref={contactListEl}
            autoHide={true}
            className="PeopleList"
            onUpdate={handleUpdate}
            style={{ height: 'calc(100% - '+ (checkObj?.checkedList?.length > 0 ? '220px': '124px' )+')'}}
        >
        <ul className="people">
            {groupUsers && groupUsers.map((user)=>{
                return (
                    <UserInfoBox
                        key={user.id}
                        userInfo={user}
                        isInherit={false}
                        isClick={false}
                        checkObj={checkObj}
                    />
                );
            })}
        </ul>
        </Scrollbars>
    </>
  );
};

export default React.memo(GroupList);
