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
     * ????????? viewType !== 'send'?????? revalidate ????????????
     */
    !isNewWin && setNoteList(() => getNoteList(`/note/list/send`));
  }
  /**
   * 2021.05.26
   *
   * Electron window??? ?????? ?????? url????????? ??????/??????/?????? ????????? ????????????.
   * => url ?????? ????????? viewState??? initial data??? ??????
   * ??????: useEffect hook?????? ?????? ???????????? ????????? ????????? ?????? ????????? ?????????.
   *  */
  const [viewState, setViewState, clearViewState] = useViewState(params);

  /**
   * 2021.05.10
   *
   * !! Important !!
   * ?????? ????????? ?????? ?????? ????????? ??????????????? state??? ????????? ????????? ????????? ?????? (?????? ????????? ????????????)
   */
  const { data: targets, mutate: setTargets } = useTargetState([]);
  const [files, setFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  const headerTitle = useMemo(() => {
    const { type } = viewState;
    // TODO ????????? ??????
    if (type === 'reply') {
      return covi.getDic('Msg_Note_Reply', '????????????');
    } else if (type === 'replyAll') {
      return covi.getDic('Msg_Note_ReplyAll', '??????????????????');
    } else if (type === 'forward') {
      return covi.getDic('Msg_Note_Forward', '????????????');
    } else {
      return covi.getDic('Msg_Note_Send', '?????????');
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
                 * => ?????? ??????
                 * receiver.id !== myInfo?.id
                 * => ???????????? ??????
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
        // ??????????????? ???????????? ?????? ??????
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
    // ??????, ?????? ???????????? ????????? ??????
    targets.forEach(target => {
      if (target.type === 'U') {
        // ??????: '{id}|{kobKey}'
        receiveUser.push(
          `${target.id}${NOTE_RECEIVER_SEPARATOR}${target.jobKey}`,
        );
      } else if (target.type === 'G') {
        // ??????: '{id}|{companyCode}'
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
        covi.getDic('Msg_Note_EnterRecipient', '??????????????? ???????????????.'),
      );
      return;
    }

    if (!title.current.value.trim().length) {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Note_EnterTitle', '????????? ???????????????.'),
      );
      return;
    } else if (title.current.value.length > 1900) {
      _popupResult(
        dispatch,
        covi.getDic(
          'Msg_Note_TitleExceeded',
          '????????? 1900??? ????????? ???????????????.',
        ),
      );
      return;
    }

    if (!_context.trim().length) {
      _popupResult(
        dispatch,
        covi.getDic('Msg_Note)EnterContext', '????????? ???????????????.'),
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

      // ?????? ???????????? ???????????? ????????????
      if (typeof data?.result !== 'undefined') {
        if (DEVICE_TYPE === 'b') {
          /**
           * 2021.05.17
           * ????????? ?????? ????????? ???????????? ?????? ???????????? ??????
           * (???????????? swr??? auto revalidate ?????? or ??? ????????? ????????????)
           *  */
          revalidateNote();
        } else if (DEVICE_TYPE === 'd') {
          // ????????? ???????????? ?????????
          sendMain('sync-note', {
            viewType: 'send',
            op: 'refetch',
            result: data,
          });
        }
        _popupResult(
          dispatch,
          covi.getDic('Msg_Note_SendSuccess', '?????? ????????? ??????????????????.'),
          () => {
            if (DEVICE_TYPE === 'b') {
              // ???????????? ??? ??????
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
          covi.getDic('Msg_Note_SendFail', '?????? ????????? ??????????????????.'),
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
            <p>{covi.getDic('Note_Recipient', '????????????')}</p>
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
                  {covi.getDic('Title', '??????')}
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
                    '????????? ???????????????.',
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
                  {covi.getDic('Context', '??????')}
                </label>
                {/* <textarea className="string optional" name="" id="" cols="30" rows="10" placeholder="????????? ???????????????." ref={context} style={{ cursor: 'text', resize: 'both', display: 'none' }}></textarea> */}
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
                  {covi.getDic('AttachFile', '????????????')}
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
              covi.getDic('Msg_Note_Send', '?????????')
            )}
          </a>
        </div>
      </div>
    </ConditionalWrapper>
  );
}
