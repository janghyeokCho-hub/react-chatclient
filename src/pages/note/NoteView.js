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

import { setChineseWall } from '@/modules/login';
import { getChineseWall, isBlockCheck } from '@/lib/orgchart';
import { isMainWindow } from '@/lib/deviceConnector';
import { getConfig } from '@/lib/util/configUtil';

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
}) {
  const dispatch = useDispatch();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 2021.06.09
   * TODO 사이냅뷰어, 다운로드금지 적용
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
      // 지정된 파일 경로가 없을경우 다운로드 중단
      if (savePath?.canceled) return;

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
            _popupResult(dispatch, covi.getDic('Msg_Save', '저장되었습니다.'));
          }
        } else if (response.status === 204) {
          _popupResult(
            dispatch,
            covi.getDic('Msg_FileExpired', '만료된 파일입니다.'),
          );
        } else if (response.status === 403) {
          _popupResult(
            dispatch,
            covi.getDic('Msg_FilePermission', '권한이 없는 파일입니다.'),
          );
        }
      } catch (err) {
        console.log('FileSave Error   ', err);
        _popupResult(
          dispatch,
          covi.getDic(
            'Msg_Error',
            '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
          ),
        );
      } finally {
        setIsSaving(false);
      }
    },
    [files, loginId, isSaving],
  );

  const handleAllDownLoad = async () => {
    const savePath = await getDownloadPath({ mode: 'open' });
    if (DEVICE_TYPE === 'd' && savePath?.canceled) return null;
    if (savePath?.filePath && !savePath?.filePaths) {
      savePath.filePaths = [savePath.filePath];
    }

    try {
      const { results, JSZip } = await makeZipFile(
        loginId,
        files,
        handleProgress,
      );
      let check = true;
      let message = '';

      // 모두 만료된 파일인가 확인
      const expiredCheck = results.every(result => {
        return result.status === 204;
      });
      // 모두 권한이 없는 파일인가 확인
      const permissionCheck = results.every(result => {
        return result.status === 403;
      });

      if (expiredCheck) {
        check = false;
        message = covi.getDic('Msg_FileExpired', '만료된 파일입니다.');
      } else if (permissionCheck) {
        check = false;
        message = covi.getDic('Msg_FilePermission', '권한이 없는 파일입니다.');
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
      _popupResult(
        dispatch,
        check ? covi.getDic('Msg_Save', '저장되었습니다.') : message,
      );
    } catch (err) {
      _popupResult(
        dispatch,
        covi.getDic(
          'Msg_Error',
          '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
        ),
      );
    } finally {
      setProgressData(null);
    }
  };

  // < div style={{}}/>
  return (
    !isBlockFile &&
    files?.length && (
      <div className="input full">
        <label
          className="string optional ml20"
          htmlFor="user-name"
          style={{ cursor: 'inherit' }}
        >
          {covi.getDic('AttachFile', '첨부파일')}
          {files.length > 1 && (
            <a
              className="Okbtn"
              onClick={progressData ? null : handleAllDownLoad}
            >
              {progressData
                ? covi.getDic('Downloading', '다운로드중')
                : covi.getDic('AllSave', '일괄저장')}
            </a>
          )}
        </label>
        <ul className="file-list_note type02">
          {files.map((file, idx) => {
            return (
              <li
                key={`File_${idx}`}
                onClick={() =>
                  _downloadFile({
                    userId: loginId,
                    accessKey: file.fileID,
                    serviceType: file.serviceType,
                    fileName: file.fileName,
                  })
                }
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
                  <a className="btn_download">
                    {covi.getDic('Download', '다운로드')}
                  </a>
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
    // 쪽지 전환시 뷰어 업데이트
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
                {covi.getDic('Note_Recipient', '받는사람')}
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
      {/* TODO: 파일첨부 개수만큼 자동으로 marginBottom 조절 */}
      <div
        className="Layer-Note-Con pd0"
        style={{ marginBottom: data.attachFilesMargin, paddingBottom: '140px' }}
      >
        <div className="Profile-info-input">
          <div
            className="note-txt-tit"
            style={{
              // 제목 내용이 허용된 width 초과하면 초과분 생략처리
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
                ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
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
          />
        </div>
      </div>
    </>
  );
}

/**
 * 새창으로 쪽지 발신 열 때
 *
 * 새 쪽지 발신 / 답장모드
 * /nw/note/...?reply=true
 *
 * reply=true일때
 * sessionStorage.get('reply_targets')
 * [target1, target2, ...]
 * 읽어와서 발송 대상에 자동 추가
 *
 */
export default function NoteView({ match }) {
  const dispatch = useDispatch();
  const [viewType] = useViewType(match?.params?.viewType);
  const { removeNote } = useNoteList({ viewType });
  const [_, setViewState] = useViewState();
  const loginId = useSelector(({ login }) => login.id);

  const [progressData, setProgressData] = useState(null);
  const userChineseWall = useSelector(({ login }) => login.chineseWall);
  const [chineseWallState, setChineseWallState] = useState([]);
  const [isBlockChat, setIsBlockChat] = useState(false);
  const [isBlockFile, setIsBlockFile] = useState(false);

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
  // 새창모드(noteId from uri)
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
      // 쪽지 로딩 완료하면 메인창의 쪽지함 readFlag 업데이트 요청
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
        covi.getDic('Msg_Note_DeleteConfirm', '정말 쪽지를 삭제하시겠습니까?'),
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
          covi.getDic('Msg_Note_DeleteSuccess', '쪽지가 삭제되었습니다.'),
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
          '쪽지를 삭제하지 못했습니다. 다시 시도해 주세요',
        ),
      );
    }
  }, [noteInfo, viewType]);

  const openProfile = useCallback(
    (userId, type) => {
      // 그룹이름 클릭시 프로필열기 X
      type === 'U' && openProfilePopup(dispatch, userId);
    },
    [dispatch],
  );

  // 쪽지 발신창 열기
  function _openNewNote(dispatch, type, noteInfo) {
    if (DEVICE_TYPE === 'b') {
      // 브라우저 - viewState(global state)통해서 뷰 전환
      dispatch(closeRooms());
      setViewState({ type, noteInfo });
    } else {
      // 데스크탑 - 새 윈도우 생성
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
      // validation 단계에서 에러가 발생했거나 서버에서 빈 데이터를 받은경우
      if (error || !noteInfo) {
        _popupResult(
          dispatch,
          covi.getDic('Msg_Note_NotFound', '쪽지를 가져올 수 없습니다.'),
          () => {
            isNewWin && window.close();
          },
        );
      }
    }
  }, [noteInfo, error, isValidating]);

  useEffect(() => {
    const getChineseWallList = async () => {
      const { result, status } = await getChineseWall({
        userId: loginId,
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

    if (userChineseWall?.length) {
      setChineseWallState(userChineseWall);
    } else {
      const useChineseWall = getConfig('UseChineseWall', false);
      if (useChineseWall) {
        getChineseWallList();
      } else {
        setChineseWallState([]);
      }
    }

    return () => {
      setChineseWallState([]);
    };
  }, []);

  useEffect(() => {
    if (noteInfo && chineseWallState?.length) {
      const senderInfo = isJSONStr(noteInfo.senderInfo)
        ? JSON.parse(noteInfo.senderInfo)
        : noteInfo.senderInfo;
      const targetInfo = {
        ...senderInfo,
        id: senderInfo?.sender,
      };

      const { blockChat, blockFile } = isBlockCheck({
        targetInfo,
        chineseWall: chineseWallState,
      });
      setIsBlockChat(blockChat);
      setIsBlockFile(blockFile);
    }
  }, [noteInfo, chineseWallState]);

  // 로딩중
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
          />
        </Scrollbars>
        {progressData && (
          <div className="progress-sticke">
            <div style={{ width: '100%' }}>
              <span>
                {`${covi.getDic(
                  'Downloading',
                  '다운로드중',
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
            {covi.getDic('Delete', '삭제')}
          </a>
          <a
            className="Btn-pointcolor-mini"
            onClick={() => {
              if (isBlockChat || isBlockFile) {
                _popupResult(
                  dispatch,
                  covi.getDic('BlockChat', '차단된 메시지 입니다.'),
                );
              } else {
                _openNewNote(dispatch, 'reply', noteInfo);
              }
            }}
          >
            {covi.getDic('Reply', '답장')}
          </a>
          <a
            className="Btn-pointcolor-mini"
            onClick={() => {
              if (isBlockChat || isBlockFile) {
                _popupResult(
                  dispatch,
                  covi.getDic('BlockChat', '차단된 메시지 입니다.'),
                );
              } else {
                _openNewNote(dispatch, 'replyAll', noteInfo);
              }
            }}
          >
            {covi.getDic('ReplyAll', '전체답장')}
          </a>
          <a
            className="Btn-pointcolor-mini"
            onClick={() => {
              if (isBlockChat || isBlockFile) {
                _popupResult(
                  dispatch,
                  covi.getDic('BlockChat', '차단된 메시지 입니다.'),
                );
              } else {
                _openNewNote(dispatch, 'forward', noteInfo);
              }
            }}
          >
            {covi.getDic('Forward', '전달')}
          </a>
        </div>
      </ConditionalWrapper>
      {isNewWin && <LayerTemplate />}
    </>
  );
}
