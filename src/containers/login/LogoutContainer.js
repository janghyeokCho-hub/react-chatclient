import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutRequest } from '@/modules/login';
import { withRouter } from 'react-router-dom';
import * as common from '@/lib/common';

const LogoutContainer = ({ history }) => {
  const { id, token } = useSelector(({ login }) => ({
    id: login.id,
    token: login.token,
  }));
  const dispatch = useDispatch();
  const handleLogout = useCallback(() => {
    common.openPopup(
      {
        type: 'Confirm',
        message: covi.getDic('Msg_logout', '로그아웃하시겠습니까?'),
        callback: result => {
          if (result) {
            const data = {
              id,
              token,
            };
            dispatch(logoutRequest(data));
            // 전체 store init
            history.push('/client');
          }
        },
      },
      dispatch,
    );
  }, [dispatch]);

  return (
    <div
      onClick={handleLogout}
      style={{
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#fff',
        position: 'absolute',
        bottom: '30px',
        left: '5px',
      }}
    >
      logout
    </div>
  );
};

export default withRouter(LogoutContainer);
