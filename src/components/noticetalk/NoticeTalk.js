import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useDispatch, useSelector } from 'react-redux';
import { TailSpin } from '@agney/react-loading';
import qs from 'qs';
import { useViewState } from '@/lib/note';
import { appendLayer, getJobInfo, openPopup } from '@/lib/common';
import ProfileBox from '@C/common/ProfileBox';
import AddTarget from '@/pages/note/AddTarget';
import NotificationPopup from '@/components/noticetalk/NotificationPopup';
import ContextBox from '@/components/noticetalk/contextBox';
import useTargetState from '@/pages/note/TargetState';
import ConditionalWrapper from '@/components/ConditionalWrapper';
import { getNote } from '@/lib/note';
import { isMainWindow } from '@/lib/deviceConnector';
import LayerTemplate from '@COMMON/layer/LayerTemplate';
import { chatsvr } from '@/lib/api';
import { bound } from '@/modules/menu';
import validator from 'validator';

function _popupResult(dispatch, message, cb) {
  openPopup(
    {
      type: 'Alert',
      message,
      ...(typeof cb === 'function' && { callback: cb }),
    },
    dispatch,
  );
}

export default function NoticeTalk({ match, location, history }) {
  const dispatch = useDispatch();
  const isNewWin =
    window.opener !== null || (match && match.url.indexOf('/nw/') > -1);
  const { myInfo } = useSelector(({ login }) => ({ myInfo: login.userInfo }));
  const params =
    isNewWin &&
    location.search &&
    qs.parse(location.search, { ignoreQueryPrefix: true });
  const [viewState, setViewState, clearViewState] = useViewState(params);
  const { data: targets, mutate: setTargets } = useTargetState([]);
  const [noticeSubject, setNoticeSubject] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [context, setContext] = useState('');
  const [checkAll, setCheckAll] = useState(false);
  const [url, setUrl] = useState('');
  const [checkLink, setCheckLink] = useState(false);
  const validURL = useMemo(() => validator.isURL(url, { require_protocol: true, allow_trailing_dot: true }), [url]);


  useLayoutEffect(() => {
    const { noteId, noteInfo } = viewState;

    async function fetchNote(_noteId) {
      const fetchedNoteInfo = await getNote(_noteId);
      setViewState(
        {
          ...viewState,
          noteInfo: fetchedNoteInfo,
        },
        false,
      );
    }

    if (noteId && !noteInfo) {
      fetchNote(noteId);
    }
  }, [viewState]);

  useEffect(() => {
    dispatch(bound({ name: '', type: '' }));

    return () => {
      console.log('NewNote Unmounted');
      clearViewState();
      setTargets([]);
    };
  }, []);

  const addTarget = useCallback(() => {
    appendLayer(
      {
        component: (
          <AddTarget
            oldMemberList={targets}
            onChange={changedTargets => setTargets(changedTargets)}
          />
        ),
      },
      dispatch,
    );
  }, [viewState, targets]);

  const handleNotificationPopup = useCallback(() => {
    appendLayer(
      {
        component: (
          <NotificationPopup onChange={subject => setNoticeSubject(subject)} />
        ),
      },
      dispatch,
    );
  }, [viewState, targets]);

  function removeTarget(name) {
    setTargets(targets.filter(t => t.name !== name));
  }

  async function handleSend() {
    if (isSending === true) {
      return;
    }

    let subjectId = '';
    const selectTargets = [];

    targets.forEach(target => {
      selectTargets.push({ targetCode: target.id, targetType: target.type });
    });

    var objLink = {
      title: '시스템 알림',
      context: context.trim(),
      func: {
        name: '페이지로 이동',
        type: 'link',
        data: {
          baseURL: url,
        },
      },
    };

    let selectAll = [{ targetCode: myInfo.CompanyCode, targetType: 'G' }];


    if (noticeSubject) {
      subjectId = noticeSubject.subjectId;
    } else {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Noti_EnterChannel', '알림채널을 선택하세요'),
      );
      return;
    }
    if (selectTargets.length === 0 && !checkAll) {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Note_EnterRecipient', '받는사람을 선택하세요.'),
      );
      return;
    }
    if (context.trim().length === 0) {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Note_EnterContext', '내용을 입력하세요.'),
      );
      return;
    }

    if (checkLink && !url || checkLink && !validURL  ) {
      _popupResult(
        dispatch,
        covi.getDic('CheckURL', '올바를 url형식을 사용하고 있는지 확인하세요'),
      );
      return;
    }

    
    try {
      setIsSending(true);
      const sendData = {
        subjectId: subjectId.toString(),
        targets: checkAll ? selectAll : selectTargets,
        message: checkLink ? JSON.stringify(objLink) : context.trim(),
        companyCode: myInfo.CompanyCode,
        push: 'Y',
      };

      console.log('sent data!', sendData);

      const { data } = await chatsvr('post', '/notice/talk', sendData);

      if (data) {
        _popupResult(
          dispatch,
          covi.getDic('Msg_Noti_SendSuccess', '알림톡 전송에 성공했습니다.'),
          () => {
            if (DEVICE_TYPE === 'b') {
              window.location.reload();
            } else if (DEVICE_TYPE === 'd') {
              if (isMainWindow() === true) {
                return;
              }
              window.close();
            }
          },
        );
      } else {
        _popupResult(
          dispatch,
          covi.getDic('Msg_Note_SendFail', '알림톡 전송에 실패했습니다.'),
        );
      }
    } catch (err) {
      console.log('Send Error   ', err);
    } finally {
      setIsSending(false);
    }
    return;
  }

  return (
    <ConditionalWrapper
      wrapIf={isNewWin}
      wrapper={children => <div className="Chat Newwindow">{children}</div>}
    >
      <div id="wrap" style={{ height: 'calc(100% - 20px)' }}>
        <Scrollbars
          autoHide={true}
          className="noteWrap Layer-Notepop"
          style={{ zIndex: 'unset', overflow: 'hidden' }}
        >
          <div className="modalheader">
            {DEVICE_TYPE == 'b' && (
              <a className="closebtn" onClick={() => history.goBack()} />
            )}
            <div className="modaltit">
              <p>{covi.getDic('NoticeTalk', '알림톡')}</p>
            </div>
          </div>

          {/* 알림 채널 */}
          <div className="txtBox" style={{ padding: '0 30px' }}>
            <p>{covi.getDic('Notitification_Channel', '알림 채널')}</p>
          </div>
          <div
            className="org_select_wrap"
            style={{ marginRight: '30px', marginLeft: '30px' }}
          >
            <ul>
              {noticeSubject && (
                <li>
                  <div>
                    <div className="profile-photo">
                      <img src={noticeSubject.subjectPhoto}></img>
                    </div>
                    <p className="name">{noticeSubject.subjectName}</p>
                    <span
                      className="del"
                      onClick={() => setNoticeSubject(null)}
                    ></span>
                  </div>
                </li>
              )}
              <li>
                <div className="add" onClick={handleNotificationPopup}>
                  <a className="ui-link">
                    <div
                      className={
                        noticeSubject
                          ? 'profile-photo addChange'
                          : 'profile-photo add'
                      }
                    ></div>
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* 받는 사람 */}

          <div className="txtBox org_select_wrap_txtBox">
            <div>
              <p>{covi.getDic('Note_Recipient', '받는사람')}</p>
            </div>
            <div style={{ display: 'flex' }}>
              <input
                id="chkStyle03"
                className="chkStyle03"
                type="checkbox"
                onClick={() => setCheckAll(!checkAll)}
                checked={checkAll}
              />
              <label for="chkStyle03" className="Style03" />
              <p> {covi.getDic('All_Recipient', '전체공지')}</p>
            </div>
          </div>
          <div
            className={
              checkAll ? 'org_select_wrap disabled_box' : 'org_select_wrap'
            }
            style={{ marginRight: '30px', marginLeft: '30px' }}
          >
            <ul>
              {targets.map((target, idx) => {
                return (
                  <li key={idx}>
                    <a className="ui-link">
                      <ProfileBox
                        userId={target.id}
                        img={target.photoPath}
                        presence={target.presence}
                        isInherit={true}
                        userName={target.name}
                        handleClick={false}
                        checkAll={checkAll}
                      />
                      <p className="name">{getJobInfo(target)}</p>
                      <span
                        onClick={
                          !checkAll ? () => removeTarget(target.name) : ''
                        }
                        className={'del'}
                      ></span>
                    </a>
                  </li>
                );
              })}
              <li
                className={checkAll ? 'add-disable' : 'add'}
                onClick={!checkAll ? addTarget : () => {}}
              >
                <a className="ui-link">
                  <div
                    className={
                      checkAll
                        ? 'profile-photo add-disable'
                        : 'profile-photo add'
                    }
                  ></div>
                </a>
              </li>
            </ul>
          </div>
          {/* 내용 */}
          <ContextBox
            setContext={setContext}
            setUrl={setUrl}
            url={url}
            checkLink={checkLink}
            setCheckLink={setCheckLink}
            validURL={validURL}
          />
        </Scrollbars>
        <div className="layer-bottom-btn-wrap right">
          <a className="Btn-pointcolor-mini" onClick={handleSend}>
            {isSending ? (
              <TailSpin style={{ verticalAlign: 'middle' }} />
            ) : (
              covi.getDic('Msg_Note_Send', '보내기')
            )}
          </a>
        </div>
      </div>
      <LayerTemplate />
    </ConditionalWrapper>
  );
}
