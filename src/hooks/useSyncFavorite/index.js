//usesync
import React from 'react';
import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addFavorite, addNotificationAction, deleteFavorite } from '@/lib/contactUtil';
import { sendMain, isMainWindow } from '@/lib/deviceConnector';
import { evalConnector } from '@/lib/deviceConnector';

export function useSyncFavorite() {
  const contactList = useSelector(({ contact }) => contact.contacts);
  const dispatch = useDispatch();
  const _syncFavorite = useCallback(
    args => {
      const { userInfo } = args;
      if (args.op === 'add') {
        const otherContacts =
          contactList &&
          contactList.find(_contact => _contact.folderID === '2');
        // 다른 연락처에 있는지 없는지 확인
        if (otherContacts?.sub && otherContacts.sub.length > 0) {
          let flag = false;
          otherContacts.sub.map(data => {
            if (userInfo.id == data.id) {
              // 만약 다른 연락처에 사용자가 있다면....
              addFavorite(dispatch, userInfo, otherContacts.folderType, '2');
              flag = true;
            }
          });
          if (!flag) {
            addFavorite(dispatch, userInfo, args?.folderType || '', '2');
          }
        } else {
          addFavorite(dispatch, userInfo, args?.folderType || '');
        }
      } else if (args.op === 'del') {
        deleteFavorite(dispatch, args.userId);
      }
    },
    [contactList],
  );
  /**
   * !!파라미터 주의!!
   * Electron IPC 리스너에서 실행될 때와 함수를 직접 호출할 때의 파라미터가 다름
   *
   * Electorn IPC listener: (event, args) => {}
   * non-electron function call: (args) => {}
   */
  const syncFavorite = (args, IPCargs) => {
    if (DEVICE_TYPE === 'd') {
      if (IPCargs && isMainWindow() === true) {
        /**
         * Context: electron main window
         * invoked by electron sub window via Electron IPC
         */
        // Send add/del fovorite request
        _syncFavorite(IPCargs);  
      } else {
        /**
         * Context: electron sub window
         * invoked by user interaction
         */
        // Pass(emit) sync-favorite event to the main window
        sendMain('sync-favorite', args);   
      }
    } else {
      /**
       * Context: Web browser
       */
      // Send add/del fovorite request
      _syncFavorite(args);
    }
  };
  return {
    syncFavorite,
  };
}

export function SyncFavoriteIPC() {
  const { syncFavorite } = useSyncFavorite();
  const contactList = useSelector(({ contact }) => contact.contacts);
  useEffect(() => {
    // 이전에 등록된 listener 삭제하고 재등록(contactList 데이터 갱신 이슈)
    evalConnector({
      method: 'removeListener',
      channel: 'sync-favorite',
    });
    // BrowserWindow 서브윈도우에서 유저 즐겨찾기 추가시 메인윈도우로 이벤트 위임
    evalConnector({
      method: 'on',
      channel: 'sync-favorite',
      callback: syncFavorite,
    });
    return () => {
      evalConnector({
        method: 'removeListener',
        channel: 'sync-favorite',
      });
    };
  }, [contactList]);

  return <></>;
}