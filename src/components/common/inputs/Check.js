import React from 'react';

const Check = ({ style, chkId, onChange, checked }) => {
  return (
    <div className="check" style={style}>
      <div className="chkStyle02">
        <input
          id={chkId}
          type="checkbox"
          onClick={e => {
            e.stopPropagation();
          }}
          onChange={onChange}
          checked={checked}
        />
        <label
          htmlFor={chkId}
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <span></span>
        </label>
      </div>
    </div>
  );
};

export default Check;
