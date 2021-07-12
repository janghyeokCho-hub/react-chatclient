import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import { useViewType, useNoteList, useViewState, getNoteList, useSearchState } from '@/lib/note';
import { closeRooms } from '@/modules/note';
import SearchBar from '@COMMON/SearchBar';
import Notes from '@/pages/note/Notes';
import NoteManager from '@/pages/note/Manager';
import AddNoteIcon from '@/icons/svg/note/AddNote';
import InboxIcon from '@/icons/svg/note/Inbox';
import OutboxIcon from '@/icons/svg/note/Outbox';
import ArchiveIcon from '@/icons/svg/note/Archive';
import { openNote } from '@/lib/deviceConnector';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';
import { evalConnector } from '@/lib/deviceConnector';

// 검색 fetch debouncer
const debounceTimer = createTakeLatestTimer(250);

export default function NoteList() {
    const [viewType, setViewType] = useViewType('receive');
    const [searchText, setSearchText] = useSearchState('');
    const { data: noteList, mutate: setNoteList, search, removeNote, readNote } = useNoteList({ viewType });
    const [_, setViewState] = useViewState();
    const dispatch = useDispatch();
    
    function revalidateNote() {
        setNoteList(() => getNoteList(`/note/list/${viewType}`));
    }

    useEffect(() => {
        // 메뉴 이름
        dispatch(bound({ name: covi.getDic('Note', '쪽지'), type: 'notelist' }));

        const topButtons = [
            {
                code: 'newNote',
                onClick: () => {
                    if (DEVICE_TYPE === 'b') {
                        dispatch(closeRooms());
                        setViewState({ type: 'send' });
                    } else if(DEVICE_TYPE === 'd') {
                        openNote({ type: 'send' });
                    }
                },
                svg: <AddNoteIcon />
            }
        ];
        // 메뉴 상단 버튼 변경
        dispatch(
            setTopButton(topButtons)
        );

        // Cleanup
        return () => {
            setSearchText('');
        };
    }, []);

    useEffect(() => {
        // 수신함/발신함/보관함 전환시 검색 초기화
        setSearchText('');
        revalidateNote();
    }, [viewType]);

    const handleChange = useCallback((e) => {
        const text = e.target.value;
        setSearchText(text);
        // 2021.05.18 TODO: 현재 debounce 정상적으로 동작 안함
        debounceTimer.takeLatest(() => {
            search(text);
        }, 450);
    }, [searchText]);

    function getActiveBoxStyle(_viewType) {
        return viewType === _viewType ? 'active' : '';
    }

    const handleSyncNote = (event, args) => {
        const { op, viewType, noteId } = args;
        if (op === 'refetch') {
            // 쪽지함 리로드 IPC
            revalidateNote();
        } else if (op === 'read') {
            // 쪽지 읽음처리 IPC
            readNote(viewType, noteId);
        } else if (op === 'delete' && noteId) {
            // 쪽지 삭제처리 IPC
            removeNote(viewType, noteId);
        }
    };

    useEffect(() => {
        // 이전에 등록된 listener 삭제하고 재등록(contactList 데이터 갱신 이슈)
        evalConnector({
            method: 'removeListener',
            channel: 'sync-note',
        });
        // BrowserWindow 서브윈도우에서 유저 즐겨찾기 추가시 메인윈도우로 이벤트 위임
        evalConnector({
            method: 'on',
            channel: 'sync-note',
            callback: handleSyncNote
        });
    }, [noteList]);

    const searchPlaceHolder = useMemo(() => {
        switch(viewType) {
            case 'receive':
                return covi.getDic('Msg_Note_Search_Receive', '발신인, 제목');
            case 'send':
                return covi.getDic('Msg_Note_Search_Send', '수신인, 제목');
            case 'arcive':
            default:
                return covi.getDic('Msg_Note_Search_Archive', '수신인, 발신인, 제목');
        }
    }, [viewType]);

    return <>
        <SearchBar
            placeholder={searchPlaceHolder}
            input={searchText}
            onChange={handleChange}
        />
        <div className="NoteList NoteList01" style={{ height: '100%' }}>
            <div className="note_tree_wrap">
                <div className="scr_h" style={{ overflowX: 'hidden' }}>
                    <ul>
                        <li className={getActiveBoxStyle('receive')} onClick={() => setViewType('receive')}>
                            <a><InboxIcon /> {covi.getDic('Note_Receive', '수신함')}</a>
                        </li>
                        <li className={getActiveBoxStyle('send')} onClick={() => setViewType('send')}>
                            <a><OutboxIcon /> {covi.getDic('Note_Send', '발신함')}</a>
                        </li>
                        <li className={getActiveBoxStyle('archive')} onClick={() => setViewType('archive')}>
                            <a><ArchiveIcon /> {covi.getDic('Note_Archive', '보관함')}</a>
                        </li>
                    </ul>
                </div>
            </div>
            <NoteManager viewType={viewType} />
            { /* 임시 데이터임 */ }
            <Notes viewType={viewType} noteList={noteList} />
            {/* <></> */}
        </div>
    </>;
}