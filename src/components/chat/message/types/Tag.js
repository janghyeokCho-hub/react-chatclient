import React from 'react';
import { useDispatch } from 'react-redux';

import Plain from '@C/chat/message/types/Plain';

const Tag = ({ marking, text, value }) => {
  const dispatch = useDispatch();

  const handleClick = () => {
    if (value) {
      if (typeof covi.changeSearchView == 'function') {
        covi.changeSearchView(value);
      }
    }
  };

  return (
    <span
      style={{ fontWeight: 'bold', cursor: 'pointer' }}
      onClick={handleClick}
    >
      <Plain marking={marking} text={text}></Plain>
    </span>
  );
};

export default Tag;
