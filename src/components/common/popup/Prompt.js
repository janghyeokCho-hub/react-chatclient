import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { close } from '@/modules/popup';

const Prompt = ({ popObj }) => {
  const [text, setText] = useState(popObj.initValue ? popObj.initValue : '');
  const inputEl = useRef(null);
  const dispatch = useDispatch();

  const handleClose = useCallback(
    result => {
      if (result && popObj.callback) popObj.callback(text);
      dispatch(close());
    },
    [dispatch, popObj, text],
  );

  useEffect(() => {
    inputEl.current.focus();
  }, []);

  return (
    <>
      <div className="popup-layer-wrap">
        <div className="popup-layer type06">
          {popObj.title && <p className="tittxt">{popObj.title}</p>}
          <p className="normaltxt">{popObj.message}</p>
          <p>
            <input
              type={popObj.inputType ? popObj.inputType : 'text'}
              className="promptBox"
              value={text}
              ref={inputEl}
              onChange={e => {
                setText(e.target.value);
              }}
            ></input>
          </p>
          <div className="btnbox">
            <a
              onClick={() => {
                handleClose(true);
              }}
            >
              <span className="colortxt-point">
                {covi.getDic('Ok', '확인')}
              </span>
            </a>
            <a
              onClick={() => {
                handleClose(false);
              }}
            >
              <span className="colortxt-grey">
                {covi.getDic('Cancel', '취소')}
              </span>
            </a>
          </div>
        </div>
      </div>
      <div className="bg_dim_layer"></div>
    </>
  );
};

export default Prompt;
