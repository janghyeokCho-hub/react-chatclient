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
import { setChineseWall } from '@/modules/login';
import { getChineseWall, isBlockCheck } from '@/lib/orgchart';
import { isMainWindow } from '@/lib/deviceConnector';

const UserInfoBox = ({
  userInfo,
  isInherit,
  isClick,
  checkObj,
  isMine,
  removeWork,
  onClick,
  onMouseDown,
}) => {
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const viewType = useSelector(({ room }) => room.viewType);
  const rooms = useSelector(({ room }) => room.rooms);
  const selectId = useSelector(({ room }) => room.selectId);
  const myInfo = useSelector(({ login }) => login.userInfo);
  const checkRef = useRef(null);
  const personEl = useRef(null);
  const nameEl = useRef(null);
  const [picAreaWidth, setPicAreaWidth] = useState('calc(100% - 250px)');
  const [picMaxWidth, setPicMaxWidth] = useState(0);
  const [chineseWallState, setChineseWallState] = useState([]);
  const dispatch = useDispatch();
  const { confirm } = useTyping();

  useEffect(() => {
    const getChineseWallList = async () => {
      const { result, status } = await getChineseWall({
        userId: myInfo?.id,
        myInfo,
      });
      if (status === 'SUCCESS') {
        setChineseWallState(result);
        if (DEVICE_TYPE === 'd' && !isMainWindow()) {
          dispatch(setChineseWall(result));
        }
      } else {
        setChineseWallState([]);
      }
    };

    if (chineseWall?.length) {
      setChineseWallState(chineseWall);
    } else {
      getChineseWallList();
    }

    return () => {
      setChineseWallState([]);
    };
  }, [userInfo, chineseWall]);

  // removeWork: 사용자의 업무 표기박스 미표기 플래그
  const info = isMine
    ? {
        ...myInfo,
        absenceInfo: userInfo.absenceInfo,
        work: removeWork ? undefined : myInfo?.work,
      }
    : { ...userInfo, work: removeWork ? undefined : userInfo?.work };

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

      if (picWidth > picMaxWidth)
        setPicAreaWidth(picWidth - (checkObj ? 25 : 0));
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
      if (typeof onClick === 'function') {
        onClick(userInfo);
        return;
      }
      if (typeof onMouseDown === 'function') {
        onMouseDown(userInfo);
        return;
      }
      if (isClick) {
        if (userInfo.pChat == 'Y') {
          console.log('userInfo : ', userInfo);
          console.log('chineseWall : ', chineseWallState);
          const { blockChat, blockFile } = isBlockCheck({
            targetInfo: userInfo,
            chineseWall: chineseWallState,
          });
          console.log('blockChat : ', blockChat);
          console.log('blockFile : ', blockFile);
          console.log(blockChat && blockFile);
          if (blockChat && blockFile) {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic('Msg_BlockTarget', '차단된 대상입니다.'),
              },
              dispatch,
            );
          } else {
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
          }
        } else {
          if (
            (!isDoubleClick && (viewType != 'S' || SCREEN_OPTION == 'G')) ||
            (isDoubleClick && viewType == 'S' && SCREEN_OPTION != 'G')
          ) {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic(
                  'Msg_GroupInviteError',
                  '해당 그룹은 그룹채팅을 시작할 수 없습니다.',
                ),
              },
              dispatch,
            );
          }
        }
      } else if (checkObj && userInfo.type !== 'G') {
        checkRef && checkRef.current && checkRef.current.click();
      }
    },
    [
      isClick,
      viewType,
      userInfo,
      rooms,
      selectId,
      myInfo,
      dispatch,
      checkRef,
      chineseWallState,
    ],
  );

  const drawUserInfoBox = useMemo(() => {
    const type = userInfo.type;
    console.log('usertype >> ', userInfo.type);
    if (type == 'G') {
      return <>
          <div className="profile-photo group"></div>
          <div className="name">{getDictionary(info.name)}</div>
          {info?.dept && <div className="team">{getDeptName()}</div>}
          </>
      ;
    } else if (type == 'B') {
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
                <span
                  className="absence"
                  style={{ marginRight: checkObj ? 25 : 0 }}
                >
                  <span>
                    {covi.getDic(`Ab_${absenceInfo.code}`, absenceInfo.code)}
                  </span>
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
                  marginRight: checkObj ? 25 : 0,
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
        <>
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
            <span className="admintag">{covi.getDic('Admin', '관리자')}</span>
          )}
          {info?.isMobile === 'Y' && <div className="mobileico ml5"></div>}
          {info?.dept && <div className="team">{getDeptName()}</div>}
          {/* {!checkObj && isClick && getAdditionalInfoBox(info)} */}
          {getAdditionalInfoBox(info)}
        </>
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
      onMouseDown={() => handleClick(false)}
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
