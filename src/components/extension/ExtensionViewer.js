// components\chat\ChatList.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { bound } from '@/modules/menu';

const ExtensionViewer = () => {
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);
  const userInfo = useSelector(({ login }) => login.userInfo);

  const [loadExtension, setLoadExtension] = useState(false);

  const loadExample = () => {
    const simpleExtension = document.getElementById('example');
    if (simpleExtension)
      simpleExtension.parentNode.removeChild(simpleExtension);
    const script = document.createElement('script');
    script.src = 'http://127.0.0.1:8080/SnakeExtension.js?t=' + new Date();
    script.id = 'example';
    script.onload = () => {
      setLoadExtension(false);
    };
    document.body.appendChild(script);
  };

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      bound({ name: covi.getDic('Extension'), type: 'extension-viewer' }),
    );

    if (!loadExtension) {
      setLoadExtension(true);
      loadExample();
    }
  }, []);

  return (
    <div className="extension-wrap" style={{ height: '100%' }}>
      {/* <button
        onClick={() => {
          window.location.reload();
        }}
      >
        load extension
      </button>
      {loadExtension && <p>loading extension</p>}
      <div id="extension"> </div> */}

      <iframe
        id="extension"
        src="http://slither.io/"
        width="100%"
        height="100%"
        style={{ borderWidth: 0 }}
      ></iframe>
    </div>
  );
};

export default ExtensionViewer;
