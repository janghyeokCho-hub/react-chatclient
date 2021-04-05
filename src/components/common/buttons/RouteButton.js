import React from 'react';
import { withRouter } from 'react-router-dom';

const RouteButton = ({ type, to, history, children }) => {
  const buttonStyle = {
    width: '50px',
    height: '50px',
    cursor: 'pointer',
    background:
      "url('/static/client/images/41082a971ea76fc70a576ffff3d852dd.png') no-repeat 50%",
  };

  const handleClick = () => {
    if (type === 'back') {
      history.goBack();
    } else if (type === 'forward') {
      history.goForward();
    } else if (type === 'close') {
      history.push('/client');
    } else if (type === 'home') {
      history.push('/client');
    } else if (type === 'redirect') {
      history.push(to);
    }
  };

  return <div style={buttonStyle} onClick={handleClick}></div>;
};

export default withRouter(RouteButton);
