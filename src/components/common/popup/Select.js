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
          <ul className="menulist">
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
              <a onClick={handleClose}>{covi.getDic('Cancel')}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="bg_dim_layer"></div>
    </>
  );
};

export default Select;
