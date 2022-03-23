import React from 'react';
import LoadingWrap from '@COMMON/LoadingWrap';
const SyncWrap = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="start-chat-wrap">
        <div className="posi-center">
          <div className="start-chat-img"></div>
          <p
            className="infotxt mt10"
            style={{ color: '#000', fontWeight: 'bold' }}
          >
            {covi.getDic('Msg_syncLoading', '동기화중입니다.')}
          </p>
        </div>
      </div>

      <LoadingWrap></LoadingWrap>
    </div>
  );
};

export default SyncWrap;
