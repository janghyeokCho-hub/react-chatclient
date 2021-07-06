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
import { specialCharFilter } from '@/modules/util';

const ContactList = ({ viewType, checkObj }) => {
  const userID = useSelector(({ login }) => login.id);

  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [type, setType] = useState(viewType);

  const searchListEl = useRef(null);
  const contactListEl = useRef(null);

  const RENDER_INIT = Math.ceil(window.innerHeight / 60);
  const RENDER_UNIT = 10;
  const { renderOffset, isDone, nextStep, handleScrollUpdate } = useOffset(searchResult, { renderPerBatch : RENDER_UNIT });
  const dispatch = useDispatch();

  useEffect(() => {
    if (!type) {
      setType('list');
    }
  }, []);

  useEffect(() => {
    if (type === 'list') {
      dispatch(bound({ name: covi.getDic('Contact'), type: 'contactlist' }));
      dispatch(
        setTopButton([
          {
            code: 'addContactItem',
            alt: covi.getDic('AddContact'),
            onClick: () => {
              openLayer(
                {
                  component: <AddContact />,
                },
                dispatch,
              );
            },
            svg: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20.418"
                height="15.214"
                viewBox="0 0 20.418 15.214"
              >
                <g transform="translate(-250.024 -412.982)">
                  <path
                    d="M258.869,420.074a3.868,3.868,0,1,0-4.262,0,9.059,9.059,0,0,0-4.583,7.506.618.618,0,0,0,.616.616h12.186a.618.618,0,0,0,.616-.616A9.076,9.076,0,0,0,258.869,420.074Zm-4.766-3.225a2.629,2.629,0,1,1,2.629,2.629A2.634,2.634,0,0,1,254.1,416.849Zm-2.826,10.115c.215-3.481,3.055-6.223,5.455-6.223s5.241,2.742,5.456,6.223Z"
                    fill="#262727"
                  ></path>
                  <path
                    d="M270.443,418.022h-3.315v-3.316H265.77v3.316h-3.409v1.358h3.409V422.7h1.358V419.38h3.315Z"
                    fill="#262727"
                  ></path>
                </g>
              </svg>
            ),
          },
          {
            code: 'startChat',
            alt: covi.getDic('StartChat'),
            onClick: () => {
              openLayer(
                {
                  component: (
                    <InviteMember
                      headerName={covi.getDic('NewChatRoom')}
                      isNewRoom={true}
                    />
                  ),
                },
                dispatch,
              );
            },
            svg: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19.623"
                height="17.075"
                viewBox="0 0 19.623 17.075"
              >
                <g transform="translate(-284.097 -412.278)">
                  <path
                    d="M303.719,419.7H300.4v-3.316h-1.358V419.7h-3.409v1.358h3.409v3.318H300.4V421.06h3.315Z"
                    fill="#262727"
                  ></path>
                  <path
                    d="M296.19,425.547a7.665,7.665,0,0,1-3.631.864,9.729,9.729,0,0,1-1.009-.06h-.059a.541.541,0,0,0-.294.087l-2.973.875-.1-1.692a.758.758,0,0,0-.273-.724,6.073,6.073,0,0,1-2.551-4.834c0-3.509,3.253-6.364,7.253-6.364a7.653,7.653,0,0,1,3.909,1.021,5.937,5.937,0,0,1,1.709-.458,8.727,8.727,0,0,0-5.608-1.984c-4.666,0-8.466,3.493-8.466,7.786a7.569,7.569,0,0,0,2.774,5.768l-.048,2.689a.76.76,0,0,0,.244.7.5.5,0,0,0,.353.131.482.482,0,0,0,.283-.084l3.908-1.469a8.609,8.609,0,0,0,.949.046,8.753,8.753,0,0,0,5.316-1.754A5.915,5.915,0,0,1,296.19,425.547Z"
                    fill="#262727"
                  ></path>
                </g>
              </svg>
            ),
          },
        ]),
      );
    }
  }, [type]);

  const debounceTimer = createTakeLatestTimer(200);

  const handleChange = useCallback(
    e => {
      const text = specialCharFilter(e.target.value);
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
    threshold: 0.85
  });

  /*
<div ref={contactListEl} className="PeopleList">
        <ContactContainer viewType="list" />
      </div>
*/

  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_contactSearch')}
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
        style={{ height: 'calc(100% - 124px)' }}
      >
        <ContactContainer viewType={type} checkObj={checkObj} />
      </Scrollbars>
    </>
  );
};

export default React.memo(ContactList);
