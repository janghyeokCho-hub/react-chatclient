import React, {
  useState,
  useEffect,
  useLayoutEffect,
  createRef,
  useCallback,
  useMemo,
} from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useDispatch, useSelector } from 'react-redux';
import { TailSpin } from '@agney/react-loading';
import qs from 'qs';

import {
  NOTE_RECEIVER_SEPARATOR,
  sendNote,
  useNoteList,
  getNoteList,
  useViewState,
  parseSender,
  translateName,
  convertTimeFormat,
  emergencyMark,
  nonEmergencyMark,
} from '@/lib/note';
import {
  appendLayer,
  getJobInfo,
  openPopup,
  getDictionary,
} from '@/lib/common';
import ProfileBox from '@C/common/ProfileBox';
import AddTarget from '@/pages/note/AddTarget';
import useTargetState from '@/pages/note/TargetState';
import * as coviFile from '@/lib/fileUpload/coviFile';
import FileInfoBox from '@COMMON/FileInfoBox';
import NoteHeader from '@/pages/note/NoteHeader';
import ConditionalWrapper from '@/components/ConditionalWrapper';
import { getNote } from '@/lib/note';
import { sendMain, isMainWindow } from '@/lib/deviceConnector';
// WYSIWYG Editor
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';

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

export default function NewNote({ match, location }) {
  const isNewWin =
    window.opener !== null || (match && match.url.indexOf('/nw/') > -1);
  const dispatch = useDispatch();
  const { myInfo } = useSelector(({ login }) => ({ myInfo: login.userInfo }));
  const blockUser = useSelector(({ login }) => login.blockList);
  const title = createRef();
  // const context = createRef();
  const editorRef = createRef();
  const fileUploadControl = createRef();
  const { mutate: setNoteList } = useNoteList({ viewType: 'send' });
  const params =
    isNewWin &&
    location.search &&
    qs.parse(location.search, { ignoreQueryPrefix: true });
  function revalidateNote() {
    /**
     * 2021.06.21 TODO
     * 쪽지함 viewType !== 'send'일때 revalidate 생략처리
     */
    !isNewWin && setNoteList(() => getNoteList(`/note/list/send`));
  }
  /**
   * 2021.05.26
   *
   * Electron window로 열릴 때는 url로부터 발송/답장/전달 여부를 전달받음.
   * => url 파싱 결과를 viewState의 initial data로 주입
   * 이유: useEffect hook에서 값을 처리하면 마운트 이후에 추가 렌더링 발생함.
   *  */
  const [viewState, setViewState, clearViewState] = useViewState(params);

  /**
   * 2021.05.10
   *
   * !! Important !!
   * 쪽지 발신시 여러 창을 동시에 허용할경우 state가 비정상 동작할 가능성 있음 (문제 발생시 개선사항)
   */
  const { data: targets, mutate: setTargets } = useTargetState([]);
  const [files, setFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  const headerTitle = useMemo(() => {
    const { type } = viewState;
    // TODO 다국어 적용
    if (type === 'reply') {
      return covi.getDic('Msg_Note_Reply', '답장하기');
    } else if (type === 'replyAll') {
      return covi.getDic('Msg_Note_ReplyAll', '전체답장하기');
    } else if (type === 'forward') {
      return covi.getDic('Msg_Note_Forward', '전달하기');
    } else {
      return covi.getDic('Msg_Note_Send', '보내기');
    }
  }, [location, viewState]);

  const setReplyTarget = useCallback(
    async (userInfo, { replyAll = false }) => {
      const nextTargets = [];
      if (!viewState.noteInfo) {
        return;
      }
      if (replyAll === true) {
        const tempTargets = [userInfo.sender, ...userInfo.receivers].filter(
          (receiver, index, self) => {
            return (
              index ===
              self.findIndex(r => {
                /**
                 * receiver.id === r.id
                 * => 중복 제거
                 * receiver.id !== myInfo?.id
                 * => 자기자신 제외
                 */
                return receiver.id === r.id && receiver.id !== myInfo?.id;
              })
            );
          },
        );
        nextTargets.push(...tempTargets);
      } else {
        nextTargets.push(userInfo.sender);
      }
      setTargets(nextTargets);
    },
    [viewState, myInfo],
  );

  const replyContext = useMemo(() => {
    if (viewState?.type === 'send' || !viewState?.noteInfo) {
      return '';
    }
    const { noteInfo } = viewState;
    const { receivers } = parseSender(noteInfo);
    const sendDate = convertTimeFormat(noteInfo.sendDate);
    const targetName = getDictionary(noteInfo.senderDisplayName);
    const originalReceivers = translateName(receivers);
    const replyFormat = [
      '<br/><br/>',
      '***',
      `Sent: ${sendDate}`,
      `From: ${targetName}`,
      `To: ${originalReceivers}`,
      `Subject: ${noteInfo.subject}`,
      noteInfo.context,
    ]
      .map(txt => `${txt}`)
      .join('\n\n');
    return replyFormat;
  }, [viewState]);

  useLayoutEffect(() => {
    const { type, noteId, noteInfo } = viewState;
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

    if (isNewWin && replyContext) {
      editorRef.current.getInstance().setMarkdown(replyContext);
      editorRef.current.getInstance().moveCursorToStart();
    }

    if (noteInfo) {
      if (type === 'forward') {
        title.current.value = `FWD: ${noteInfo.subject}`;
        // 전달메뉴는 받는사람 추가 생략
        return;
      } else {
        title.current.value = `RE: ${noteInfo.subject}`;
      }

      const userInfo = parseSender(noteInfo, {
        useOrgChartFormat: true,
        removePresence: true,
      });
      setReplyTarget(userInfo, { replyAll: type === 'replyAll' });
    }
  }, [viewState]);

  useEffect(() => {
    return () => {
      console.log('NewNote Unmounted');
      // Cleanup
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

  function removeTarget(name) {
    const filtered = targets.filter(t => {
      return t.name !== name;
    });
    setTargets(filtered);
  }

  function removeFile(tempId) {
    const filtered = files.filter(file => {
      return tempId !== file.tempId;
    });
    setFiles(filtered);
  }

  function handleFileChange(e) {
    const target = e.target;
    const fileCtrl = coviFile.getInstance();

    if (target && target.files.length > 0) {
      const appendResult = fileCtrl.appendFiles(target.files);
      if (appendResult.result == 'SUCCESS') {
        setFiles(fileCtrl.getFileInfos());
      } else {
        _popupResult(
          dispatch,
          coviFile.getValidationMessage(appendResult.message),
        );
      }
    }
  }

  async function handleSend() {
    if (isSending === true) {
      return;
    }

    const receiveUser = [];
    const receiveGroup = [];
    // 유저, 그룹 분류하여 데이터 전송
    targets.forEach(target => {
      if (target.type === 'U') {
        // 유저: '{id}|{kobKey}'
        receiveUser.push(
          `${target.id}${NOTE_RECEIVER_SEPARATOR}${target.jobKey}`,
        );
      } else if (target.type === 'G') {
        // 그룹: '{id}|{companyCode}'
        receiveGroup.push(
          `${target.id}${NOTE_RECEIVER_SEPARATOR}${target.companyCode}`,
        );
      }
    });

    const _context = editorRef?.current?.getInstance().getHTML();
    // input validation
    if (!receiveUser.length && !receiveGroup.length) {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Note_EnterRecipient', '받는사람을 선택하세요.'),
      );
      return;
    }

    if (!title.current.value.trim().length) {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Note_EnterTitle', '제목을 입력하세요.'),
      );
      return;
    } else if (title.current.value.length > 1900) {
      _popupResult(
        dispatch,
        covi.getDic(
          'Msg_Note_TitleExceeded',
          '제목은 1900자 이하로 입력하세요.',
        ),
      );
      return;
    }

    if (!_context.trim().length) {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Note)EnterContext', '내용을 입력하세요.'),
      );
      return;
    }

    try {
      setIsSending(true);

      const fileCtrl = coviFile.getInstance();
      const subject = title.current.value || '';
      const sendData = {
        sender: myInfo.id,
        receiveUser,
        receiveGroup,
        subject,
        context: _context,
        files: fileCtrl.getFiles(),
        fileInfos: fileCtrl.getFileInfos(),
        isEmergency: isEmergency ? 'Y' : 'N',
        blockList: blockUser || [],
      };
      const { data } = await sendNote(sendData);

      // 전송 성공여부 확인조건 수정필요
      if (typeof data?.result !== 'undefined') {
        if (DEVICE_TYPE === 'b') {
          /**
           * 2021.05.17
           * 메시지 전송 성공시 발신함만 즉시 업데이트 수행
           * (수신함은 swr의 auto revalidate 주기 or 뷰 변경시 업데이트)
           *  */
          revalidateNote();
        } else if (DEVICE_TYPE === 'd') {
          // 메인창 발신함과 동기화
          sendMain('sync-note', {
            viewType: 'send',
            op: 'refetch',
            result: data,
          });
        }
        _popupResult(
          dispatch,
          covi.getDic('Msg_Note_SendSuccess', '쪽지 전송에 성공했습니다.'),
          () => {
            if (DEVICE_TYPE === 'b') {
              // 쪽지발신 뷰 닫기
              clearViewState();
            } else if (DEVICE_TYPE === 'd') {
              if (isMainWindow()) {
                return;
              }
              window.close();
            }
          },
        );
      } else {
        _popupResult(
          dispatch,
          covi.getDic('Msg_Note_SendFail', '쪽지 전송에 실패했습니다.'),
        );
      }
    } catch (err) {
      console.log('Send Error   ', err);
    } finally {
      setIsSending(false);
    }
    return;
  }

  function handleFileDelete(tempId) {
    const fileCtrl = coviFile.getInstance();
    fileCtrl.delFile(tempId);
    removeFile(tempId);
  }

  const handleClose = useCallback(() => {
    clearViewState();
    DEVICE_TYPE === 'd' && window.close();
  }, []);

  return (
    <ConditionalWrapper
      wrapIf={isNewWin}
      wrapper={children => <div className="Chat Newwindow">{children}</div>}
    >
      <NoteHeader onClose={handleClose} title={headerTitle} />
      <div id="wrap" style={{ height: 'calc(100% - 60px)' }}>
        <Scrollbars
          autoHide={true}
          className="noteWrap Layer-Notepop"
          style={{ zIndex: 'unset', overflow: 'hidden' }}
        >
          <div className="txtBox" style={{ padding: '0 30px' }}>
            <p>{covi.getDic('Note_Recipient', '받는사람')}</p>
          </div>
          <div
            className="org_select_wrap"
            style={{ marginRight: '30px', marginLeft: '30px' }}
          >
            <ul>
              {targets.map((target, idx) => {
                return (
                  <li key={idx}>
                    <a
                      className="ui-link"
                      onClick={() => removeTarget(target.name)}
                    >
                      <ProfileBox
                        userId={target.id}
                        img={target.photoPath}
                        presence={target.presence}
                        isInherit={true}
                        userName={target.name}
                        handleClick={false}
                      />
                      <p className="name">{getJobInfo(target)}</p>
                      <span className="del"></span>
                    </a>
                  </li>
                );
              })}
              <li className="add" onClick={addTarget}>
                <a className="ui-link">
                  <div className="profile-photo add"></div>
                </a>
              </li>
            </ul>
          </div>
          <div className="Layer-Note-Con" style={{ marginBottom: '60px' }}>
            <div className="Profile-info-input" style={{ textAlign: 'start' }}>
              <div className="input full">
                <label
                  className="string optional"
                  htmlFor="user-name"
                  style={{ cursor: 'inherit' }}
                >
                  {covi.getDic('Title', '제목')}
                  {covi?.config?.UseNote?.emergency === 'Y' && (
                    <a
                      style={{ fontSize: '16px' }}
                      onClick={() => setIsEmergency(prev => !prev)}
                    >
                      {isEmergency ? emergencyMark : nonEmergencyMark}
                    </a>
                  )}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic(
                    'Msg_Note_EnterTitle',
                    '제목을 입력하세요.',
                  )}
                  type=""
                  ref={title}
                  style={{ cursor: 'text' }}
                />
              </div>
              <div className="input full">
                <label
                  className="string optional"
                  htmlFor="user-name"
                  style={{ cursor: 'inherit' }}
                >
                  {covi.getDic('Context', '내용')}
                </label>
                {/* <textarea className="string optional" name="" id="" cols="30" rows="10" placeholder="내용을 입력하세요." ref={context} style={{ cursor: 'text', resize: 'both', display: 'none' }}></textarea> */}
                <Editor
                  ref={editorRef}
                  initialEditType="wysiwyg"
                  initialValue={replyContext}
                  toolbarItems={''}
                  hideModeSwitch={true}
                />
              </div>
              <div className="input full">
                <label
                  className="string optional file"
                  htmlFor="user-name"
                  onClick={e => {
                    fileUploadControl.current.click();
                    e.stopPropagation();
                  }}
                >
                  {covi.getDic('AttachFile', '첨부파일')}
                </label>
                <ul
                  className="file-list_note type01"
                  style={{ overflowY: 'scroll' }}
                >
                  {files &&
                    files.map((file, idx) => {
                      return (
                        <FileInfoBox
                          key={idx}
                          tempId={file.tempId}
                          fileInfo={file}
                          onDelete={handleFileDelete}
                        />
                      );
                    })}
                </ul>
              </div>
            </div>
          </div>
          <div style={{ width: '0px', height: '0px' }}>
            <input
              ref={fileUploadControl}
              type="file"
              multiple={true}
              style={{ opacity: '0.0', width: '0px', height: '0px' }}
              onChange={handleFileChange}
            />
          </div>
        </Scrollbars>
        <div className="layer-bottom-btn-wrap right" style={{ zIndex: 499 }}>
          <a className="Btn-pointcolor-mini" onClick={handleSend}>
            {isSending ? (
              <TailSpin style={{ verticalAlign: 'middle' }} />
            ) : (
              covi.getDic('Msg_Note_Send', '보내기')
            )}
          </a>
        </div>
      </div>
    </ConditionalWrapper>
  );
}
