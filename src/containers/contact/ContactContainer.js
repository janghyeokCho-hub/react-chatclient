import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getContacts } from '@/modules/contact';
import Contact from '@/components/contact/Contact';
import { evalConnector } from '@/lib/deviceConnector';
import { addFavorite, deleteFavorite } from '@/lib/contactUtil';

/* viewType
    - list : 대화상대 리스트 
    - checklist : 채팅방 생성 및 채팅방 초대
*/
const ContactContainer = ({ viewType, checkObj }) => {
  const contactList = useSelector(({ contact }) => contact.contacts);
  const deptCode = useSelector(({ login }) => login.userInfo.DeptCode);
  const evalConnectorRegistered = useState(false);
  const dispatch = useDispatch();
  const handleSync = useCallback((event, args) => {
    const { userInfo } = args;
    if (args.op === 'add') {
      // 다른 연락처에 있는지 없는지 확인
      if (contactList && contactList[2] && contactList[2].sub && contactList[2].sub.length > 0) {
        let flag = false;
        contactList[2].sub.map(data => {
          console.log(`userInfo ${userInfo.id} data ${data.id}`);
          if (userInfo.id == data.id) {
            // 만약 다른 연락처에 사용자가 있다면....
            addFavorite(dispatch, userInfo, contactList[2].folderType);
            flag = true;
          }
        });
        if (!flag) {
          addFavorite(dispatch, userInfo, '');
        }
      } else {
        addFavorite(dispatch, userInfo, '');
      }
    } else if(args.op === 'del') {
      deleteFavorite(dispatch, args.userId);
    }
  }, [contactList]);

  useEffect(() => {
    if (contactList == null || contactList.length == 0) {
      dispatch(getContacts(deptCode));
    }

    return () => {
      // cleanup
      evalConnector({
        method: 'removeListener',
        channel: 'sync-favorite',
      });
    }
  }, []);

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
      callback: handleSync
    });

  }, [contactList]);

  return (
    <>
      {contactList &&
        contactList.map(contact => (
          <Contact
            key={contact.folderID}
            contact={contact}
            viewType={viewType}
            checkObj={checkObj}
          />
        ))}
    </>
  );
};

export default React.memo(ContactContainer);
