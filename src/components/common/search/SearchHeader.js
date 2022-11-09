import React, { useRef, useEffect, useState } from 'react';
import Calendar from 'react-calendar';

/**
 * react-calendar 사용 범위 확대시 상위 콘텍스트로 import statement 이동해야함
 */
import 'react-calendar/dist/Calendar.css';

import SearchIcon from '@/icons/svg/Search';
import SearchDeleteIcon from '@/icons/svg/SearchDelete';
import { getUseFlag } from '@/lib/util/configUtil';
import SuggestionLayer from '@C/channels/channel/layer/SuggestionLayer';
import { getDictionary, openPopup } from '@/lib/common';
import {
  convertDate,
  getCurrentDate,
  isValidDate,
  parseDate,
  SEARCHVIEW_OPTIONS,
} from '@/lib/constants/searchView.constant';

/**
 * 2022.10.17 변수 구분
 *
 * searchText: input 검색값 state
 * searchTarget: input 외부의 View 에서 마지막으로 선택했던 대상 (검색성공 이후 input onChange가 발생하면 다시 초기화됨)
 * inputFocused: input 외부의 View 표시여부
 */

const SearchHeader = ({
  searchText,
  onChange,
  onSearchBox,
  onSearch,
  onEmptyTarget,
  disabled,
  roomId,
  currMember,
}) => {
  const searchInput = useRef(null);
  const [searchOption, setSearchOption] = useState(SEARCHVIEW_OPTIONS.CONTEXT);
  // 옵션 선택뷰 flag
  const [openSelectBox, setOpenSelectBox] = useState(false);
  // 각 옵션별 input 선택영역 표기 flag
  const [inputFocused, setInputFocused] = useState(false);
  const [searchTarget, setSearchTarget] = useState('');
  const hideSearchBox = () => {
    onSearchBox();
  };
  const handleSearch = (option = searchOption, text = null) => {
    if (!text) {
      if (option === SEARCHVIEW_OPTIONS.CONTEXT) {
        text = searchText;
      } else {
        text = searchTarget;
      }
    }
    if (text) {
      onSearch(option, text);
    }
  };
  const useSearchMessageByName = getUseFlag('UseSearchMessageByName') || false;
  const useSearchMessageByDate = getUseFlag('UseSearchMessageByDate') || false;

  const clearSearch = () => {
    onChange('');
    setSearchTarget('');
  };

  useEffect(() => {
    searchInput.current.focus();
  }, [searchOption]);

  return (
    <>
      <div
        className="SearchLayer"
        style={{
          position: 'relative',
          top: '0px',
          padding: '0',
          background: '#F6F6F6',
          display: 'flex',
          alignItems: 'center',
          zIndex: 150,
        }}
      >
        <div
          className="link_select_box"
          style={{ width: '100px', textAlign: 'center', marginLeft: '10px' }}
        >
          <a
            onClick={() => setOpenSelectBox(state => !state)}
            style={{
              border: 'unset',
              width: 'unset',
              paddingLeft: 0,
              textOverflow: 'ellipsis',
              fontWeight: 'bold',
            }}
          >
            {covi.getDic(searchOption, searchOption)}
          </a>
          <ul
            className="select_list"
            style={{ display: openSelectBox ? 'block' : 'none' }}
          >
            <li
              onClick={() => {
                setSearchOption(SEARCHVIEW_OPTIONS.CONTEXT);
                onChange('');
                setOpenSelectBox(false);
              }}
            >
              {covi.getDic(SEARCHVIEW_OPTIONS.CONTEXT, '내용')}
            </li>
            {useSearchMessageByName && (
              <li
                onClick={() => {
                  setSearchOption(SEARCHVIEW_OPTIONS.SENDER);
                  onChange('');
                  setOpenSelectBox(false);
                }}
              >
                {covi.getDic(SEARCHVIEW_OPTIONS.SENDER, '보낸사람')}
              </li>
            )}
            {useSearchMessageByDate && (
              <li
                onClick={() => {
                  const currentDate = getCurrentDate();
                  setSearchOption(SEARCHVIEW_OPTIONS.DATE);
                  onChange(currentDate);
                  setSearchTarget(currentDate);
                  setOpenSelectBox(false);
                }}
              >
                {covi.getDic(SEARCHVIEW_OPTIONS.DATE, '날짜')}
              </li>
            )}
          </ul>
        </div>
        <div
          className="Searchbar"
          style={{ display: 'flex', flex: 1, top: 'unset', transform: 'unset' }}
        >
          <SearchIcon onClick={handleSearch} disabled={disabled} />
          <input
            ref={searchInput}
            type="text"
            value={searchText}
            placeholder={covi.getDic(
              'Msg_searchBox',
              '검색할 내용을 입력해주세요',
            )}
            disabled={disabled}
            onChange={e => {
              onChange(e.target.value);
              setSearchTarget('');
            }}
            onKeyDown={e => {
              // Handle input submit
              if (e.keyCode == 13) {
                switch (searchOption) {
                  case SEARCHVIEW_OPTIONS.SENDER:
                    // searchTarget가 초기화된 상태인 경우 empty target 문구 팝업
                    if (!searchTarget) {
                      onEmptyTarget?.();
                      return;
                    }
                    break;
                  case SEARCHVIEW_OPTIONS.DATE:
                    if (isValidDate(searchText)) {
                      const trimmedDate = convertDate(searchText.trim());
                      onChange(trimmedDate);
                      setSearchTarget(trimmedDate);
                      setInputFocused(null);
                    } else {
                      // @TODO handle invalid date
                      // ...
                    }
                    break;
                  default:
                }
                // 검색 input이 빈값인 경우 empty target 문구 팝업
                if (!searchText) {
                  onEmptyTarget?.();
                  return;
                }
                handleSearch();
              }
            }}
            onFocus={() => {
              // 이름검색 모드 && input focus시에 SuggestionLayer 렌더링
              if (searchOption === SEARCHVIEW_OPTIONS.CONTEXT) {
                setInputFocused(null);
              } else {
                setInputFocused(searchOption);
              }
            }}
          />
          <SearchDeleteIcon onClick={clearSearch} disabled={disabled} />
        </div>

        <button
          style={{
            width: '40px',
            display: 'block',
            marginLeft: '8px',
            marginRight: '4px',
            padding: '4px 0',
          }}
          onClick={hideSearchBox}
        >
          {covi.getDic('Cancel', '취소')}
        </button>
      </div>
      {inputFocused === SEARCHVIEW_OPTIONS.SENDER && (
        <SuggestionLayer
          roomId={roomId}
          currMember={currMember}
          onMentionMouseDown={member => {
            /** 2022.05.13
             * onMentionClick을 사용할 경우 UserInfoBox의 onClick보다 text input의 onBlur가 먼저 트리거 됨 (즉 클릭 처리가 동작하지 않음)
             * => onBlur보다 먼저 클릭처리를 하기 위해 MouseDown을 사용하였음
             */
            if (member) {
              onChange(getDictionary(member.name));
              setSearchTarget(member.id);
              handleSearch(searchOption, member.id);
            }
            setInputFocused(null);
          }}
          onSuggestionMembers={() => {}}
          messageContext={searchText}
          skipKeyword
          sticky="top"
        ></SuggestionLayer>
      )}
      {inputFocused === SEARCHVIEW_OPTIONS.DATE && (
        <section
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            position: 'absolute',
            zIndex: 101,
          }}
        >
          <Calendar
            onClickDay={date => {
              const dateFormat = parseDate(date);
              onChange(dateFormat);
              setSearchTarget(dateFormat);
              handleSearch(searchOption, dateFormat);
              setInputFocused(null);
            }}
            value={isValidDate(searchText) && new Date(searchText)}
          />
        </section>
      )}
    </>
  );
};

export default SearchHeader;
