import React from 'react';

const ExtensionIcon = ({ onClickEvent }) => {
  return (
    <button onClick={onClickEvent}>
      <svg
        height="22px"
        viewBox="0 0 23 23"
        width="20px"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          marginLeft: 4,
          marginBottom: 5,
        }}
      >
        <g
          fill="none"
          fill-rule="evenodd"
          id="Page-1"
          stroke="none"
          stroke-width="1"
        >
          <g
            fill="#fff"
            id="Core"
            transform="translate(-253.000000, -211.000000)"
          >
            <g transform="translate(253.500000, 211.500000)">
              <path
                d="M18.5,10 L17,10 L17,6 C17,4.9 16.1,4 15,4 L11,4 L11,2.5 C11,1.1 9.9,0 8.5,0 C7.1,0 6,1.1 6,2.5 L6,4 L2,4 C0.9,4 0,4.9 0,6 L0,9.8 L1.5,9.8 C3,9.8 4.2,11 4.2,12.5 C4.2,14 3,15.2 1.5,15.2 L0,15.2 L0,19 C0,20.1 0.9,21 2,21 L5.8,21 L5.8,19.5 C5.8,18 7,16.8 8.5,16.8 C10,16.8 11.2,18 11.2,19.5 L11.2,21 L15,21 C16.1,21 17,20.1 17,19 L17,15 L18.5,15 C19.9,15 21,13.9 21,12.5 C21,11.1 19.9,10 18.5,10 L18.5,10 Z"
                id="Shape"
              />
            </g>
          </g>
        </g>
      </svg>
    </button>
  );
};

export default ExtensionIcon;
