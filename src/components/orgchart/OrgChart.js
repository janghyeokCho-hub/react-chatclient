import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import SearchBar from '@COMMON/SearchBar';
import OrgchartContainer from '@/containers/orgchart/OrgchartContainer';
import { Scrollbars } from 'react-custom-scrollbars';
import SearchOrgChart from '@C/orgchart/SearchOrgChart';
import { searchOrgChart } from '@/lib/orgchart';
import { openLayer } from '@/lib/common';
import InviteMember from '../chat/chatroom/layer/InviteMember';
import useOffset from '@/hooks/useOffset';
import { getRoomList } from '@/lib/room';

const OrgChart = ({ viewType, checkObj }) => {
  let searchTimer = null;
  const RENDER_UNIT = 10;
  const userID = useSelector(({ login }) => login.id);
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [searchGroup, setSearchGroup] = useState('');
  const [searchCompanyCode, setCompanyCode] = useState('');
  const { renderOffset, handleScrollUpdate } = useOffset(searchResult, { renderPerBatch: RENDER_UNIT });
  const [type, setType] = useState(viewType);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!type) {
      setType('list');
    }
  }, []);

  useEffect(() => {
    if (type === 'list') {
      dispatch(bound({ name: covi.getDic('OrgChart'), type: 'orgchart' }));
      dispatch(
        setTopButton([
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

  const handleChange = useCallback(
    e => {
      const text = e.target.value;
      setSearchText(text);

      if (text != '') {
        if (searchTimer != null) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchOrgChart({
            userID: userID,
            value: encodeURIComponent(text),
            type: 'O',
          }).then(({ data }) => {
            if (data.status == 'SUCCESS') setSearchResult(data.result);
            else setSearchResult([]);
          });
        }, 500);
      } else {
        if (searchTimer != null) clearTimeout(searchTimer);
        setSearchResult([]);
      }
    },
    [userID],
  );

  const handleSearchGroup = (groupCode, companyCode) => {
    setSearchGroup(groupCode);
    setCompanyCode(companyCode);
    setSearchText('');
  };

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85
  });

  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_contactSearch')}
        input={searchText}
        onChange={handleChange}
      />
      {searchText && searchText != '' && (
        <Scrollbars
          autoHide={true}
          className="PeopleList"
          onUpdate={handleUpdate}
          style={{ height: 'calc(100% - 124px)' }}
        >
          <SearchOrgChart
            viewType={type}
            checkObj={checkObj}
            searchData={searchResult}
            handleGroup={handleSearchGroup}
            offset= {{
              renderOffset,
            }}
          />
        </Scrollbars>
      )}
      {!searchText && searchText == '' && (
        <Scrollbars
          autoHide={true}
          className="PeopleList"
          style={{ height: 'calc(100% - 124px)' }}
        >
          <OrgchartContainer
            viewType={type}
            checkObj={checkObj}
            searchGroup={searchGroup}
            handleGroup={handleSearchGroup}
            searchResult={searchResult}
            searchCompanyCode={searchCompanyCode}
          />
        </Scrollbars>
      )}
    </>
  );
};

export default React.memo(OrgChart);
