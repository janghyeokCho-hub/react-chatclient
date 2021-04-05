import React from 'react';
import Plain from '@C/chat/message/types/Plain';

const Link = ({ marking, text, link }) => {
  return (
    <>
      {(DEVICE_TYPE == 'd' && (
        <a
          onClick={e => {
            window.openExternalPopup(link);
          }}
        >
          <Plain marking={marking} text={text}></Plain>
        </a>
      )) || (
        <a href={link} target="_blank">
          <Plain marking={marking} text={text}></Plain>
        </a>
      )}
    </>
  );
};

export default Link;
