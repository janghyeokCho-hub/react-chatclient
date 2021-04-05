import React from 'react';

const MoveHeader = ({ onMoveBox }) => {
  const hideSearchBox = () => {
    onMoveBox();
  };

  return (
    <div
      className="SearchLayer"
      style={{ position: 'relative', top: '0px', background: '#F6F6F6' }}
    >
      <div
        style={{
          display: 'inline-block',
          height: '100%',
          lineHeight: '30px',
          fontSize: '13px',
          textAlign: 'right',
          position: 'absolute',
          top: '50%',
          left: '15px',
          transform: 'translate(0, -50%)',
          height: '32px',
          lineHeight: '32px',
        }}
      >
        {covi.getDic('ShowChat')}
      </div>

      <span className="searchcancel" onClick={hideSearchBox}>
        {covi.getDic('Cancel')}
      </span>
    </div>
  );
};

export default MoveHeader;
