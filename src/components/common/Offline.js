import React, { useEffect } from 'react';
import { closeWindow } from '@/lib/deviceConnector';

const Offline = () => {
  useEffect(() => {
    window.addEventListener('online', () => {
      location.reload();
    });
    return () => {
      // Clean up
      window.removeEventListener('online');
    };
  }, []);

  return (
    <>
      {DEVICE_TYPE == 'd' && (
        <div
          style={{
            WebkitAppRegion: 'drag',
            backgroundColor: '#fff',
            height: '30px',
            width: '100%',
            zIndex: '990',
            position: 'relative',
            borderBottom: '1px solid #ddd',
            boxSizing: 'border-box',
            padding: '0 0 0 15px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0px',
              width: '100%',
              height: '3px',
              WebkitAppRegion: 'no-drag',
              zIndex: '999',
            }}
          ></div>
          <div></div>
          <p
            style={{
              WebkitAppRegion: 'drag',
              color: '#444',
              float: 'left',
              lineHeight: '27px',
              margin: '0',
            }}
          >
            eumtalk
          </p>
          <div style={{ float: 'right' }}>
            <button
              id="btnClose"
              alt={covi.getDic('Close')}
              title={covi.getDic('Close')}
              style={{
                WebkitAppRegion: 'no-drag',
                display: 'inline-block',
                width: '40px',
                height: '29px',
                cursor: 'pointer',
                border: 'none',
                outline: 'none',
                background: 'none',
              }}
              onClick={closeWindow}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9.193"
                height="9.192"
                viewBox="0 0 9.193 9.192"
              >
                <g transform="translate(-477.808 -9.904)">
                  <rect
                    width="2"
                    height="11"
                    transform="translate(477.808 11.318) rotate(-45)"
                    fill="#53524f"
                  />
                  <rect
                    width="2"
                    height="11"
                    transform="translate(485.586 9.904) rotate(45)"
                    fill="#53524f"
                  />
                </g>
              </svg>
            </button>
          </div>
        </div>
      )}
      <div
        id="wrap"
        style={{
          width: '100%',
          height: 'calc(100% - 30px)',
          backgroundColor: '#eee',
          fontFamily:
            "맑은 고딕, Malgun Gothic,sans-serif, dotum,'돋움',Apple-Gothic",
          fontSize: '14px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            lineHeight: '23px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '16px' }}>
            {covi.getDic('Msg_NetworkConnect')}
          </p>
          <p>{covi.getDic('Msg_NetworkCheck')}</p>
          <p style={{ marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                location.reload();
              }}
              style={{
                fontSize: '13px',
                border: '1px solid #888',
                borderRadius: '3px',
                backgroundColor: '#f9f9f9',
              }}
            >
              Reload App.
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default Offline;
