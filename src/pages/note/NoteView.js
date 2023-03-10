import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  createRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import fileDownload from 'js-file-download';
import clsx from 'clsx';

import ConditionalWrapper from '@/components/ConditionalWrapper';
import {
  useViewType,
  useNoteList,
  useNoteState,
  useViewState,
  deleteNote,
  translateName,
  _translateName,
  parseSender,
  convertTimeFormat,
  getFileClass,
  downloadFile,
  makeZipFile,
  emergencyMark,
} from '@/lib/note';
import { closeRooms } from '@/modules/note';
import {
  openNote,
  sendMain,
  saveFile,
  getDownloadPath,
} from '@/lib/deviceConnector';
import LoadingWrap from '@COMMON/LoadingWrap';
import NoteHeader from '@/pages/note/NoteHeader';
import { isJSONStr, openPopup } from '@/lib/common';
import ProfileBox from '@/components/common/ProfileBox';
import { openProfilePopup } from '@/lib/profileUtil';
import { convertFileSize } from '@/lib/fileUpload/coviFile';
import LayerTemplate from '@COMMON/layer/LayerTemplate';
import Progress from '@C/common/buttons/Progress';

// WYSIWYG Editor
import '@toast-ui/editor/dist/toastui-editor.css';
import { Viewer } from '@toast-ui/react-editor';

import { isBlockCheck } from '@/lib/orgchart';

function _popupResult(dispatch, message, cb) {
  openPopup(
    {
      type: 'Alert',
      message,
      ...(typeof cb !== 'undefined' && { callback: cb }),
    },
    dispatch,
  );
}

function _popup(dispatch, type = 'Alert', message, cb) {
  return new Promise(resolve => {
    openPopup(
      {
        type: 'Confirm',
        message,
        callback: resolve,
      },
      dispatch,
    );
  });
}

function _convertFileSize(fileSize) {
  if (typeof fileSize !== 'number' || fileSize <= 0) {
    return '0B';
  }
  return convertFileSize(fileSize);
}

