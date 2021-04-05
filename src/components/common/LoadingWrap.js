import React from 'react';

const LoadingWrap = ({ style }) => {
  return (
    <div className="loadingBack" style={{ style }}>
      <div className="loading-gif posi-center"></div>
    </div>
  );
};

export default LoadingWrap;
