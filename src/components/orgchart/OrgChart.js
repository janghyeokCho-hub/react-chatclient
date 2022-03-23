import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
import { filterSearchGroupMember } from '@/lib/contactUtil';
import { getRoomList } from '@/lib/room';

import AddChatIcon from '@/icons/svg/AddChat';
/* 
  group: 임의그룹 변경화면 그룹멤버추가 화면에서 그룹멤버는 목록에 나오지않도록 
*/

const OrgChart = ({ viewType, checkObj, group }) => {
  let searchTimer = null;
  const RENDER_UNIT = 10;
  const userID = useSelector(({ login }) => login.id);
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [searchGroup, setSearchGroup] = useState('');
  const [searchCompanyCode, setCompanyCode] = useState('');
  const { items, handleScrollUpdate } = useOffset(searchResult, {
    renderPerBatch: RENDER_UNIT,
  });
  const [type, setType] = useState(viewType);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!type) {
      setType('list');
    }
  }, []);

  useEffect(() => {
    if (type === 'list') {
      dispatch(
        bound({ name: covi.getDic('OrgChart', '조직도'), type: 'orgchart' }),
      );
      dispatch(
        setTopButton([
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

  const handleChange = useCallback(
    e => {
      const text = e.target.value;
      setSearchText(text);

      if (text != '') {
        if (searchTimer != null) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchOrgChart({
            userID: userID,
            value: text,
            type: 'O',
          }).then(({ data }) => {
            if (data.status == 'SUCCESS') {
              //그룹 존재시 그룹멤버 제외하고 목록나오도록
              if (group)
                data.result = filterSearchGroupMember(
                  data.result,
                  group,
                  userID,
                );

              setSearchResult(data.result);
            } else {
              setSearchResult([]);
            }
          });
        }, 500);
      } else {
        if (searchTimer != null) clearTimeout(searchTimer);
        setSearchResult([]);
      }
    },
    [userID, group],
  );

  const handleSearchGroup = (groupCode, companyCode) => {
    setSearchGroup(groupCode);
    setCompanyCode(companyCode);
    setSearchText('');
  };

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85,
  });

  const scrollHeight = useMemo(() => {
    return (
      'calc(100% - ' +
      (group && checkObj?.checkedList?.length > 0 ? '220px' : '124px') +
      ')'
    );
  }, [checkObj]);

  return (
    <>
      <SearchBar
        placeholder={covi.getDic('Msg_contactSearch', '부서, 임직원 검색')}
        input={searchText}
        onChange={handleChange}
      />
      {searchText && searchText != '' && (
        <Scrollbars
          autoHide={true}
          className="PeopleList"
          onUpdate={handleUpdate}
          style={{ height: scrollHeight }}
        >
          <SearchOrgChart
            viewType={type}
            checkObj={checkObj}
            searchData={items}
            handleGroup={handleSearchGroup}
          />
        </Scrollbars>
      )}
      {!searchText && searchText == '' && (
        <Scrollbars
          autoHide={true}
          className="PeopleList"
          style={{ height: scrollHeight }}
        >
          <OrgchartContainer
            viewType={type}
            checkObj={checkObj}
            searchGroup={searchGroup}
            handleGroup={handleSearchGroup}
            searchResult={searchResult}
            searchCompanyCode={searchCompanyCode}
            group={group}
          />
        </Scrollbars>
      )}
    </>
  );
};

export default React.memo(OrgChart);
