import React from 'react';
import { setVisiable, setChildren } from '@/modules/mainlayer';
import ProfilePopup from '@/components/common/ProfilePopup';
import { getProfileInfo } from '@/lib/profile';
import { appendLayer } from '@/lib/common';

export const openProfilePopup = (dispatch, userId) => {
  getProfileInfo(userId).then(({ data }) => {
    /*
    dispatch(setVisiable(true));
    dispatch(setChildren(<ProfilePopup userInfo={data.result} />));
    */

    appendLayer(
      { component: <ProfilePopup userInfo={data.result} /> },
      dispatch,
    );
  });
};
