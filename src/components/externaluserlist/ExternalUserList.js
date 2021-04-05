import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import SearchBar from '@COMMON/SearchBar';
import Scrollbars from 'react-custom-scrollbars';
import SearchOrgChart from '../orgchart/SearchOrgChart';

/**
 * 2020.12.24
 * *주의*
 * SearchOrgChart에 renderOffset injection 구조가 추가되어서 해당 컴포넌트를 이용한 구현시 컴포넌트 사용법 변경을 요함
 */

const ExternalUserList = () => {
  const dispatch = useDispatch();

  const [searchText, setSearchText] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

  useEffect(() => {
    //dispatch(bound({ name: '외부사용자', type: 'externaluserlist' }));
    //dispatch(setTopButton([])); // TODO
  }, []);

  const handleChange = useCallback(e => {
    const text = e.target.value;
    setSearchText(text);

    if (text != '') {
    } else {
    }
  }, []);

  const addExtUser = () => {};

  return (
    <div>
      <SearchBar
        placeholder="외부사용자 검색"
        input={searchText}
        onChange={handleChange}
      />
      <Scrollbars
        autoHide={true}
        className="PeopleList"
        style={{ height: 'calc(100% - 124px)' }}
      >
        <SearchOrgChart />
      </Scrollbars>
      <Scrollbars
        autoHide={true}
        className="PeopleList"
        style={{ height: 'calc(100% - 124px)' }}
      ></Scrollbars>
    </div>
  );
};

export default ExternalUserList;
