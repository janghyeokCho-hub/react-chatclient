import React, { useState, useEffect } from 'react';

const ColorBox = ({ onChange, items, defaultColor, empty, horizontal }) => {
  const [viewList, setViewList] = useState(false);
  const [selectIdx, setSelectIdx] = useState(-1);

  const onSelect = idx => {
    setViewList(false);
    setSelectIdx(idx);
    if (idx == -1) onChange(null);
    else onChange(items[idx]);
  };

  useEffect(() => {
    if (items) {
      const findIdx = items.findIndex(item => item.name == defaultColor);
      setSelectIdx(findIdx);
    }
  }, [defaultColor]);

  const getLeft = () => {
    let itemSize = empty ? 1 : 0;

    if (items) {
      itemSize += items.length;
    }

    return itemSize * 22 * -1;
  };

  return (
    <div className="color-box">
      <a
        className="topH_colorSbox ui-link"
        onClick={e => {
          setViewList(!viewList);
        }}
      >
        {(selectIdx > -1 && (
          <span style={{ backgroundColor: items[selectIdx].value }} />
        )) || (
          <span style={{ backgroundColor: '#bbb' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              viewBox="0 0 11 11.014"
            >
              <g transform="translate(-17.666 -17.652)">
                <g transform="translate(17.666 17.652)">
                  <path
                    d="M128.514,138.956a.762.762,0,0,0,.54.231.74.74,0,0,0,.54-.231l4.192-4.192,4.192,4.192a.762.762,0,0,0,.54.231.74.74,0,0,0,.54-.231.784.784,0,0,0,0-1.093l-4.179-4.179,4.179-4.192a.784.784,0,0,0,0-1.093.772.772,0,0,0-1.093,0l-4.179,4.192-4.192-4.179A.773.773,0,0,0,128.5,129.5l4.192,4.179-4.179,4.192A.746.746,0,0,0,128.514,138.956Z"
                    transform="translate(-128.279 -128.173)"
                    fill="#f33"
                  />
                </g>
              </g>
            </svg>
          </span>
        )}
      </a>
      {!horizontal && (
        <ul
          className="topH_colorS"
          style={{ display: viewList ? 'block' : 'none' }}
        >
          {empty && (
            <li
              key="empty"
              onClick={e => {
                onSelect(-1);
              }}
            >
              <a className="ui-link">
                <span style={{ backgroundColor: '#bbb' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    viewBox="0 0 11 11.014"
                  >
                    <g transform="translate(-17.666 -17.652)">
                      <g transform="translate(17.666 17.652)">
                        <path
                          d="M128.514,138.956a.762.762,0,0,0,.54.231.74.74,0,0,0,.54-.231l4.192-4.192,4.192,4.192a.762.762,0,0,0,.54.231.74.74,0,0,0,.54-.231.784.784,0,0,0,0-1.093l-4.179-4.179,4.179-4.192a.784.784,0,0,0,0-1.093.772.772,0,0,0-1.093,0l-4.179,4.192-4.192-4.179A.773.773,0,0,0,128.5,129.5l4.192,4.179-4.179,4.192A.746.746,0,0,0,128.514,138.956Z"
                          transform="translate(-128.279 -128.173)"
                          fill="#f33"
                        />
                      </g>
                    </g>
                  </svg>
                </span>
              </a>
            </li>
          )}
          {items &&
            items.map((item, idx) => {
              return (
                <li
                  key={idx}
                  onClick={e => {
                    onSelect(idx);
                  }}
                >
                  <a className="ui-link">
                    <span style={{ backgroundColor: item.value }}></span>
                  </a>
                </li>
              );
            })}
        </ul>
      )}
      {horizontal && (
        <ul
          className="topH_colorS"
          style={{
            display: viewList ? 'block' : 'none',
            top: '0px',
            left: `${getLeft()}px`,
          }}
        >
          {empty && (
            <li
              style={{ display: 'inline-block' }}
              key="empty"
              onClick={e => {
                onSelect(-1);
              }}
            >
              <a className="ui-link">
                <span style={{ backgroundColor: '#bbb' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    viewBox="0 0 11 11.014"
                  >
                    <g transform="translate(-17.666 -17.652)">
                      <g transform="translate(17.666 17.652)">
                        <path
                          d="M128.514,138.956a.762.762,0,0,0,.54.231.74.74,0,0,0,.54-.231l4.192-4.192,4.192,4.192a.762.762,0,0,0,.54.231.74.74,0,0,0,.54-.231.784.784,0,0,0,0-1.093l-4.179-4.179,4.179-4.192a.784.784,0,0,0,0-1.093.772.772,0,0,0-1.093,0l-4.179,4.192-4.192-4.179A.773.773,0,0,0,128.5,129.5l4.192,4.179-4.179,4.192A.746.746,0,0,0,128.514,138.956Z"
                          transform="translate(-128.279 -128.173)"
                          fill="#f33"
                        />
                      </g>
                    </g>
                  </svg>
                </span>
              </a>
            </li>
          )}
          {items &&
            items.map((item, idx) => {
              return (
                <li
                  style={{ display: 'inline-block' }}
                  key={idx}
                  onClick={e => {
                    onSelect(idx);
                  }}
                >
                  <a className="ui-link">
                    <span style={{ backgroundColor: item.value }}></span>
                  </a>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default ColorBox;
