import React, { useRef, useEffect, useState } from 'react';
import SearchIcon from '@/icons/svg/Search';
import SearchDeleteIcon from '@/icons/svg/SearchDelete';
import { getConfig } from '@/lib/util/configUtil';
import SuggestionLayer from '@C/channels/channel/layer/SuggestionLayer';
import { getDictionary, openPopup } from '@/lib/common';

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
  const [searchOption, setSearchOption] = useState('Context');
  const [openSelectBox, setOpenSelectBox] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [targetId, setTargetId] = useState('');
  const hideSearchBox = () => {
    onSearchBox();
  };
  const handleSearch = (option = searchOption, text = null) => {
    if (!text) {
      if (option === 'Context') {
        text = searchText;
      } else if (option === 'Note_Sender') {
        text = targetId;
      }
    }
    if (option === 'Context' && text) {
      onSearch(option, text);
    } else if (option === 'Note_Sender' && text) {
      onSearch(option, text);
    }
  };
  const useSearchMessageByName = getConfig('UseSearchMessageByName') || {
    use: false,
  };
  const clearSearch = () => {
    onChange('');
    setTargetId('');
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
                setSearchOption('Context');
                onChange('');
                setOpenSelectBox(false);
              }}
            >
              {covi.getDic('Context', '내용')}
            </li>
            {useSearchMessageByName?.use && (
              <li
                onClick={() => {
                  setSearchOption('Note_Sender');
                  onChange('');
                  setOpenSelectBox(false);
                }}
              >
                {covi.getDic('Note_Sender', '보낸사람')}
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
              setTargetId('');
            }}
            onKeyDown={e => {
              if (e.keyCode == 13) {
                if (searchOption === 'Note_Sender' && !targetId) {
                  onEmptyTarget?.();
                  return;
                }
                handleSearch();
              }
            }}
            onFocus={() => {
              // 이름검색 모드 && input focus시에 SuggestionLayer 렌더링
              if (searchOption === 'Note_Sender') {
                setInputFocused(true);
              } else {
                setInputFocused(false);
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
      {inputFocused && (
        <SuggestionLayer
          roomId={roomId}
          currMember={currMember}
          onMentionMouseDown={member => {
            /** 2022.05.13
             * onMentionClick을 사용할 경우 UserInfoBox의 onClick보다 text input의 onBlur가 먼저 트리거 됨 (즉 클릭 처리가 동작하지 않음)
             * => onBlur보다 먼저 클릭처리를 하기 위해 MouseDown을 사용하였음
             */
            console.log('onMentionMouseDown >> ', member);
            if (member) {
              onChange(getDictionary(member.name));
              setTargetId(member.id);
              handleSearch(searchOption, member.id);
            }
            setInputFocused(false);
          }}
          onSuggestionMembers={() => {}}
          messageContext={searchText}
          skipKeyword
          sticky="top"
        ></SuggestionLayer>
      )}
    </>
  );
};

export default SearchHeader;
