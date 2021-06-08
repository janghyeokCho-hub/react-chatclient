import { addContacts, deleteContacts, addCustomGroup } from '@/modules/contact';
import { addFixedUsers } from '@/modules/presence';

export const addFavorite = (dispatch, userInfo, orgFolderType) => {
  if (!userInfo.id) return;

  userInfo.pChat = 'Y';

  dispatch(
    addContacts([
      {
        targetId: userInfo.id,
        targetType: userInfo.type,
        folderType: 'F',
        orgFolderType: orgFolderType,
        userInfo: userInfo,
      },
    ]),
  );

  if (orgFolderType != 'C' && userInfo.type == 'U')
    dispatch(addFixedUsers([{ id: userInfo.id, presence: userInfo.presence }]));
};

export const addContact = (dispatch, userInfo) => {
  dispatch(
    addContacts([
      {
        targetId: userInfo.id,
        targetType: userInfo.type,
        folderType: userInfo.type == 'G' ? 'G' : 'C',
        userInfo: userInfo,
        companyCode: userInfo.companyCode,
      },
    ]),
  );

  if (userInfo.type == 'U')
    dispatch(addFixedUsers([{ id: userInfo.id, presence: userInfo.presence }]));
};

export const addContactList = (dispatch, list) => {
  dispatch(addContacts(list));

  const presenceList = list.filter(item => {
    if (item.targetType == 'U')
      return { id: item.targetId, presence: item.presence };
  });

  dispatch(addFixedUsers(presenceList));
};

export const addGroupContactList = (dispatch, groupInfo, addMemberList) => {
  dispatch(addCustomGroup(groupInfo));

  const presenceList = addMemberList.sub.filter(item => {
    if (item.targetType == 'U')
      return { id: item.targetId, presence: item.presence };
  });

  dispatch(addFixedUsers(presenceList));
};

export const deleteContact = (dispatch, id, folderID, folderType) => {
  let params = {
    folderType: folderType,
  };
  if (id != null) params.contactId = id;
  if (folderID != null) params.folderId = folderID;

  dispatch(deleteContacts(params));
};

export const deleteFavorite = (dispatch, id) => {
  let params = {
    folderType: 'F',
    folderId: 1,
  };

  if (id != null) params.contactId = id;

  dispatch(deleteContacts(params));
};
