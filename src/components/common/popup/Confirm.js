import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { close } from '@/modules/popup';

const Confirm = ({ popObj }) => {
  const dispatch = useDispatch();

  const handleClose = useCallback(
    result => {
      if (popObj.callback) popObj.callback(result);
      dispatch(close());
    },
    [dispatch, popObj],
  );

  return (
    <>
      <div className="popup-layer-wrap">
        <div className="popup-layer type02">
          <p className="normaltxt">{popObj.message}</p>
          <div className="btnbox">
            <a
              onClick={() => {
                handleClose(true);
              }}
            >
              <span className="colortxt-point">{covi.getDic('Ok')}</span>
            </a>
            <a
              onClick={() => {
                handleClose(false);
              }}
            >
              <span className="colortxt-grey">{covi.getDic('Cancel')}</span>
            </a>
          </div>
        </div>
      </div>
      <div className="bg_dim_layer"></div>
    </>
  );
};

export default Confirm;
