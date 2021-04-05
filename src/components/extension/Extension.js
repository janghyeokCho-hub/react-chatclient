import React, { useState, useEffect } from 'react';

const Extension = () => {
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

  useEffect(() => {
    if (!loadExtension) {
      setLoadExtension(true);
      loadExample();
    }
  }, []);

  return (
    <div className="extension-wrap">
      <button
        onClick={() => {
          window.location.reload();
        }}
      >
        load extension
      </button>
      {loadExtension && <p>loading extension</p>}
      <div id="extension"> </div>
    </div>
  );
};

export default React.memo(Extension);
