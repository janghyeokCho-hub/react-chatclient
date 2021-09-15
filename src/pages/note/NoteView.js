import React, { useEffect, useCallback, useState, useMemo, createRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import fileDownload from 'js-file-download'
import clsx from 'clsx';

import ConditionalWrapper from '@/components/ConditionalWrapper';
import { useViewType, useNoteList, useNoteState, useViewState, deleteNote, translateName, _translateName, parseSender, convertTimeFormat, getFileClass, downloadFile, emergencyMark } from '@/lib/note';
import { closeRooms } from '@/modules/note';
import { openNote, sendMain, saveFile, getDownloadPath } from '@/lib/deviceConnector';
import LoadingWrap from '@COMMON/LoadingWrap';
import NoteHeader from '@/pages/note/NoteHeader';
import { openPopup } from '@/lib/common';
import ProfileBox from '@/components/common/ProfileBox';
import { openProfilePopup } from '@/lib/profileUtil';
import { convertFileSize } from '@/lib/fileUpload/coviFile';
import LayerTemplate from '@COMMON/layer/LayerTemplate';

// WYSIWYG Editor
import '@toast-ui/editor/dist/toastui-editor.css';
import { Viewer } from '@toast-ui/react-editor';

// 텍스트 줄넘김 기본 css
const plainTextStyle = {
    /**
      * 공백이 긴 경우 메시지가 auto newline 무시하는 현상 방지
      *
      * !! NOTE !!
      * 현재 Electron의 chromium 버전에서는 break-spaces 지원 안함
      * => 연속된 공백을 자동 newline 처리 대신 한칸의 공백으로 표현됨
      * 추후개선 필요
      */
    whiteSpace: 'break-spaces',
    // '!', '$', '(', ')' 등 break-all 스타일에서 auto newline 무시하는 문자 대응
    wordBreak: 'break-word',
};

function _popupResult(dispatch, message, cb) {
    openPopup(
        {
            type: 'Alert',
            message,
            ...(typeof cb !== 'undefined' && { callback: cb })
        },
        dispatch
    );
}

function _popup(dispatch, type = 'Alert', message, cb) {
    return new Promise((resolve) => {
        openPopup(
            {
                type: 'Confirm',
                message,
                callback: resolve
            },
            dispatch
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
function _DrawFile({ files = [], loginId }) {
    const dispatch = useDispatch();
    const [isSaving, setIsSaving] = useState(false);

    /**
     * 2021.06.09
     * TODO 사이냅뷰어, 다운로드금지 적용
     */
    const _downloadFile = useCallback(async (opts) => {
        if (isSaving === true) {
            return;
        }
        setIsSaving(true);
        try {
            const { fileName, accessKey: fileID } = opts;
            const response = await downloadFile({
                ...opts,
                downloadHandler(...args) {
                    console.log('Download   ', args);
                }
            });
            if (response.status === 200) {
                if (DEVICE_TYPE === 'b') {
                    fileDownload(response.data, fileName);
                } else if (DEVICE_TYPE === 'd') {
                    const savePath = await getDownloadPath();
                    if (savePath === null) {
                        // 지정된 파일 경로가 없을경우 다운로드 중단
                        return;
                    }
                    saveFile(savePath, fileName, response.data, {
                        token: fileID,
                        execute: true
                    });
                    _popupResult(dispatch, covi.getDic('Msg_Save'));
                }
            } else if (response.status === 204) {
                _popupResult(dispatch, covi.getDic('Msg_FileExpired'));
            } else if (response.status === 403) {
                _popupResult(dispatch, covi.getDic('Msg_FilePermission'));
            }
        } catch (err) {
            console.log('FileSave Error   ', err);
            _popupResult(dispatch, covi.getDic('Msg_Error'));
        } finally {
            setIsSaving(false);
        }
    }, [files, loginId, isSaving]);
    // < div style={{}}/>
    return (files && files.length > 0) && (
        <div className="input full">
            <label className="string optional ml20" htmlFor="user-name" style={{ cursor: 'inherit' }}>{covi.getDic('AttachFile')}</label>
            <ul className="file-list_note type02">
                {files.map((file, idx) => {
                    return (
                        <li key={`File_${idx}`} onClick={() => _downloadFile({ userId: loginId, accessKey: file.fileID, serviceType: file.serviceType, fileName: file.fileName })}>
                            <div className={clsx("file-message", getFileClass(file.extension))}>
                                <div className="file-type-ico"></div>
                                <div className="file-info-txt">
                                    <p className="file-name">{file.fileName}</p>
                                    <p className="file-size">{_convertFileSize(file.fileSize)}</p>
                                </div>
                                <a className="btn_download">{covi.getDic('Download')}</a>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function _DrawNote({ noteInfo, onUserNameClicked, loginId }) {
    if (!noteInfo) {
        return null;
    }
    const viewerRef = createRef();

    const data = useMemo(() => {
        const receivedTime = convertTimeFormat(noteInfo.sendDate);
        // Sender
        const senderInfo = parseSender(noteInfo);
        const senderName = translateName(senderInfo.sender);
        const attachFilesMargin = Array.isArray(noteInfo.files) ? `${noteInfo.files.length * 60}px` : '0px';
        return {
            senderInfo,
            senderName,
            receivedTime,
            attachFilesMargin
        };
    }, [noteInfo]);

    useEffect(() => {
        // 쪽지 전환시 뷰어 업데이트    
        viewerRef.current.getInstance().setMarkdown(noteInfo.context);
    }, [viewerRef, noteInfo.context]);

    return <>
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
                        <span className="name" onClick={() => onUserNameClicked(data.senderInfo.sender.id, data.senderInfo.sender.type)}>{data.senderName}</span>
                        <span className="date" style={{ maxWidth: '130px' }}>{data.receivedTime}</span>
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
                        <span className="rtxt" style={{ cursor: 'auto', ...plainTextStyle }}>{covi.getDic('Note_Recipient', '받는사람')}</span>
                        <span className="name" style={{ overflow: 'unset', ...plainTextStyle }}>
                            {data.senderInfo.receivers && data.senderInfo.receivers.map((receiver, i, arr) => {
                                const appendix = (arr.length - 1) !== i ? ', ' : '';
                                return (
                                    <span key={`rcv_${i}`} onClick={() => onUserNameClicked(receiver.id, receiver.type)}>
                                        {_translateName(receiver)}
                                        {appendix}
                                    </span>
                                )
                            })}
                        </span>
                    </a>
                </li>
            </ul>
        </div>
        {/* TODO: 파일첨부 개수만큼 자동으로 marginBottom 조절 */}
        <div className="Layer-Note-Con pd0" style={{ marginBottom: data.attachFilesMargin, paddingBottom: '140px' }}>
            <div className="Profile-info-input">
                <div className="note-txt-tit" style={{
                    // 제목 내용이 허용된 width 초과하면 초과분 생략처리
                    maxWidth: '100%',
                    height: 'unset',
                    marginTop: '12px',
                    minHeight: '40px',
                    lineHeight: 'unset',
                    userSelect: 'text'
                }}>
                    <span style={{ lineHeight: '1.5', ...plainTextStyle }}>
                        {noteInfo?.emergency === 'Y' && emergencyMark}
                        {noteInfo.subject}
                    </span>
                </div>
                <div className="note-txt-cont" style={{
                    userSelect: 'text',
                    ...plainTextStyle
                }}>
                    {/* {noteInfo.context} */}
                    {/* <Viewer ref={viewerRef}/> */}
                    <Viewer ref={viewerRef} />
                </div>
                <_DrawFile files={noteInfo.files} loginId={loginId} />
            </div>
        </div>
    </>;
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

    // Electron subwindow checker
    const isNewWin = window.opener !== null || (match && match.url.indexOf('/nw/') > -1);
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
                noteId: noteInfo.noteId
            });
        }
    }, [noteInfo, error, isValidating, viewType]);

    const handleClose = useCallback(() => {
        mutate(null, false);
        DEVICE_TYPE === 'd' && window.close();
    }, []);

    const handleDeleteNote = useCallback(async () => {
        try {
            const result = await _popup(dispatch, 'Confirm', covi.getDic('Msg_Note_DeleteConfirm'));
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
                        noteId: noteInfo.noteId
                    });
                } else {
                    removeNote(viewType, noteInfo.noteId);
                }
                _popupResult(dispatch, covi.getDic('Msg_Note_DeleteSuccess', '쪽지가 삭제되었습니다.'), () => {
                    if (isNewWin) {
                        window.close();
                    } else {
                        mutate(null, false);
                    }
                });
            } else {
                throw new Error('Delete Note Failed with response: ', data);
            }
        } catch (err) {
            _popupResult(dispatch, covi.getDic('Msg_Note_DeleteFail', '쪽지를 삭제하지 못했습니다. 다시 시도해 주세요'));
        }
    }, [noteInfo, viewType]);

    const openProfile = useCallback((userId, type) => {
        // 그룹이름 클릭시 프로필열기 X
        type === 'U' && openProfilePopup(dispatch, userId);
    }, [dispatch]);

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
        }
    }, []);

    useEffect(() => {
        if (!isValidating) {
            // validation 단계에서 에러가 발생했거나 서버에서 빈 데이터를 받은경우
            if (error || !noteInfo) {
                _popupResult(dispatch, covi.getDic('Msg_Note_NotFound', '쪽지를 가져올 수 없습니다.'), () => {
                    isNewWin && window.close();
                });
            }
        }
    }, [noteInfo, error, isValidating]);

    // 로딩중
    if (!noteInfo && !error) {
        return <LoadingWrap />;
    }

    return (
        <>
            <ConditionalWrapper wrapIf={isNewWin} wrapper={(children) => <div className="Chat Newwindow">{children}</div>}>
                <NoteHeader onClose={handleClose} />
                <Scrollbars className="noteWrap Layer-Notepop" style={{ zIndex: 'unset', overflow: 'hidden' }} autoHide={false} >
                    <_DrawNote noteInfo={noteInfo} onUserNameClicked={openProfile} loginId={loginId} />
                </Scrollbars>
                <div className="layer-bottom-btn-wrap right">
                    <a className="btn_delete" onClick={handleDeleteNote}>{covi.getDic('Delete')}</a>
                    <a className="Btn-pointcolor-mini" onClick={() => _openNewNote(dispatch, 'reply', noteInfo)}>{covi.getDic('Reply', '답장')}</a>
                    <a className="Btn-pointcolor-mini" onClick={() => _openNewNote(dispatch, 'replyAll', noteInfo)}>{covi.getDic('ReplyAll', '전체답장')}</a>
                    <a className="Btn-pointcolor-mini" onClick={() => _openNewNote(dispatch, 'forward', noteInfo)}>{covi.getDic('Forward', '전달')}</a>
                </div>
            </ConditionalWrapper>
            {isNewWin && <LayerTemplate />}
        </>
    );
}