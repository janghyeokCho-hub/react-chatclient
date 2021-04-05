import React from 'react';

const ChatLayer = ({ children, display }) => {
  return (
    <>
      <div
        className="cover_chat_menu"
        style={{ display: display ? 'block' : 'none' }}
      >
        {children}
      </div>
      <div
        className="bg_dim"
        style={{ display: display ? 'block' : 'none' }}
      ></div>
    </>
  );
};

export default ChatLayer;
