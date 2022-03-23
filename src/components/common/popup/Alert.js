import React, { useCallback, useEffect, useState } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useDispatch } from 'react-redux';
import { close } from '@/modules/popup';
import useWindowDimensions from '@/hooks/useWindowDimensions';

const Alert = ({ popObj }) => {
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    if (popObj.callback) popObj.callback();
    dispatch(close());
  }, [dispatch, popObj]);

  const { height } = useWindowDimensions();

  // 팝업 내에 텍스트와 스크롤바가 서로 겹치지 않도록 좌우 padding 적용순서 조정
  const zeroPadding = {
    paddingRight: 0,
    paddingLeft: 0,
  };
  const withPadding = {
    paddingRight: '20px',
    paddingLeft: '20px',
  };
  return (
    <>
      <div className="popup-layer-wrap">
        <div className="popup-layer type02" style={zeroPadding}>
          <Scrollbars autoHeight autoHeightMax={height / 3}>
            <p
              className="normaltxt"
              style={withPadding}
              dangerouslySetInnerHTML={{ __html: popObj.message }}
            ></p>
          </Scrollbars>
          <div className="btnbox">
            <a onClick={handleClose} style={withPadding}>
              <span className="colortxt-point">
                {covi.getDic('Ok', '확인')}
              </span>
            </a>
          </div>
        </div>
      </div>
      <div className="bg_dim_layer"></div>
    </>
  );
};

export default Alert;
