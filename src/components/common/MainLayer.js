import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

const MainLayer = () => {
  const { visiable, children } = useSelector(({ mainlayer }) => ({
    visiable: mainlayer.visiable,
    children: mainlayer.children,
  }));

  if (visiable) {
    return (
      <div
        style={{
          position: 'absolute',
          left: '57px',
          top: '0px',
          background: 'white',
          border: '1px solid gray',
          height: '100%',
          width: '29%',
          opacity: '1',
        }}
      >
        {children}
      </div>
    );
  } else {
    return <></>;
  }
};

export default MainLayer;
