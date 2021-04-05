import React, { useEffect } from 'react';

const URLChecker = ({ history, gotoURL }) => {
  useEffect(() => {
    if (gotoURL === '' || gotoURL === undefined) {
      gotoURL = '/client/main/contactlist';
    }
    history.push(gotoURL);
  }, []);

  return <></>;
};

export default URLChecker;
