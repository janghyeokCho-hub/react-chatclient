import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import { openChatRoomView } from '@/lib/roomUtil';
import { openPopup, getJobInfo, getDictionary } from '@/lib/common';
import { format } from 'date-fns';
import useTyping from '@/hooks/useTyping';

const UserInfoBox = ({ userInfo, isInherit, isClick, checkObj, isMine }) => {
  const viewType = useSelector(({ room }) => room.viewType);
  const rooms = useSelector(({ room }) => room.rooms);
  const selectId = useSelector(({ room }) => room.selectId);
  const myInfo = useSelector(({ login }) => login.userInfo);
  const checkRef = useRef(null);
  const dispatch = useDispatch();
  const { confirm } = useTyping();

  const info = isMine
  ? { ...myInfo, absenceInfo: userInfo.absenceInfo }
  : userInfo;

  const getDeptName = useCallback(
    ()=>{
      let jobjParsedDept = '';
      try {
        jobjParsedDept = JSON.parse(info.dept);
      }catch(e){
        return getDictionary(info.dept);
      };
      if(Array.isArray(jobjParsedDept)){        
        let arrDeptDics = [];
        jobjParsedDept.forEach((item) => {
          if(item == null) return false;
          arrDeptDics.push(getDictionary(item));
        });
        return arrDeptDics.join("/");
      }
      return getDictionary(info.dept);
    },
    [userInfo, myInfo, isMine]
  );

  // 대화목록에서 상대 클릭시 이벤트 처리
  const handleClick = useCallback(
    isDoubleClick => {
      if (isClick) {
        if (userInfo.pChat == 'Y') {
          const openChatRoomArgs = [
            dispatch,
            viewType,
            rooms,
            selectId,
            userInfo,
            myInfo,
            isDoubleClick
          ];
          // 2020.12.22
          // input값 남아있을때 경고창 출력
          confirm(dispatch, openChatRoomView, openChatRoomArgs);
        } else {
          if (
            (!isDoubleClick && (viewType != 'S' || SCREEN_OPTION == 'G')) ||
            (isDoubleClick && viewType == 'S' && SCREEN_OPTION != 'G')
          ) {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic('Msg_GroupInviteError'),
              },
              dispatch,
            );
          }
        }
      } else if (checkObj && userInfo.type !== 'G') {
        checkRef && checkRef.current && checkRef.current.click();
      }
    },
    [isClick, viewType, userInfo, rooms, selectId, myInfo, dispatch, checkRef],
  );

  const drawUserInfoBox = useMemo(() => {
    const type = userInfo.type;

    if (type == 'G') {
      return (
        <a>
          <div className="profile-photo group"></div>
          <span className="name">{getDictionary(info.name)}</span>
          {info.dept&&<span className="team">{getDeptName()}</span>}
        </a>
      );
    } else {
      const getAdditionalInfoBox = info => {
        try {
          if (info.absenceInfo) {
            let absenceInfo = info.absenceInfo;
            if (typeof info.absenceInfo !== 'object') {
              try {
                absenceInfo = JSON.parse(info.absenceInfo);
              } catch (e) {
                absenceInfo = null;
              }
            }

            return (
              <span className="absence">
                <span>{covi.getDic(`Ab_${absenceInfo.code}`)}</span>
                <span>
                  {`${format(absenceInfo.startDate, `MM. dd`)} ~ ${format(
                    absenceInfo.endDate,
                    `MM. dd`,
                  )}`}
                </span>
              </span>
            );
          } else if (info.work) {
            return (
              <span
                className="pic"
                title={info.work}
                style={{
                  maxWidth: 'calc(100% - 250px)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {info.work}
              </span>
            );
          }
        } catch (e) {
          return <></>;
        }
      };

      return (
        <a>
          <ProfileBox
            userId={info.id}
            userName={info.name}
            presence={info.presence}
            img={info.photoPath}
            isInherit={isInherit}
          />
          <span className="name">{getJobInfo(info)}</span>
          {info.channelAuth && info.channelAuth === 'Y' && (
            <span className="admintag">{covi.getDic('Admin')}</span>
          )}
          {info.isMobile === 'Y' && <span className="mobileico ml5"></span>}
          <span className="team">{getDeptName()}</span>
          {!checkObj && isClick && getAdditionalInfoBox(info)}
        </a>
      );
    }
  }, [userInfo, myInfo, isMine]);

  return (
    <li
      className={['person', info.type == 'G' && info.dept == '' ?'group' : '' ].join(' ')}
      onClick={() => handleClick(false)}
      onDoubleClick={() => handleClick(true)}
    >
      {drawUserInfoBox}
      {checkObj && (
        <div className="check">
          <div className="chkStyle02">
            <input
              ref={checkRef}
              type="checkbox"
              id={checkObj.name + userInfo.id}
              name={checkObj.name + userInfo.id}
              onClick={e => {
                e.stopPropagation();
              }}
              onChange={e => {
                checkObj.onChange(e, userInfo);
              }}
              disabled={
                checkObj.disabledList.find(
                  item =>
                    item[checkObj.disabledKey] ===
                    userInfo[checkObj.disabledKey],
                ) != undefined
              }
              checked={
                checkObj.checkedList.find(
                  item =>
                    item[checkObj.checkedKey] === userInfo[checkObj.checkedKey],
                ) != undefined
              }
            />
            <label
              htmlFor={checkObj.name + userInfo.id}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <span></span>
            </label>
          </div>
        </div>
      )}
    </li>
  );
};

export default React.memo(UserInfoBox);
