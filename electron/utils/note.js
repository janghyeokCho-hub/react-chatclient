import { BrowserWindow, screen } from 'electron';
import path from 'path';
import url from 'url';

import exportProps from '../config/exportProps';

export function getWinId(type, noteId) {
    /**
     * 쪽지 윈도우 중복 범위
     * 수신 - noteId 마다 새 윈도우
     * 답장 - noteId 마다 새 윈도우
     * 전달 - noteId 마다 새 윈도우
     * 발신 - 윈도우 하나만 허용
     * 
     */
    if (type === 'receive' && noteId) {
        return noteId;
    } else if ((type === 'reply' || type === 'replyAll') && noteId) {
        return 'rep_' + noteId;
    } else if (type === 'forward' && noteId) {
        return 'fwd_' + noteId;
    } else if (type === 'send') {
        return 'send';
    } else {
        return 'unknown';
    }
}

export function openNoteWindow({ type, noteId, viewType, isEmergency = false }) {
    const winId = getWinId(type, noteId);
    const createdWin = NOTE_WIN_MAP[winId];
    console.log(`Open Note type(${type}) viewType(${viewType}) => winId(${winId})`);

    // 이미 생성된 윈도우가 있을 경우 재생성하지 않음
    if (createdWin) {
        createdWin.isMinimized() ? createdWin.restore() : createdWin.focus();
        return;
    }

    
    const currentCursor = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint(currentCursor);

    const minWidth = 400;
    const minHeight = 500;

    const defaultWidth = currentDisplay.workAreaSize.width / 3;
    const defaultHeight = currentDisplay.workAreaSize.height / 2;

    const newWindow = new BrowserWindow({
        width: defaultWidth < minWidth ? minWidth : defaultWidth,
        height: defaultHeight < minHeight ? minHeight : defaultHeight,
        minWidth,
        minHeight,
        webPrefereces: {
            nodeIntegration: true
        },
        frame: false,
        alwaysOnTop: isEmergency
    });

    // global map에 윈도우 인스턴스 저장
    NOTE_WIN_MAP[winId] = newWindow;

    const loadURL = url.format({
        pathname: path.join(exportProps.resourcePath, 'renderer', 'index.html'),
        protocol: 'file:',
        slashes: true,
    });

    let endpoint = '';
    if (type === 'receive' && noteId) {
        // 쪽지 열기
        endpoint = `#/client/nw/note/${noteId}/${viewType}`;
    } else if (type === 'send') {
        // 쪽지 보내기
        endpoint = `#/client/nw/note/send`;
    } else if (type === 'reply' || type === 'replyAll' || type === 'forward') {
        // 답장, 전달은 발신뷰+파라미터 형태로 동일 뷰 공유함
        endpoint = `#/client/nw/note/send?type=${type}&noteId=${noteId}`;
    } else if (type === 'readList' && noteId) {
        endpoint = `#/client/nw/note/readlist/${noteId}`;
    } else {
        // 허용되지 않은 옵션은 새창 띄우지 않음
        return;
    }
    newWindow.loadURL(`${loadURL}${endpoint}`);

    isEmergency && setTimeout(() => {
        // 긴급쪽지: 쪽지창이 열린 뒤에 상단고정 해제
        newWindow.setAlwaysOnTop(false);
    }, 0);

    newWindow.once('ready-to-show', () => {
        newWindow.show();
    });
    newWindow.once('close', () => {
        // 창을 닫으면 global map에서 삭제
        NOTE_WIN_MAP[winId] && delete NOTE_WIN_MAP[winId];
    });
}