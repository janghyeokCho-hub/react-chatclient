import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import SearchBar from '@COMMON/SearchBar';
import ContactContainer from '@/containers/contact/ContactContainer';
import { searchOrgChart } from '@/lib/orgchart';
import SearchOrgChart from '@C/orgchart/SearchOrgChart';
import { Scrollbars } from 'react-custom-scrollbars';
import { openLayer } from '@/lib/common';
import AddContact from './AddContact';
import InviteMember from '../chat/chatroom/layer/InviteMember';
import useOffset from '@/hooks/useOffset';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';

import AddUserIcon from '@/icons/svg/AddUser';
import AddChatIcon from '@/icons/svg/AddChat';

const ContactList = ({ viewType, checkObj }) => {
  const userID = useSelector(({ login }) => login.id);

  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [type, setType] = useState(viewType);

  const searchListEl = useRef(null);
  const contactListEl = useRef(null);

  const RENDER_INIT = Math.ceil(window.innerHeight / 60);
  const RENDER_UNIT = 10;
  const { items, handleScrollUpdate } = useOffset(searchResult, {
    renderPerBatch: RENDER_UNIT,
  });
  const dispatch = useDispatch();

  useEffect(() => {
    if (!type) {
      setType('list');
    }
  }, []);

  useEffect(() => {
    if (type === 'list') {
      dispatch(
        bound({
          name: covi.getDic('Contact', '내 대화상대'),
          type: 'contactlist',
        }),
      );
      dispatch(
        setTopButton([
          {
            code: 'addContactItem',
            alt: covi.getDic('AddContact', '내 대화상대 추가'),
            onClick: () => {
              openLayer(
                {
                  component: <AddContact />,
                },
                dispatch,
              );
            },
            svg: <AddUserIcon />,
          },
          {
            code: 'startChat',
            alt: covi.getDic('StartChat', '대화시작'),
            onClick: () => {
              openLayer(
                {
                  component: (
                    <InviteMember
                      headerName={covi.getDic('NewChatRoom', '새로운 채팅방')}
                      isNewRoom={true}
                    />
                  ),
                },
                dispatch,
              );
            },
            svg: <AddChatIcon />,
          },
        ]),
      );
    }
  }, [type]);

  const debounceTimer = createTakeLatestTimer(200);

  const handleChange = useCallback(
    e => {
      const text = e.target.value;
      setSearchText(text);

      if (text !== '') {
        debounceTimer.takeLatest(() => {
          searchOrgChart({
            userID: userID,
            value: text,
            type: 'C',
          }).then(({ data }) => {
            if (data.status == 'SUCCESS') setSearchResult(data.result);
            else setSearchResult([]);
          });
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
    [userID],
  );

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85,
  });

  /*
<div ref={contactListEl} className="PeopleList">
        <ContactContainer viewType="list" />
      </div>
*/

  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_contactSearch', '부서, 임직원 검색')}
        input={searchText}
        onChange={handleChange}
      />
      <Scrollbars
        ref={searchListEl}
        autoHide={true}
        className="PeopleList"
        onUpdate={handleUpdate}
        style={{ height: 'calc(100% - 124px)', display: 'none' }}
      >
        <SearchOrgChart
          viewType={type}
          checkObj={checkObj}
          searchData={items}
        />
      </Scrollbars>
      <Scrollbars
        ref={contactListEl}
        autoHide={true}
        className="PeopleList"
        style={{ height: 'calc(100% - 124px)' }}
      >
        <ContactContainer viewType={type} checkObj={checkObj} />
      </Scrollbars>
    </>
  );
};

export default React.memo(ContactList);
