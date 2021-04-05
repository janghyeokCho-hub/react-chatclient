import React, { useState } from 'react';

const Range = ({ min, max, init, onChange, onInput, size, style }) => {
  const [deg, setDeg] = useState(
    init ? Math.round(((init - min) / (max - min)) * 100) : 0,
  );
  return (
    <div
      className="range-slider"
      style={{
        width: `${size}px`,
        height: '30px',
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
    >
      <input
        type="range"
        value={deg}
        min="0"
        max="100"
        onInput={e => {
          if (typeof onInput === 'function') {
            const val = Math.round((e.target.value / 100) * (max - min) + min);
            onInput(val);
          }
        }}
        onChange={e => {
          setDeg(e.target.value);
          if (typeof onChange === 'function') {
            const val = Math.round((e.target.value / 100) * (max - min) + min);
            onChange(val);
          }
        }}
      ></input>
    </div>
  );
};

export default Range;