// href={getDownloadPath({userId: loginId, accessKey: file.fileID, serviceType: file.serviceType})}
function _DrawFile({
  files = [],
  loginId,
  progressData,
  setProgressData,
  handleProgress,
  isBlockFile,
  filePermission,
}) {
  const dispatch = useDispatch();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 2021.06.09
   * TODO ???????????????, ?????????????????? ??????
   */
  const _downloadFile = useCallback(
    async opts => {
      if (isSaving === true) {
        return;
      }

      let savePath = '';
      if (DEVICE_TYPE === 'd') {
        savePath = await getDownloadPath({
          defaultFileName: opts?.fileName,
        });
      }
      if (savePath?.canceled) {
        // ????????? ?????? ????????? ???????????? ???????????? ??????
        return;
      }

      let message = covi.getDic('Msg_Save', '?????????????????????.');
      if (filePermission.download !== 'Y') {
        message = covi.getDic(
          'Block_FileDownload',
          '?????? ??????????????? ???????????? ????????????.',
        );
      } else {
        setIsSaving(true);
        try {
          const { fileName, accessKey: fileID } = opts;
          const response = await downloadFile({
            ...opts,
            downloadHandler(...args) {
              console.log('Download   ', args);
            },
          });
          if (response.status === 200) {
            if (DEVICE_TYPE === 'b') {
              fileDownload(response.data, fileName);
            } else if (DEVICE_TYPE === 'd') {
              saveFile(savePath.filePath, fileName, response.data, {
                token: fileID,
                execute: true,
                isZip: false,
              });
            }
          } else if (response.status === 204) {
            message = covi.getDic('Msg_FileExpired', '????????? ???????????????.');
          } else if (response.status === 403) {
            message = covi.getDic(
              'Block_FileDownload',
              '?????? ??????????????? ???????????? ????????????.',
            );
          }
        } catch (err) {
          if (err?.response?.status === 403) {
            message = covi.getDic(
              'Block_FileDownload',
              '?????? ??????????????? ???????????? ????????????.',
            );
          } else {
            message = covi.getDic(
              'Msg_Error',
              '????????? ??????????????????.<br/>??????????????? ??????????????????.',
            );
          }
        } finally {
          setIsSaving(false);
        }
      }
      _popupResult(dispatch, message);
    },
    [files, loginId, isSaving],
  );

  const handleAllDownLoad = async () => {
    const savePath = await getDownloadPath({ mode: 'open' });
    if (DEVICE_TYPE === 'd' && savePath?.canceled) {
      return null;
    }
    if (savePath?.filePath && !savePath?.filePaths) {
      savePath.filePaths = [savePath.filePath];
    }

    let message = covi.getDic('Msg_Save', '?????????????????????.');
    if (filePermission.download !== 'Y') {
      message = covi.getDic(
        'Block_FileDownload',
        '?????? ??????????????? ???????????? ????????????.',
      );
    } else {
      try {
        const { results, JSZip } = await makeZipFile(
          loginId,
          files,
          handleProgress,
        );
        // ?????? ????????? ???????????? ??????
        const expiredCheck = results.every(result => {
          return result.status === 204;
        });
        // ?????? ????????? ?????? ???????????? ??????
        const permissionCheck = results.every(result => {
          return result.status === 403;
        });

        if (expiredCheck) {
          message = covi.getDic('Msg_FileExpired', '????????? ???????????????.');
        } else if (permissionCheck) {
          message = covi.getDic(
            'Block_FileDownload',
            '?????? ??????????????? ???????????? ????????????.',
          );
        } else {
          if (Object.keys(JSZip?.files).length) {
            const fileName = `${results[0]?.fileName?.split('.')[0]}.zip`;
            JSZip.generateAsync({ type: 'arraybuffer' }).then(data => {
              if (DEVICE_TYPE === 'b') {
                fileDownload(data, fileName);
              } else {
                saveFile(savePath?.filePaths, fileName, data, { isZip: true });
              }
            });
          }
        }
      } catch (err) {
        if (err?.response?.status === 403) {
          message = covi.getDic(
            'Block_FileDownload',
            '?????? ??????????????? ???????????? ????????????.',
          );
        } else {
          message = covi.getDic(
            'Msg_Error',
            '????????? ??????????????????.<br/>??????????????? ??????????????????.',
          );
        }
      } finally {
        setProgressData(null);
      }
    }
    _popupResult(dispatch, message);
  };

  // < div style={{}}/>
  return (
    !isBlockFile &&
    files?.length > 0 && (
      <div className="input full">
        <label
          className="string optional ml20"
          htmlFor="user-name"
          style={{ cursor: 'inherit' }}
        >
          {covi.getDic('AttachFile', '????????????')}
          {filePermission.download === 'Y' && files.length > 1 && (
            <a
              className="Okbtn"
              onClick={progressData ? null : handleAllDownLoad}
            >
              {progressData
                ? covi.getDic('Downloading', '???????????????')
                : covi.getDic('AllSave', '????????????')}
            </a>
          )}
        </label>
        <ul className="file-list_note type02">
          {files.map((file, idx) => {
            return (
              <li
                key={`File_${idx}`}
                onClick={() => {
                  _downloadFile({
                    userId: loginId,
                    accessKey: file.fileID,
                    serviceType: file.serviceType,
                    fileName: file.fileName,
                  });
                }}
              >
                <div
                  className={clsx('file-message', getFileClass(file.extension))}
                >
                  <div className="file-type-ico"></div>
                  <div className="file-info-txt">
                    <p className="file-name">{file.fileName}</p>
                    <p className="file-size">
                      {_convertFileSize(file.fileSize)}
                    </p>
                  </div>
                  {filePermission.download === 'Y' && (
                    <a className="btn_download">
                      {covi.getDic('Download', '????????????')}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    )
  );
}

function _DrawNote({
  noteInfo,
  onUserNameClicked,
  loginId,
  progressData,
  setProgressData,
  handleProgress,
  isBlockChat,
  isBlockFile,
  filePermission,
}) {
  if (!noteInfo) {
    return null;
  }
  const viewerRef = createRef();

  const data = useMemo(() => {
    const receivedTime = convertTimeFormat(noteInfo.sendDate);
    // Sender
    const senderInfo = parseSender(noteInfo);
    const senderName = translateName(senderInfo?.sender);
    const attachFilesMargin = Array.isArray(noteInfo.files)
      ? `${noteInfo.files.length * 60}px`
      : '0px';
    return {
      senderInfo,
      senderName,
      receivedTime,
      attachFilesMargin,
    };
  }, [noteInfo]);

  useEffect(() => {
    // ?????? ????????? ?????? ????????????
    viewerRef.current?.getInstance().setMarkdown(noteInfo.context);
  }, [viewerRef, noteInfo.context]);

  return (
    <>
      <div className="send-box">
        <ul className="people">
          <li className="person" style={{ cursor: 'inherit' }}>
            <a>
              <ProfileBox
                userId={noteInfo.senderUserId}
                userName={noteInfo.senderDisplayName}
                img={noteInfo.senderPhotoPath}
                presence={noteInfo.senderPresence}
              />
              <span
                className="name"
                onClick={() =>
                  onUserNameClicked(
                    data.senderInfo?.sender.id,
                    data.senderInfo?.sender.type,
                  )
                }
              >
                {data.senderName}
              </span>
              <span className="date" style={{ maxWidth: '130px' }}>
                {data.receivedTime}
              </span>
            </a>
          </li>
        </ul>
      </div>
      <div className="receive-box">
        <ul className="people">
          <li className="person" style={{ cursor: 'inherit' }}>
            <a>
              {/* <div className="profile-photo">
                                <img src="../common/image/common/img-3.jpg" alt="" />
                                <div className="status online"></div>
                            </div> */}
              <span className="rtxt" style={{ cursor: 'auto' }}>
                {covi.getDic('Note_Recipient', '????????????')}
              </span>
              <span className="name" style={{ overflow: 'unset' }}>
                {data.senderInfo.receivers &&
                  data.senderInfo.receivers.map((receiver, i, arr) => {
                    const appendix = arr.length - 1 !== i ? ', ' : '';
                    return (
                      <span
                        key={`rcv_${i}`}
                        onClick={() =>
                          onUserNameClicked(receiver.id, receiver.type)
                        }
                      >
                        {_translateName(receiver)}
                        {appendix}
                      </span>
                    );
                  })}
              </span>
            </a>
          </li>
        </ul>
      </div>
      {/* TODO: ???????????? ???????????? ???????????? marginBottom ?????? */}
      <div
        className="Layer-Note-Con pd0"
        style={{ marginBottom: data.attachFilesMargin, paddingBottom: '140px' }}
      >
        <div className="Profile-info-input">
          <div
            className="note-txt-tit"
            style={{
              // ?????? ????????? ????????? width ???????????? ????????? ????????????
              maxWidth: '100%',
              height: 'unset',
              marginTop: '12px',
              minHeight: '40px',
              lineHeight: 'unset',
              userSelect: 'text',
            }}
          >
            <span style={{ lineHeight: '1.5' }}>
              {noteInfo?.emergency === 'Y' && emergencyMark}
              {isBlockChat
                ? covi.getDic('BlockChat', '????????? ????????? ?????????.')
                : noteInfo.subject}
            </span>
          </div>
          {!isBlockChat && (
            <div
              className="note-txt-cont"
              style={{
                userSelect: 'text',
                minHeight: '50px',
              }}
            >
              {/* {noteInfo.context} */}
              {/* <Viewer ref={viewerRef}/> */}
              <Viewer ref={viewerRef} />
            </div>
          )}
          <_DrawFile
            files={noteInfo.files}
            loginId={loginId}
            progressData={progressData}
            setProgressData={setProgressData}
            handleProgress={handleProgress}
            isBlockFile={isBlockFile}
            filePermission={filePermission}
          />
        </div>
      </div>
    </>
  );
}

/**
 * ???????????? ?????? ?????? ??? ???
 *
 * ??? ?????? ?????? / ????????????
 * /nw/note/...?reply=true
 *
 * reply=true??????
 * sessionStorage.get('reply_targets')
 * [target1, target2, ...]
 * ???????????? ?????? ????????? ?????? ??????
 *
 */
export default function NoteView({ match }) {
  const dispatch = useDispatch();
  const [viewType] = useViewType(match?.params?.viewType);
  const { removeNote } = useNoteList({ viewType });
  const [_, setViewState] = useViewState();
  const loginId = useSelector(({ login }) => login.id);

  const [progressData, setProgressData] = useState(null);
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const [isBlockChat, setIsBlockChat] = useState(false);
  const [isBlockFile, setIsBlockFile] = useState(false);

  const filePermission = useSelector(({ login }) => login.filePermission);

  /**
   * @param {*} load
   * @param {*} total
   */
  const handleProgress = useCallback((load, total) => {
    setProgressData({ load, total });
  }, []);

  const finishProgress = useCallback(() => {
    setProgressData(null);
  }, []);

  // Electron subwindow checker
  const isNewWin =
    window.opener !== null || (match && match.url.indexOf('/nw/') > -1);
  // ????????????(noteId from uri)
  let noteId = null;
  if (match && match.params) {
    if (match.params.noteId) {
      noteId = match.params.noteId;
    }
  }

  // const { data: noteInfo, loading, mutate } = useNoteState(noteId);
  const { data: noteInfo, mutate, error, isValidating } = useNoteState(noteId);

  useEffect(() => {
    if (noteInfo && !error && !isValidating) {
      // ?????? ?????? ???????????? ???????????? ????????? readFlag ???????????? ??????
      sendMain('sync-note', {
        viewType,
        op: 'read',
        noteId: noteInfo.noteId,
      });
    }
  }, [noteInfo, error, isValidating, viewType]);

  const handleClose = useCallback(() => {
    mutate(null, false);
    DEVICE_TYPE === 'd' && window.close();
  }, []);

  const handleDeleteNote = useCallback(async () => {
    try {
      const result = await _popup(
        dispatch,
        'Confirm',
        covi.getDic('Msg_Note_DeleteConfirm', '?????? ????????? ?????????????????????????'),
      );
      if (result === false) {
        return;
      }
      const { data } = await deleteNote({ viewType, noteId: noteInfo.noteId });
      if (data && data.status === 'SUCCESS') {
        if (isNewWin) {
          // TODO - emit IPC :remove note
          sendMain('sync-note', {
            viewType,
            op: 'delete',
            noteId: noteInfo.noteId,
          });
        } else {
          removeNote(viewType, noteInfo.noteId);
        }
        _popupResult(
          dispatch,
          covi.getDic('Msg_Note_DeleteSuccess', '????????? ?????????????????????.'),
          () => {
            if (isNewWin) {
              window.close();
            } else {
              mutate(null, false);
            }
          },
        );
      } else {
        throw new Error('Delete Note Failed with response: ', data);
      }
    } catch (err) {
      _popupResult(
        dispatch,
        covi.getDic(
          'Msg_Note_DeleteFail',
          '????????? ???????????? ???????????????. ?????? ????????? ?????????',
        ),
      );
    }
  }, [noteInfo, viewType]);

  const openProfile = useCallback(
    (userId, type) => {
      // ???????????? ????????? ??????????????? X
      type === 'U' && openProfilePopup(dispatch, userId);
    },
    [dispatch],
  );

  // ?????? ????????? ??????
  function _openNewNote(dispatch, type, noteInfo) {
    if (DEVICE_TYPE === 'b') {
      // ???????????? - viewState(global state)????????? ??? ??????
      dispatch(closeRooms());
      setViewState({ type, noteInfo });
    } else {
      // ???????????? - ??? ????????? ??????
      openNote({ type, noteId: noteInfo.noteId });
    }
  }

  useEffect(() => {
    // Clean up
    return () => {
      mutate(null, false);
    };
  }, []);

  useEffect(() => {
    if (!isValidating) {
      // validation ???????????? ????????? ??????????????? ???????????? ??? ???????????? ????????????
      if (error || !noteInfo) {
        _popupResult(
          dispatch,
          covi.getDic('Msg_Note_NotFound', '????????? ????????? ??? ????????????.'),
          () => {
            isNewWin && window.close();
          },
        );
      }
    }
  }, [noteInfo, error, isValidating]);

  useEffect(() => {
    if (noteInfo && chineseWall?.length) {
      const senderInfo = isJSONStr(noteInfo.senderInfo)
        ? JSON.parse(noteInfo.senderInfo)
        : noteInfo.senderInfo;
      const targetInfo = {
        ...senderInfo,
        id: senderInfo?.sender,
      };

      const { blockChat, blockFile } = isBlockCheck({
        targetInfo,
        chineseWall: chineseWall,
      });
      setIsBlockChat(blockChat);
      setIsBlockFile(blockFile);
    }
  }, [noteInfo, chineseWall]);

  // ?????????
  if (!noteInfo && !error) {
    return <LoadingWrap />;
  }

  return (
    <>
      <ConditionalWrapper
        wrapIf={isNewWin}
        wrapper={children => <div className="Chat Newwindow">{children}</div>}
      >
        <NoteHeader onClose={handleClose} />
        <Scrollbars
          className="noteWrap Layer-Notepop"
          style={{ zIndex: 'unset', overflow: 'hidden' }}
          autoHide={false}
        >
          <_DrawNote
            noteInfo={noteInfo}
            onUserNameClicked={openProfile}
            loginId={loginId}
            progressData={progressData}
            setProgressData={setProgressData}
            handleProgress={handleProgress}
            isBlockChat={isBlockChat}
            isBlockFile={isBlockFile}
            filePermission={filePermission}
          />
        </Scrollbars>
        {progressData && (
          <div className="progress-sticke">
            <div style={{ width: '100%' }}>
              <span>
                {`${covi.getDic(
                  'Downloading',
                  '???????????????',
                )} ( ${convertFileSize(progressData.load)} / ${_convertFileSize(
                  progressData.total,
                )} )`}
              </span>
            </div>
            <div style={{ width: '100%' }}>
              <Progress
                id="progress"
                load={progressData.load}
                total={progressData.total}
                handleFinish={finishProgress}
              ></Progress>
            </div>
          </div>
        )}

        <div className="layer-bottom-btn-wrap right">
          <a className="btn_delete" onClick={handleDeleteNote}>
            {covi.getDic('Delete', '??????')}
          </a>
          <a
            className="Btn-pointcolor-mini"
            onClick={() => {
              if (isBlockChat || isBlockFile) {
                _popupResult(
                  dispatch,
                  covi.getDic('BlockChat', '????????? ????????? ?????????.'),
                );
              } else {
                _openNewNote(dispatch, 'reply', noteInfo);
              }
            }}
          >
            {covi.getDic('Reply', '??????')}
          </a>
          <a
            className="Btn-pointcolor-mini"
            onClick={() => {
              if (isBlockChat || isBlockFile) {
                _popupResult(
                  dispatch,
                  covi.getDic('BlockChat', '????????? ????????? ?????????.'),
                );
              } else {
                _openNewNote(dispatch, 'replyAll', noteInfo);
              }
            }}
          >
            {covi.getDic('ReplyAll', '????????????')}
          </a>
          <a
            className="Btn-pointcolor-mini"
            onClick={() => {
              if (isBlockChat || isBlockFile) {
                _popupResult(
                  dispatch,
                  covi.getDic('BlockChat', '????????? ????????? ?????????.'),
                );
              } else {
                _openNewNote(dispatch, 'forward', noteInfo);
              }
            }}
          >
            {covi.getDic('Forward', '??????')}
          </a>
        </div>
      </ConditionalWrapper>
      {isNewWin && <LayerTemplate />}
    </>
  );
}
