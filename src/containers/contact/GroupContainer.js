import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import UserInfoBox from '@COMMON/UserInfoBox';

/* 
    - checkObj : 멤버중 체크된 obj
    - group : 그룹정보 변경 대상의 그룹
*/
const GroupContainer = ({ checkObj, group}) => {

  useEffect(() => {
    
  }, []);

  return (
    <>
      <ul className="people">
        {group && group.sub &&
            group.sub.map(user => (
                <UserInfoBox
                    key={user.id}
                    userInfo={user}
                    isInherit={false}
                    isClick={false}
                    checkObj={checkObj}
                />
            ))}
      </ul>
    </>
  );
};

export default React.memo(GroupContainer);
