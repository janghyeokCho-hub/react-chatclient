import React, { useState, useEffect } from 'react';
import usePrevious from '@/lib/usePrevious';

const SelectBox = ({ onChange, items, defaultValue, order, style, fontMode }) => {
  const [viewList, setViewList] = useState(false);
  const [selectIdx, setSelectIdx] = useState(-1);

  const prevSelect = usePrevious(selectIdx);

  const onSelect = idx => {
    setViewList(false);
    setSelectIdx(idx);
    onChange(items[idx], selectCanceled);
  };

  const selectCanceled = () => {
    setSelectIdx(prevSelect);
  };

  useEffect(() => {
    if (items) {
      const findIdx = items.findIndex(item => item.value == defaultValue);
      setSelectIdx(findIdx);
    }
  }, [defaultValue]);

  return (
    <div
      className="link_select_box type1"
      style={{ zIndex: `${typeof order == 'number' ? order : 1}` }}
    >
      <a
        style={{...style, ...(selectIdx > -1 && items?.[selectIdx]?.style) }}
        onClick={e => {
          setViewList(!viewList);
        }}
      >
        {(selectIdx > -1 && items[selectIdx].name) || covi.getDic('Select')}
      </a>
      <ul
        className="select_list"
        style={{ display: viewList ? 'block' : 'none', ...style }}
      >
        {items &&
          items.map((item, idx) => {
            return (
              <li
                key={idx}
                onClick={e => {
                  onSelect(idx);
                }}
                style={{...(fontMode && { fontFamily: item.value }), ...item.style}}
              >
                {item.name}
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default SelectBox;
