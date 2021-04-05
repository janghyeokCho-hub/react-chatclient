import React from 'react';

const isHexColor = background => {
  const hex = background.replace('#', '');
  return (
    typeof hex === 'string' && hex.length === 6 && !isNaN(Number('0x' + hex))
  );
};

const ChatBackground = ({ background }) => {
  return (
    <>
      {background && isHexColor(background) && (
        <div
          style={{
            width: '100%',
            height: 'calc(100% - 60px)',
            position: 'absolute',
            backgroundColor: background,
            bottom: '0px',
          }}
        ></div>
      )}
    </>
  );
};

export default ChatBackground;
