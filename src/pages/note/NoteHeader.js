import React, { useEffect } from 'react';
import { setWindowTitle, isMainWindow } from '@/lib/deviceConnector';

export default function NoteHeader({ title, onClose }) {
  useEffect(() => {
    if (DEVICE_TYPE === 'b') {
      return;
    }
    isMainWindow() === false && setWindowTitle(covi.getDic('Note', '쪽지'));
  }, []);

  return (
    <div
      className="top"
      style={{
        paddingLeft: SCREEN_OPTION === 'G' ? '30px' : '',
        backgroundColor: '',
      }}
    >
      {SCREEN_OPTION === 'G' && (
        <div
          style={{
            transform: 'translate(0, -50%)',
            height: '60px',
            position: 'absolute',
            top: '50%',
            left: '0px',
          }}
        >
          <button
            style={{ lineHeight: '60px' }}
            title={covi.getDic('Back', '뒤로')}
            alt={covi.getDic('Back', '뒤로')}
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7.131"
              height="12.78"
              viewBox="0 0 7.131 12.78"
            >
              <path
                id="패스_2901"
                data-name="패스 2901"
                d="M698.2,291.6a.524.524,0,0,0-.742.741l5.579,5.592-5.579,5.4a.524.524,0,0,0,.742.742l6.236-6.139Z"
                transform="translate(704.432 304.223) rotate(180)"
                fill="#fff"
              />
            </svg>
          </button>
        </div>
      )}
      <span className="name">{title || covi.getDic('Note', '쪽지')}</span>
    </div>
  );
}
