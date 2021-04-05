import React, { useRef, useEffect } from 'react';

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
          placeholder={covi.getDic('Msg_searchBox')}
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
        <button
          className="searchico"
          onClick={handleSearch}
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <path
              d="M11.345,10.059h-.678l-.24-.232a5.583,5.583,0,1,0-.6.6l.232.24v.678l4.288,4.28,1.278-1.278Zm-5.146,0A3.859,3.859,0,1,1,10.059,6.2,3.854,3.854,0,0,1,6.2,10.059Z"
              transform="translate(-0.625 -0.625)"
              fill="#b1b0af"
            ></path>
          </svg>
        </button>

        <button
          className="searchdeleteico"
          onClick={e => {
            onChange('');
          }}
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
          >
            <g transform="translate(0.488)">
              <path
                d="M8,0A8,8,0,1,1,0,8,8,8,0,0,1,8,0Z"
                transform="translate(-0.488)"
                fill="#999"
              ></path>
              <g transform="translate(4.513 5.224)">
                <path
                  d="M128.407,133.742a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12l2.284-2.165,2.284,2.165a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12.39.39,0,0,0,0-.565l-2.277-2.158,2.277-2.165a.39.39,0,0,0,0-.564.437.437,0,0,0-.6,0l-2.277,2.165L129,128.3a.444.444,0,0,0-.6,0,.39.39,0,0,0,0,.564l2.284,2.158-2.277,2.165A.371.371,0,0,0,128.407,133.742Z"
                  transform="translate(-128.279 -128.173)"
                  fill="#fff"
                ></path>
              </g>
            </g>
          </svg>
        </button>
      </div>

      <span className="searchcancel" onClick={hideSearchBox}>
        {covi.getDic('Cancel')}
      </span>
    </div>
  );
};

export default SearchHeader;
