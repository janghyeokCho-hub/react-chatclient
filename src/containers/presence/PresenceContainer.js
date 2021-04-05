import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTargetUser } from '@/modules/presence';

const PresenceContainer = () => {
  let delayFn = null;
  const actionQue = useSelector(({ presence }) => presence.actionQue);
  const id = useSelector(({ login }) => login.id);
  const dispatch = useDispatch();

  useEffect(() => {
    // TODO: Presence 업데이트 시간 및 배열 사이즈에 대해 Config로 변경 필요
    if (actionQue.length > 0) {
      if (actionQue.length > 500) {
        if (delayFn != null) {
          clearTimeout(delayFn);
        }
        /**
         * 2021.01.04
         * localStorage에 값이 있을 경우에만 presence 실행
         */
        if (localStorage.getItem('covi_user_access_token') !== null &&
          localStorage.getItem('covi_user_access_id') !== null) {
          dispatch(setTargetUser());
        }
      } else {
        if (delayFn === null)
          delayFn = setTimeout(() => {
            /**
             * 2021.01.04
             * localStorage에 값이 있을 경우에만 presence 실행
             */
            if(localStorage.getItem('covi_user_access_token') !== null &&
              localStorage.getItem('covi_user_access_id') !== null) {
                dispatch(setTargetUser());
                delayFn = null;
            }
          }, 10000);
      }
    }
  }, [actionQue]);

  useEffect(() => {
    return () => {
      if (delayFn != null) clearTimeout(delayFn);
    };
  }, []);

  return null;
};

export default PresenceContainer;
