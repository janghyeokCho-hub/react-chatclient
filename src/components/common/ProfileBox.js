import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import PresenceButton from '@COMMON/buttons/PresenceButton';
import Config from '@/config/config';
import { openProfilePopup } from '@/lib/profileUtil';
import { getDictionary } from '@/lib/common';

const ProfileBox = ({
  userId,
  img,
  userName,
  presence,
  handleClick,
  isInherit,
}) => {
  const dispatch = useDispatch();
  const id = useSelector(({ login }) => login.id, shallowEqual);
  const photoPath = useSelector(({ login }) => login.photoPath, shallowEqual);

  const [imgVisible, setImgVisible] = useState(true);

  useEffect(() => {
    if (userId == id) {
      img = photoPath;
    }
  }, [photoPath]);

  const openProfile = useCallback(() => {
    openProfilePopup(dispatch, userId);
  }, [userId, dispatch]);

  const profileBox = useMemo(() => {
    if (img && imgVisible) {
      return (
        <img
          src={`${img}`}
          onError={e => {
            setImgVisible(false);
            e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
            e.target.onerror = null;
          }}
        ></img>
      );
    } else {
      const convertUserName = (userName && getDictionary(userName)) || 'N';

      return (
        <div className="spare-text">
          {(convertUserName && convertUserName[0]) || 'N'}
        </div>
      );
    }
  }, [img, userName, imgVisible]);

  return (
    <div
      className="profile-photo"
      onClick={e => {
        if (handleClick === undefined) openProfile();
        else if (handleClick) handleClick();

        if (handleClick != false) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {profileBox}

      <PresenceButton
        userId={userId}
        state={presence}
        isInherit={isInherit}
      ></PresenceButton>
    </div>
  );
};

export default React.memo(ProfileBox);
