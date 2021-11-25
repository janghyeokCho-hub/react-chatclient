import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import PresenceButton from '@COMMON/buttons/PresenceButton';
import Config from '@/config/config';
import { openProfilePopup } from '@/lib/profileUtil';
import { getDictionary } from '@/lib/common';
import useTimestamp from '@/hooks/useTimestamp';

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

  const { timestamp } = useTimestamp({ option: 'yMdh' });

  const profileBox = useMemo(() => {
    if (img && imgVisible) {
      let photoSrc = '';
      try {
        const urlParts = img?.split('?');
        /* query string에 't' 타임스탬프 추가 */
        if (Array.isArray(urlParts) && urlParts.length >= 2) {
          /* query string '?' identifier 중복처리 */
          const urlBase = urlParts.shift();
          photoSrc = new URL(urlBase + '?' + urlParts.join('&'));
          photoSrc.searchParams.append('t', timestamp);
        } else {
          photoSrc = new URL(img);
          photoSrc.searchParams.append('t', timestamp);
        }
      } catch (err) {
        try {
          // url이 relative path인 경우 catch error
          photoSrc = new URL(img, window.covi.baseURL);
          photoSrc.searchParams.append('t', timestamp);
        } catch (err) {
          photoSrc = img;
        }
      }
      return (
        <img
          src={decodeURIComponent(photoSrc.toString())}
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

  if (userId == 'eumbot-758f37d1-f6a6-4bc2-bb5b-0376da769697') {
    return <div className="profile-photo">{profileBox}</div>;
  } else {
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
  }
};

export default React.memo(ProfileBox);
