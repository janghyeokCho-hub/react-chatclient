import React, { useRef } from 'react';
import SearchIcon from '@/icons/svg/Search';
import SearchDeleteIcon from '@/icons/svg/SearchDelete';

const SearchBar = ({ placeholder, input, onChange, disabled }) => {
  const ref = useRef(null);

  return (
    <div className="SearchbarWrap">
      <div className="Searchbar" disabled={disabled}>
        <input
          ref={ref}
          value={input}
          placeholder={placeholder}
          onChange={e => {
            onChange(e);
          }}
          disabled={disabled}
        />
        {(input && input.length > 0 && (
          <SearchDeleteIcon
            type="button"
            onClick={() => {
              // trigger evt 방법 확인 필요
              onChange({ target: { value: '' } });
              ref.current.focus();
            }}
          />
        )) || (
          <SearchIcon disabled={true} />
        )}
      </div>
    </div>
  );
};

export default React.memo(SearchBar);
