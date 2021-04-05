import React, { useRef } from 'react';
import { withRouter } from 'react-router-dom';

const LinkButton = ({ history, to, children, className }) => {

  const handleClick = e => {
    history.push(to);
  };

  return (
    <button
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default withRouter(LinkButton);
