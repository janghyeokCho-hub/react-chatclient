import { addContacts, deleteContacts } from '@/modules/contact';
import { addFixedUsers } from '@/modules/presence';
import { getAesUtil } from '@/lib/aesUtil';

export const addFavorite = (dispatch, userInfo, orgFolderType) => {
  if (!userInfo.id) return;

  // prop 변경시도 오류 방지를 위한 object clone
  const _userInfo = Object.assign({}, userInfo, { pChat: 'Y' });

  dispatch(
    addContacts([
      {
        targetId: _userInfo.id,
        targetType: _userInfo.type,
        folderType: 'F',
        orgFolderType: orgFolderType,
        userInfo: _userInfo,
      },
    ]),
  );

  if (orgFolderType != 'C' && _userInfo.type == 'U') {
    dispatch(addFixedUsers([{ id: _userInfo.id, presence: _userInfo.presence }]));
  }
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

export const editGroupContactList = (dispatch, action, groupInfo, addMemberList) => {
  dispatch(action(groupInfo));

  const presenceList = addMemberList.filter(item => {
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

/* 
  그룹멤버 기준으로 client단에서 검색 filter
  @param
    data: server에서 검색된 data
    group: 변경중인 group 정보
    userId: 접속 userId
*/
export const filterSearchGroupMember = (data, group, userID) =>{
  return data.filter((contact)=>{
    let flag = true;
    if(group.sub){
      group.sub.forEach(groupUser =>{
        if(groupUser.id === contact.id)
          flag = false;
      });
    }
    return flag && contact.id != userID;
  })
}

/* 
  사용자 그룹생성 및 멤버 추가/제거 
  @param
    members: 추가/제거되는 멤버
    name: 사용자 그룹명
    group: 변경되는 그룹정보
    reserved: 추가/제거 flag(A:추가, D:제거)
*/
export const getApplyGroupInfo = (members, name, group, reserved) => {
  const AESUtil = getAesUtil();
  let modifyInfo ={};
  if((group && group.folderID) && reserved){
    modifyInfo = {
      folderId: group ? group.folderID : null,
      reserved : reserved || null
    }
  }
  /* 신청 param  
    folderId: 변경되는 그룹 id
    reserved: 추가/제거 flag
    displayName: 그룹 명
    arrGroup: 추가/제거되는 조직 리스트(암호화)
    arrMember: 추가/제거되는 사용자 리스트(암호화)
  */
  return [{
    ...modifyInfo,
    displayName: ";;;;;;;;;".replace(/[\;]/g, name+";"),
    folderType: 'R',
    arrGroup: AESUtil.encrypt(members.filter((item)=> item.type == 'G').map((item)=>{
      return item.id+"|"+item.companyCode;
    }).join(",")),
    arrMember: AESUtil.encrypt(members.filter((item)=> item.type == 'U').map((item)=>{
      return item.id;
    }).join(","))
  }];
}