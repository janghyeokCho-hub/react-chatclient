import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import { openChatRoomView } from '@/lib/roomUtil';
import { openPopup, getJobInfo, getDictionary } from '@/lib/common';
import { format } from 'date-fns';
import useTyping from '@/hooks/useTyping';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';

const UserInfoBox = ({ userInfo, isInherit, isClick, checkObj, isMine }) => {
  const viewType = useSelector(({ room }) => room.viewType);
  const rooms = useSelector(({ room }) => room.rooms);
  const selectId = useSelector(({ room }) => room.selectId);
  const myInfo = useSelector(({ login }) => login.userInfo);
  const checkRef = useRef(null);
  const personEl = useRef(null);
  const nameEl = useRef(null);
  const [picAreaWidth, setPicAreaWidth] = useState('calc(100% - 250px)');
  const [picMaxWidth, setPicMaxWidth] = useState(0);
  const dispatch = useDispatch();
  const { confirm } = useTyping();

  const info = isMine
    ? { ...myInfo, absenceInfo: userInfo.absenceInfo }
    : userInfo;

  useEffect(() => {
    const debounceTimer = createTakeLatestTimer(100);

    /* 여기서 길이계산 */
    const setPicWidth = e => {
      const personWidth = personEl.current?.getBoundingClientRect();
      const nameWidth = nameEl.current?.getBoundingClientRect();
      const picWidth = personWidth
        ? personWidth.width - 30 - 52 - nameWidth?.width - 20 - 20
        : 0;
      //personEl - personEl 30(padding) - profileArea(42+10(marign)) - nameArea - picArea Padding(20) - 20(자체 여유 너비)

      if (picWidth > picMaxWidth) setPicAreaWidth(picWidth - (checkObj ? 25 : 0));
    };

    window.addEventListener('resize', () => {
      debounceTimer.takeLatest(setPicWidth);
    });

    setPicWidth();

    return () => {
      window.removeEventListener('resize', setPicWidth);
    };
  }, []);

  const getDeptName = useCallback(() => {
    let jobjParsedDept = '';
    try {
      jobjParsedDept = JSON.parse(info.dept);
    } catch (e) {
      return getDictionary(info.dept);
    }
    if (Array.isArray(jobjParsedDept)) {
      let arrDeptDics = [];
      jobjParsedDept.forEach(item => {
        if (item == null) return false;
        arrDeptDics.push(getDictionary(item));
      });
      return arrDeptDics.join('/');
    }
    return getDictionary(info.dept);
  }, [userInfo, myInfo, isMine]);

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
            isDoubleClick,
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
          {info.dept && <span className="team">{getDeptName()}</span>}
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

            if (absenceInfo.code != null) {
              return (
                <span className="absence" style={{ marginRight: checkObj ? 25 : 0}}>
                  <span>{covi.getDic(`Ab_${absenceInfo.code}`, absenceInfo.code)}</span>
                  <span>
                    {`${format(absenceInfo.startDate, `MM. dd`)} ~ ${format(
                      absenceInfo.endDate,
                      `MM. dd`,
                    )}`}
                  </span>
                </span>
              );
            }
          }
          if (info.work) {
            return (
              <span
                className="pic"
                title={info.work}
                style={{
                  maxWidth: picAreaWidth,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginRight: checkObj ? 25 : 0
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
          <span ref={nameEl} className="name" title={getJobInfo(info)}>
            {getJobInfo(info)}
          </span>
          {info.channelAuth && info.channelAuth === 'Y' && (
            <span className="admintag">{covi.getDic('Admin')}</span>
          )}
          {info.isMobile === 'Y' && <span className="mobileico ml5"></span>}
          <span className="team">{getDeptName()}</span>
          {/* {!checkObj && isClick && getAdditionalInfoBox(info)} */}
          {getAdditionalInfoBox(info)}
        </a>
      );
    }
  }, [userInfo, myInfo, isMine, picAreaWidth]);

  const checkedValue = useMemo(() => {
    if (typeof checkObj === 'undefined') {
      return;
    }
    // userInfo[checkedKey] 값이 비어있으면 checkedSubKey 참조
    if (typeof checkObj.checkedSubKey !== 'undefined') {
      return userInfo[checkObj.checkedKey] || userInfo[checkObj.checkedSubKey];
    }
    return userInfo[checkObj.checkedKey];
  }, [userInfo, checkObj]);

  return (
    <li
      ref={personEl}
      className={[
        'person',
        info.type == 'G' && info.dept == '' ? 'group' : '',
      ].join(' ')}
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
              // id={checkObj.name + userInfo.id}
              // name={checkObj.name + userInfo.id}
              id={checkObj.name + checkedValue}
              name={checkObj.name + checkedValue}
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
                    (item[checkObj.checkedKey] ||
                      item[checkObj.checkedSubKey]) === checkedValue,
                ) !== undefined
              }
            />
            <label
              // htmlFor={checkObj.name + userInfo.id}
              htmlFor={checkObj.name + checkedValue}
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
