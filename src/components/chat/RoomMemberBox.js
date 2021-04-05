import React, { useMemo } from 'react';
import ProfileBox from '../common/ProfileBox';

const RoomMemberBox = ({ type, data }) => {
  const photoBox = useMemo(() => {
    let className = 'profile-photo-group';
    let length = data.length;

    if (length === 2) className += ' two';
    if (length === 3) className += ' three';
    if (length >= 4) {
      length = 4;
      className += ' four';
    }

    let profileBoxEl = [];
    for (let i = 0; i < length; i++) {
      profileBoxEl.push(
        <ProfileBox
          key={data[i].id}
          userId={data[i].id}
          userName={data[i].name}
          img={data[i].photoPath}
          handleClick={false}
        />,
      );
    }

    return <div className={className}>{profileBoxEl}</div>;
  }, [data]);

  return photoBox;
};

export default React.memo(RoomMemberBox);
