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

import AddChatIcon from '@/icons/svg/AddChat';

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
            svg: <AddChatIcon />
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
