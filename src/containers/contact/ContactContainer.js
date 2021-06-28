import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getContacts } from '@/modules/contact';
import Contact from '@/components/contact/Contact';

/* viewType
    - list : 대화상대 리스트 
    - checklist : 채팅방 생성 및 채팅방 초대
*/
const ContactContainer = ({ viewType, checkObj }) => {
  const contactList = useSelector(({ contact }) => contact.contacts);
  const deptCode = useSelector(({ login }) => login.userInfo.DeptCode);
  const dispatch = useDispatch();

  useEffect(() => {
    if (contactList == null || contactList.length == 0) {
      dispatch(getContacts(deptCode));
    }
  }, []);

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
