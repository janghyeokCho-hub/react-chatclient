import React, { useState, forwardRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openPopup } from '@/lib/common';
import { useNoteUnreadCount, deleteNote, useNoteList, getNoteList, useSearchState, SORT, useSortState } from '@/lib/note';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import RightContextMenu from '@/components/common/popup/RightConxtMenu';
import useWindowDimensions from '@/hooks/useWindowDimensions';

const Arrow = forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />);
function popupResult(dispatch, message) {
    openPopup(
        {
            type: 'Alert',
            message
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
function SortButton({ active, text, direction, style }) {
    const defaultStyle = {
        transition: `opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`,
        fontSize: '17px',
        // active일 경우 arrow 색깔처리
        ...(active && { fill: 'rgb(248, 106, 96)' }),
        ...style
    };
    let directionStyle = null;

    if (direction === SORT.ASC) {
        directionStyle = {
            ...defaultStyle,
            transform: 'rotate(180deg)'
        };
    } else if (direction === SORT.DESC) {
        directionStyle = {
            ...defaultStyle,
            transform: 'rotate(0deg)'
        };
    }

    return <>
        <div style={{ display: 'flex' }}>
            {
                // active일 경우 text 색깔처리
                active ?
                    <strong style={{ color: 'rgb(248, 106, 96)', fontSize: '14px', flex: 1, justifyContent: 'flex-start', lineHeight: 'normal' }}> {text}</strong> :
                    <span style={{ fontSize: '14px', flex: 1, justifyContent: 'flex-start', lineHeight: 'normal' }}>{text} </span>
            }
            <Arrow style={{ justifyContent: 'flex-start', ...directionStyle }} />
        </div>
    </>
}

export default function Manager({ viewType }) {
    const dispatch = useDispatch();
    const unreadNoteCnt = useNoteUnreadCount();
    const { mutate: setNoteList, search } = useNoteList({ viewType });
    const [searchText] = useSearchState('');
    const [nameSort, setNameSort] = useState(SORT.DESC);
    const [dateSort, setDateSort] = useState(SORT.DESC);
    const [activeSort, setActiveSort] = useState(null);
    const { width } = useWindowDimensions();
    const windowViewType = useSelector(({ room }) => room.viewType);

    const collapseInfo = useMemo(() => {
        //창 크기 축소시 다국어 변경
        if (windowViewType === 'M' && width < 1200) {
            return true;
        }
        if (windowViewType === 'S' && width < 450) {
            return true;
        }
        return false;
    }, [width, windowViewType]);

    useEffect(() => {
        // 쪽지함 타입 or 검색어 바뀔경우 정렬상태 초기화
        return () => {
            setNameSort(SORT.DESC);
            setDateSort(SORT.DESC);
            setActiveSort(null);
        }
    }, [searchText, viewType]);

    async function sortNoteList(_sortName, _sort, setState) {
        const nextSort = _sort === SORT.DESC ? SORT.ASC : SORT.DESC;
        try {
            if (!searchText) {
                const result = await getNoteList(`/note/list/${viewType}`, _sortName, nextSort);
                Array.isArray(result) && setNoteList(result);
            } else {
                search(searchText, _sortName, nextSort);
            }
            setState(nextSort);
            setActiveSort(_sortName);
        } catch (err) {
            console.log(`Sort(${_sortName}) Error   `, err);
        }
    }

    /* 정렬 context menu */
    const menuId = 'SortContext';
    const menus = [
        {
            code: 'sortByDate',
            isline: false,
            name: <SortButton text={covi.getDic('Date', '날짜')} active={activeSort === SORT.DATE} direction={dateSort} />,
            preventClose: true,
            async onClick() {
                sortNoteList(SORT.DATE, dateSort, setDateSort);
            }
        },
        {
            code: 'line',
            isline: true,
            onClick: () => { },
            name: 'hr1',
        },
        {
            code: 'sortByName',
            isline: false,
            name: <SortButton text={covi.getDic('Note_Sender', '보낸사람')} active={activeSort === SORT.NAME} direction={nameSort} />,
            preventClose: true,
            async onClick() {
                sortNoteList(SORT.NAME, nameSort, setNameSort);
            }
        }
    ];
    /* */

    async function deleteAllNotes() {
        try {
            const result = await _popup(dispatch, 'Confirm', covi.getDic('Msg_Note_DeleteConfirm'));
            if (result === false) {
                return;
            }
            const { data } = await deleteNote({ viewType, noteId: 'ALL' });
            if (data && data.status === 'SUCCESS') {
                // 삭제 성공시 state 즉시 초기화
                setNoteList([], false);
                popupResult(dispatch, covi.getDic('Msg_Note_DeleteAllSuccess', '모든 쪽지가 삭제되었습니다.'));
            } else {
                throw new Error('Delete Note Failed with response: ', data);
            }
        } catch (err) {
            popupResult(dispatch, covi.getDic('Msg_Note_DeleteFail', '쪽지를 삭제하지 못했습니다. 다시 시도해 주세요'));
        }
    }

    return (
        <div className="note_info">
            <p className="txt" style={{ display: 'inline-block' }}>
                <strong className="count">({unreadNoteCnt})</strong>{collapseInfo ? covi.getDic('Msg_Note_Unread_Short', '읽지 않음') : covi.getDic('Msg_Note_Unread', '개의 읽지 않은 쪽지가 있습니다.')}
            </p>
            <div className="note_btn" style={{ display: 'inline-block', top: 'unset', transform: 'unset' }}>
                <RightContextMenu menuId={menuId} menus={menus} holdToDisplay={0} renderTag='a' attributes={{ className: 'btn_sort' }}>
                    {covi.getDic('Sort', '정렬')}
                </RightContextMenu>
                &nbsp;
                <a className="btn_delete" onClick={deleteAllNotes}>{covi.getDic('DeleteAll', '전체삭제')}</a>
            </div>
        </div>
    );
}