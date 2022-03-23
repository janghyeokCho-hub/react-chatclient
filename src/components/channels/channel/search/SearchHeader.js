import React, { useRef, useEffect } from 'react';
import SearchIcon from '@/icons/svg/Search';
import SearchDeleteIcon from '@/icons/svg/SearchDelete';

const SearchHeader = ({
  searchText,
  onChange,
  onSearchBox,
  onSearch,
  disabled,
}) => {
  const searchInput = useRef(null);

  const hideSearchBox = () => {
    onSearchBox();
  };

  const handleSearch = () => {
    if (searchText != '') {
      onSearch(searchText);
    }
  };

  useEffect(() => {
    searchInput.current.focus();
  }, []);

  return (
    <div
      className="SearchLayer"
      style={{ position: 'relative', top: '0px', background: '#F6F6F6' }}
    >
      <div className="Searchbar">
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
          }}
          onKeyDown={e => {
            if (e.keyCode == 13) {
              handleSearch();
            }
          }}
        />
        <SearchIcon onClick={handleSearch} disabled={disabled} />
        <SearchDeleteIcon onClick={() => onChange('')} disabled={disabled} />
      </div>

      <span className="searchcancel" onClick={hideSearchBox}>
        {covi.getDic('Cancel', '취소')}
      </span>
    </div>
  );
};

export default SearchHeader;
