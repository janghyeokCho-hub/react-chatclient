import React, { useEffect, useRef, useCallback } from 'react';
import ChatRoomHeader from '@C/chat/chatroom/normal/ChatRoomHeader';
import NoticeList from '@/components/chat/chatroom/notice/NoticeList';

const NoticeView = ({ roomInfo, onNewWin, isNewWin, onRead }) => {
  const chatBox = useRef(null);

  const readMessageEvt = useCallback(
    e => {
      // focus in 시 지정된 이벤트 모두 제거
      onRead(roomInfo.roomID, true);
      chatBox.current.removeEventListener('click', readMessageEvt);
    },
    [onRead],
  );

  useEffect(() => {
    window.onblur = e => {
      chatBox.current.addEventListener('click', readMessageEvt, { once: true });
    };
  });

  useEffect(() => {
    return () => {
      window.onblur = null;
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={chatBox}>
      <ChatRoomHeader
        roomInfo={roomInfo}
        isMakeRoom={false}
        onNewWin={onNewWin}
        isNewWin={isNewWin}
      />
      <NoticeList />
      <div className="message-input-wrap">
        <div
          className="message-input clearfix"
          style={{ position: 'relative', backgroundColor: '#f9f9f9' }}
        >
          <div
            style={{
              height: '48px',
              padding: '10px',
              boxSizing: 'border-box',
              color: '#777',
            }}
          >
            {covi.getDic('Msg_ImpossibleChat')}
          </div>
          <div className="input-bottombox">
            <div className="input-icobox">
              <button alt="Emoji" title="Emoji" disabled={true}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18.798"
                  height="18.798"
                  viewBox="0 0 18.798 18.798"
                >
                  <path
                    d="M9.4,18.8A9.4,9.4,0,1,0,0,9.4,9.4,9.4,0,0,0,9.4,18.8Zm0-17.44A8.04,8.04,0,1,1,1.359,9.4,8.057,8.057,0,0,1,9.4,1.359Z"
                    fill="#999"
                  ></path>
                  <path
                    d="M138.561,144.952a1.076,1.076,0,1,0-.759-.317A1.072,1.072,0,0,0,138.561,144.952Z"
                    transform="translate(-131.993 -137.093)"
                    fill="#999"
                  ></path>
                  <path
                    d="M273.428,144.952a1.076,1.076,0,1,0-.759-.317A1.052,1.052,0,0,0,273.428,144.952Z"
                    transform="translate(-261.469 -137.093)"
                    fill="#999"
                  ></path>
                  <path
                    d="M128.641,271.19c3.5,0,4.518-2.355,4.564-2.446a.687.687,0,0,0-.362-.895.662.662,0,0,0-.883.362c-.034.068-.747,1.619-3.307,1.619-2.48,0-2.922-1.461-2.944-1.529v.011l-1.325.328C124.417,268.744,125.062,271.19,128.641,271.19Z"
                    transform="translate(-119.412 -257.091)"
                    fill="#999"
                  ></path>
                </svg>
              </button>
              <button alt="Sticker" title="Sticker" disabled={true}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18.089"
                  height="18.08"
                  viewBox="0 0 18.089 18.08"
                >
                  <path
                    d="M88.17,180.515h0c-.455-.45-.911-.908-1.356-1.353L85.3,177.643c-1.769-1.773-3.6-3.606-5.414-5.415a.8.8,0,0,0-.5-.208,7.845,7.845,0,0,0-2.144.259,9.022,9.022,0,0,0-3.152,1.489,9.247,9.247,0,0,0-2.337,2.5,8.84,8.84,0,0,0-1.187,6.754,9.15,9.15,0,0,0,3.2,5.063,9.037,9.037,0,0,0,5.625,2.011,8.166,8.166,0,0,0,3.5-.735,9.746,9.746,0,0,0,4-3.278,9.471,9.471,0,0,0,1.542-4.942A.784.784,0,0,0,88.17,180.515Zm-1.876.157c-.23.046-.469.094-.706.139l-.548.106-.01,0c-.5.1-1.017.2-1.529.285a3.5,3.5,0,0,1-.589.049,3.686,3.686,0,0,1-3.67-3,4.89,4.89,0,0,1,.086-1.841c.109-.554.216-1.111.319-1.652v-.007l.13-.679,6.587,6.581ZM78.423,174.2l-.01.053c-.143.745-.291,1.515-.433,2.274a4.961,4.961,0,0,0,1.115,4.21,4.857,4.857,0,0,0,3.188,1.786,5.853,5.853,0,0,0,1.975-.122c.687-.139,1.389-.272,2.068-.4l.009,0,.724-.138a7.577,7.577,0,0,1-6.908,6.893c-.255.024-.513.036-.768.036a7.742,7.742,0,0,1-5.329-2.073,7.766,7.766,0,0,1,4.526-13.338Z"
                    transform="translate(-70.341 -172.018)"
                    fill="#999"
                  ></path>
                </svg>
              </button>
              <button type="button" alt="Files" title="Files" disabled={true}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16.882"
                  height="18.798"
                  viewBox="0 0 16.882 18.798"
                >
                  <path
                    d="M36.374,5.613a.67.67,0,0,0-.947-.947l-7.011,7.011a2.152,2.152,0,0,0,3.043,3.043L38.8,7.374A1.046,1.046,0,0,0,39,7.24c.981-.981,3.589-3.589,1.081-6.1A3.483,3.483,0,0,0,36.764.085a6.371,6.371,0,0,0-3.043,1.872L25.763,9.915a4.9,4.9,0,0,0-1.393,3.7,5.535,5.535,0,0,0,1.572,3.656A5.327,5.327,0,0,0,29.564,18.8h.111a4.943,4.943,0,0,0,3.533-1.438l7.847-7.847a.67.67,0,0,0-.947-.947l-7.847,7.847a3.673,3.673,0,0,1-2.675,1.048,3.962,3.962,0,0,1-2.876-6.6L34.668,2.9a5.178,5.178,0,0,1,2.374-1.5,2.149,2.149,0,0,1,2.1.7,1.738,1.738,0,0,1,.58,1.906A4.92,4.92,0,0,1,38.6,5.736a1.394,1.394,0,0,0-.134.1l-7.947,7.947a.812.812,0,0,1-1.148-1.148Z"
                    transform="translate(-24.365 0)"
                    fill="#999"
                  ></path>
                </svg>
              </button>
            </div>
            <button
              disabled={true}
              alt="Send"
              title="Send"
              type="button"
              className="sendbtn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20.066"
                height="25.802"
                viewBox="0 0 20.066 25.802"
              >
                <g transform="translate(7.704 -0.001) rotate(45)">
                  <g transform="translate(-0.001 0.002)">
                    <g transform="translate(0 0)">
                      <path
                        d="M.337,6.861A.537.537,0,0,0,.3,7.843l6.291,3.051L17.485,0Z"
                        transform="translate(0.001 -0.002)"
                        fill="#6d6d6d"
                      ></path>
                    </g>
                  </g>
                  <g transform="translate(7.352 0.761)">
                    <path
                      d="M206.344,32.2l3.051,6.291a.537.537,0,0,0,.483.3h.019a.537.537,0,0,0,.479-.337l6.859-17.148Z"
                      transform="translate(-206.344 -21.306)"
                      fill="#6d6d6d"
                    ></path>
                  </g>
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(NoticeView);
