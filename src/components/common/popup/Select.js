import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { close } from '@/modules/popup';

const Select = ({ popObj }) => {
  const dispatch = useDispatch();

  const handleCallback = useCallback(
    callback => {
      if (callback) callback();
      dispatch(close());
    },
    [dispatch, popObj],
  );

  const handleClose = useCallback(() => {
    dispatch(close());
  }, [dispatch, popObj]);

  return (
    <>
      <div className="popup-layer-wrap">
        <div className="popup-layer type05">
          {popObj.title && (
            <p className="tittxt" style={{ marginTop: 5 }}>
              {popObj.title}
            </p>
          )}
          <ul className="menulist" style={{ marginTop: 2 }}>
            {popObj &&
              popObj.buttons.map((item, index) => {
                return (
                  <li key={index}>
                    <a
                      onClick={e => {
                        handleCallback(item.callback);
                      }}
                    >
                      {item.name}
                    </a>
                  </li>
                );
              })}
            <li>
              <a onClick={handleClose}>{covi.getDic('Cancel', '취소')}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="bg_dim_layer"></div>
    </>
  );
};

export default Select;
