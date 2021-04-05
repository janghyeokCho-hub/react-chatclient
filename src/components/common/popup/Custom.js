import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { close } from '@/modules/popup';

const Custom = ({ popObj }) => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();

  const handleClose = useCallback(
    e => {
      const btnName = e.target.name;
      setVisible(false);
      if (popObj.btns[btnName].hasOwnProperty('callback'))
        popObj.btns[btnName].callback();
      setTimeout(() => {
        dispatch(close());
      }, 300);
    },
    [dispatch, popObj],
  );

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div
      className={'popupDefault'
        .concat((popObj.hold && ' popupWrap ') || '')
        .concat((visible && ' openPopup') || '')}
    >
      {popObj.hold && <div className="bg"></div>}
      <div className="popup">
        <div className="container">
          {popObj.close && (
            <div className="closeArea">
              <button type="button" className="btnClose" onClick={handleClose}>
                CLOSE
              </button>
            </div>
          )}

          <div className="context">
            <div>
              <p className="ctxt">{popObj.message}</p>
            </div>
          </div>
          <div className="btnArea">
            {popObj.btns &&
              Object.keys(popObj.btns).map(key => {
                const item = popObj.btns[key];
                const btnColor =
                  item.color === 'gray'
                    ? 'btnGray'
                    : item.color === 'red'
                    ? 'btnRed'
                    : 'btnBlue';

                return (
                  <button
                    key={key}
                    type="button"
                    name={key}
                    className={`btnNormal ${btnColor}`}
                    onClick={handleClose}
                  >
                    {item.text}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Custom;
