import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getDic } from '@/lib/util/configUtil';
import { SEARCHVIEW_OPTIONS } from '@/lib/constants/searchView.constant';

const SearchIndexBox = ({ length, onChange, handleNext }) => {
  const [index, setIndex] = useState(0);
  const handleSearchIndex = index => {
    onChange(index);
    setIndex(index);
  };
  const { data: searchOptionState } = useSWR('message/search', null);
  useEffect(() => {
    setIndex(0);
  }, [length]);

  return (
    <div className="SearchLayer-control">
      {(length > 0 && (
        <>
          <span className="numbertxt">
            {index + 1} / {length}
          </span>
          <div className="arrowbox">
            <button
              className="up-arrow"
              type="button"
              onClick={() => {
                handleSearchIndex(index + 1);
              }}
              disabled={index == length - 1}
            ></button>
            <button
              className="down-arrow"
              type="button"
              onClick={() => {
                handleSearchIndex(index - 1);
              }}
              disabled={index == 0}
            ></button>
          </div>
        </>
      )) || <span className="numbertxt">0 / 0</span>}
      {/* API에서 데이터 분할로딩이 지원되지 않는 context 검색시에만 더보기 버튼 숨김  */}
      {searchOptionState?.type &&
        searchOptionState.type !== SEARCHVIEW_OPTIONS.CONTEXT &&
        typeof handleNext === 'function' &&
        length > 0 && (
          <span
            style={{ marginLeft: 8, padding: 4 }}
            onClick={() => handleNext(length)}
          >
            {getDic('LoadMore')}
          </span>
        )}
    </div>
  );
};

export default SearchIndexBox;
