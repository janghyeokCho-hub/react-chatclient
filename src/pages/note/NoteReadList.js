import React, { useLayoutEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import NoteHeader from '@/pages/note/NoteHeader';
import ConditionalWrapper from '@/components/ConditionalWrapper';
import ReadListTable from '@/pages/note/ReadListTable';
import { openPopup } from '@/lib/common';

function _popupResult(dispatch, message, cb) {
    openPopup(
        {
            type: 'Alert',
            message,
            ...(typeof cb === 'function' && { callback: cb })
        },
        dispatch,
    );
}

export default function ReadList({ match, location }) {
    const dispatch = useDispatch();
    const [noteId, setNoteId] = useState(null);
    const isNewWin = window.opener !== null || (match && match.url.indexOf('/nw/') > -1);
    const handleClose = useCallback(() => {
        DEVICE_TYPE === 'd' ? window.close() : history.back();
    }, []);

    const onError = useCallback(async () => {
        _popupResult(dispatch, covi.getDic('Msg_Note_NotFound', '쪽지를 가져올 수 없습니다.'), () => handleClose());
    }, []);

    if (!match.params || !match.params.noteId) {
        onError();
    }

    return (
        <ConditionalWrapper wrapIf={isNewWin} wrapper={(children) => <div className="Chat Newwindow">{children}</div>}>
            <NoteHeader onClose={handleClose} title={covi.getDic('Note_ReadList', "읽음 확인")} />
            { <ReadListTable noteId={match.params.noteId} onError={onError} /> }
        </ConditionalWrapper>
    );
}