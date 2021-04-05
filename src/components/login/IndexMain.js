import React, { useEffect } from 'react';
import MainBox from '@C/login/MainBox';
import { getConfig } from '@/lib/util/configUtil';
import LoginMain from './LoginMain';

const IndexMain = () => {
  const enabledExtUser = getConfig('EnabledExtUser', 'N');

  return (
    <>
      {(enabledExtUser === 'Y' && (
        <div id="LoginWrap">
          <MainBox></MainBox>
        </div>
      )) || <LoginMain />}
    </>
  );
};

export default IndexMain;
