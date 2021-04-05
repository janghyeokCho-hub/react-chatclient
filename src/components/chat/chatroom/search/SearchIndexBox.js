import React, { useState, useEffect } from 'react';

const SearchIndexBox = ({ length, onChange }) => {
  const [index, setIndex] = useState(0);

  const handleSearchIndex = index => {
    onChange(index);
    setIndex(index);
  };

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
    </div>
  );
};

export default SearchIndexBox;
