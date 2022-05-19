import React, { useMemo, useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import clsx from 'clsx';
import { Scrollbars } from 'react-custom-scrollbars';
import { useSelector, useDispatch } from 'react-redux';
import produce from 'immer';
import useOffset from '@/hooks/useOffset';
import { isJSONStr, openPopup } from '@/lib/common';
import { closeRooms } from '@/modules/note';
import { openNote } from '@/lib/deviceConnector';
import {
  useNoteState,
  useViewState,
  useNoteList,
  deleteNote,
  archiveNote,
  setFavorite,
  translateName,
  parseSender,
  convertTimeFormat,
  emergencyMark,
} from '@/lib/note';
import RightContextMenu from '@/components/common/popup/RightConxtMenu';
import ProfileBox from '@/components/common/ProfileBox';
import { setChineseWall } from '@/modules/login';
import { getChineseWall, isBlockCheck } from '@/lib/orgchart';
import { isMainWindow } from '@/lib/deviceConnector';

function popupResult(dispatch, message) {
  openPopup(
    {
      type: 'Alert',
      message,
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

function _NoteItem({ note, viewType, history, blockChat, blockFile }) {
  const dispatch = useDispatch();
  const deviceViewType = useSelector(({ room }) => room.viewType);
  const { mutate: setNoteList, readNote } = useNoteList({ viewType });
  const { mutateNote } = useNoteState();
  const [_, setViewState, clearViewState] = useViewState();

  // 쪽지 발신창 열기
  async function _openNewNote(
    dispatch,
    type,
    noteInfo,
    { viewer = false, newWin = false } = {},
  ) {
    if (DEVICE_TYPE === 'b' || newWin === false) {
      // 대화방/채널방 닫기
      dispatch(closeRooms());
      // 쪽지 state 세팅
      const _noteInfo = await mutateNote(noteInfo.noteId, false);
      if (type === 'receive' || viewer === true) {
        // 이전 쪽지 뷰 닫기
        clearViewState();
        // update readFlag of note in noteList
        readNote(viewType, noteInfo.noteId);
      } else {
        // 확장모드 쪽지열기 - viewState(global state)통해서 뷰 전환
        setViewState({ type, noteInfo: _noteInfo });
      }
    } else {
      // 데스크탑 - 새 윈도우 생성
      openNote({ type, noteId: noteInfo.noteId, viewType });
    }
  }

  // sendDate format
  const noteTime = useMemo(() => convertTimeFormat(note.sendDate), [note]);

  const menus = useMemo(() => {
    const isFavorite = note.favorites === '1';
    const favoriteMenu = {
      code: isFavorite ? 'delFavoriteNote' : 'addFavoriteNote',
      sop: isFavorite ? 'D' : 'C',
      successMessage: isFavorite
        ? covi.getDic(
            'Msg_Note_FavoriteDeleteSuccess',
            '즐겨찾기에서 삭제했습니다.',
          )
        : covi.getDic(
            'Msg_Note_FavoriteCreateSuccess',
            '즐겨찾기에 추가되었습니다.',
          ),
      name: isFavorite
        ? covi.getDic('Msg_Note_FavoriteDelete', '즐겨찾기 삭제')
        : covi.getDic('Msg_Note_FavoriteCreate', '즐겨찾기'),
    };
    const isDesktop = DEVICE_TYPE === 'd';
    const _menus = [
      {
        code: 'openNote',
        isline: false,
        onClick() {
          // 데스크탑: 확장모드인 경우 쪽지 읽기만 확장뷰로 제공
          _openNewNote(dispatch, 'receive', note, {
            newWin: deviceViewType === 'S',
          });
        },
        name: covi.getDic('Msg_Note_Open', '열기'),
      },
      (!blockChat || !blockFile) && {
        code: 'replyNote',
        isline: false,
        onClick() {
          // 데스크탑은 항상 새창열기
          _openNewNote(dispatch, 'reply', note, { newWin: isDesktop });
        },
        name: covi.getDic('Msg_Note_Reply', '답장하기'),
      },
      (!blockChat || !blockFile) && {
        code: 'forwardNote',
        isline: false,
        onClick() {
          dispatch(closeRooms());
          // 데스크탑은 항상 새창열기
          _openNewNote(dispatch, 'forward', note, { newWin: isDesktop });
        },
        name: covi.getDic('Msg_Note_Forward', '전달하기'),
      },
      {
        code: favoriteMenu.code,
        isline: false,
        async onClick() {
          // todo
          try {
            const { data } = await setFavorite({
              noteId: note.noteId,
              sop: favoriteMenu.sop,
            });
            if (data && data.status === 'SUCCESS') {
              // update state
              setNoteList(notes => {
                const updated = produce(notes, draft => {
                  const target = notes.findIndex(n => n.noteId === note.noteId);
                  if (target !== -1) {
                    draft[target].favorites =
                      notes[target].favorites === '1' ? '2' : '1';
                  } else {
                    console.log('Not Found');
                  }
                });
                return updated;
              }, false);
              popupResult(dispatch, favoriteMenu.successMessage);
            } else {
              throw new Error('Favorite Note Failed with response: ', data);
            }
          } catch (err) {
            popupResult(
              dispatch,
              covi.getDic(
                'Msg_Note_FavoriteFail',
                '즐겨찾기 처리에 실패했습니다. 다시 시도해주세요',
              ),
            );
          }
        },
        name: favoriteMenu.name,
      },
      {
        code: 'deleteNote',
        isline: false,
        async onClick() {
          try {
            const result = await _popup(
              dispatch,
              'Confirm',
              covi.getDic(
                'Msg_Note_DeleteConfirm',
                '정말 쪽지를 삭제하시겠습니까?',
              ),
            );
            if (result === false) {
              return;
            }
            const { data } = await deleteNote({
              viewType,
              noteId: note.noteId,
            });
            if (data && data.status === 'SUCCESS') {
              setNoteList(prevNoteList => {
                return prevNoteList.filter(
                  _note => _note.noteId !== note.noteId,
                );
              }, false);
              popupResult(
                dispatch,
                covi.getDic('Msg_Note_DeleteSuccess', '쪽지가 삭제되었습니다.'),
              );
            } else {
              throw new Error('Delete Note Failed with response: ', data);
            }
          } catch (err) {
            popupResult(
              dispatch,
              covi.getDic(
                'Msg_Note_DeleteFail',
                '쪽지를 삭제하지 못했습니다. 다시 시도해 주세요',
              ),
            );
          }
        },
        name: covi.getDic('Delete', '삭제'),
      },
      {
        code: 'checkNote',
        isline: false,
        async onClick() {
          try {
            if (DEVICE_TYPE === 'd') {
              openNote({ type: 'readList', noteId: note.noteId });
            } else {
              history.push(`/client/nw/note/readlist/${note.noteId}`);
              // const { data } = await getReadList({ noteId: note.noteId });
            }
          } catch (err) {
            console.log('CheckReadNote Error   ', err);
          }
        },
        name: covi.getDic('Note_ReadList', '읽음 확인'),
      },
    ];

    // 보관하기 context는 보관함에서 보여주지 않음
    if (viewType !== 'archive') {
      _menus.push({
        code: 'archiveCreateNote',
        isline: false,
        async onClick() {
          // todo
          try {
            const { data } = await archiveNote({
              noteId: note.noteId,
              sop: 'C',
            });
            if (data && data.status === 'SUCCESS') {
              popupResult(
                dispatch,
                covi.getDic(
                  'Msg_Note_ArchiveCreateSuccess',
                  '쪽지가 보관되었습니다.',
                ),
              );
            } else {
              throw new Error(
                'Archive Note(Create) Failed with response: ',
                data,
              );
            }
          } catch (err) {
            popupResult(
              dispatch,
              covi.getDic(
                'Msg_Note_ArchiveCreateFail',
                '쪽지 보관에 실패했습니다. 다시 시도해주세요',
              ),
            );
          }
        },
        name: covi.getDic('Msg_Note_Archive', '보관하기'),
      });
    }
    return _menus;
  }, [note, blockChat, blockFile]);

  const senderInfo = useMemo(() => {
    const info = parseSender(note);
    if (info.length === 1 && info[0].presence) {
      return info[0];
    }
    return info;
  }, [note]);

  return (
    <RightContextMenu menuId={'Note_' + note.noteId} menus={menus}>
      <li
        className="person"
        key={note.noteId}
        onClick={() => {
          // 데스크탑 - 새창모드에서는 onClick 동작 X (불필요한 http request 방지)
          if (DEVICE_TYPE === 'd' && deviceViewType === 'S') {
            return;
          }
          _openNewNote(dispatch, viewType, note, { viewer: true });
        }}
        onDoubleClick={() => {
          // 데스크탑 - 확장모드에서는 onDoubleCLick 동작 X
          // 데스크탑(d) && 새창 모드(S)일 경우에만 새창열기
          if (DEVICE_TYPE === 'd' && deviceViewType === 'M') {
            return;
          }
          openNote({ type: 'receive', viewType, noteId: note.noteId });
        }}
      >
        <a>
          {/* 프로필 이미지는 수신함 or 보관함:발신 일때만 보여줌 */}
          {(viewType === 'receive' || senderInfo.presence) && (
            <ProfileBox
              userId={senderInfo.id}
              userName={senderInfo.displayName}
              img={senderInfo.photoPath}
              presence={senderInfo.presence}
            />
          )}
          <span
            className={clsx('tit', note.readFlag === 'Y' ? 'read' : 'unread')}
            style={{ maxWidth: 'calc(100% - 200px)' }}
          >
            {note?.emergency === 'Y' && emergencyMark}
            {blockChat
              ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
              : note.subject}
          </span>
          {note.readFlag === 'N' && (
            <span
              style={{
                marginLeft: '3px',
                color: '#F86A60',
                fontWeight: 'bold',
                fontSize: '11px',
              }}
            >
              N
            </span>
          )}
          {/* <span className="team">{nameInfo}</span> */}
          <span className="team">{translateName(senderInfo)}</span>
          <span className="date" style={{ maxWidth: '135px' }}>
            {noteTime}
          </span>
        </a>
        <div className="fuction_btn">
          <a
            className={clsx(
              'btn_file',
              !blockFile && note.fileFlag === 'Y' && 'active',
            )}
            style={{ marginRight: '3.5px' }}
          ></a>
          <a
            className={clsx('btn_note', note.readFlag === 'N' && 'active')}
            style={{ marginRight: '3.5px' }}
          ></a>
          <a
            className={clsx('btn_favorite', note.favorites === '1' && 'active')}
          ></a>
        </div>
      </li>
    </RightContextMenu>
  );
}

const NoteItem = withRouter(_NoteItem);

export default function Notes({ viewType, noteList }) {
  const userInfo = useSelector(({ login }) => login.userInfo);
  const userChineseWall = useSelector(({ login }) => login.chineseWall);
  const [chineseWallState, setChineseWallState] = useState([]);

  useEffect(() => {
    const getChineseWallList = async () => {
      const { result, status } = await getChineseWall({
        userId: userInfo?.id,
        myInfo: userInfo,
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
      getChineseWallList();
    }

    return () => {
      setChineseWallState([]);
    };
  }, []);

  const initialNumToRender = window.innerWidth
    ? Math.ceil(window.innerWidth / 60) + 2
    : 15;
  const renderPerBatch = 5;
  const { handleScrollUpdate, list } = useOffset(noteList, {
    initialNumToRender,
    renderPerBatch,
  });
  const handleUpdate = handleScrollUpdate({ threshold: 0.85 });

  const drawList =
    list &&
    list((note, idx) => {
      const senderInfo = isJSONStr(note.senderInfo)
        ? JSON.parse(note.senderInfo)
        : note.senderInfo;
      const { blockChat, blockFile } = isBlockCheck({
        targetInfo: {
          ...senderInfo,
          id: senderInfo.sender,
        },
        chineseWall: chineseWallState,
      });
      return (
        <NoteItem
          key={idx}
          note={note}
          viewType={viewType}
          blockChat={blockChat}
          blockFile={blockFile}
        />
      );
    });

  return (
    <Scrollbars
      autoHide={true}
      onUpdate={handleUpdate}
      className="MessageList"
      style={{ height: 'calc(100% - 210px)' }}
    >
      <ul className="people">{drawList}</ul>
    </Scrollbars>
  );
}
