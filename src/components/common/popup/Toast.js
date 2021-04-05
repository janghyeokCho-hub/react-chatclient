import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { closeToast } from '@/modules/popup';

const Toast = ({ popObj }) => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        dispatch(closeToast());
      }, 300);
    }, 500);
  }, []);

  return (
    <div className={(visible && 'toast openToast') || 'toast'}>
      <div className="toastWrap">
        <div className="bg"></div>
        <p className="text">{popObj.message}</p>
      </div>
    </div>
  );
};

export default Toast;
