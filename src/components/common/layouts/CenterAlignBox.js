import React from 'react';

const CenterAlignBox = ({ children, width, marginTop, padding }) => {
  return (
    <div
      style={{
        width: width,
        margin: `${marginTop} auto`,
        padding: padding,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
};

export default CenterAlignBox;
