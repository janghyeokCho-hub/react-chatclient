import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';
import { takeLatest, call, put } from 'redux-saga/effects';
import * as contactApi from '@/lib/contact';
import createRequestSaga, {
  createRequestActionTypes,
  exceptionHandler,
} from '@/lib/createRequestSaga';
import { getJobInfo } from '@/lib/common';
import { create } from '@/modules/popup';

const [GET_CONTACTS, GET_CONTACTS_SUCCESS, GET_CONTACTS_FAILURE] =
  createRequestActionTypes('contact/GET_CONTACTS');

const [ADD_CONTACTS, ADD_CONTACTS_SUCCESS, ADD_CONTACTS_FAILURE] =
  createRequestActionTypes('contact/ADD_CONTACTS');

const [DELETE_CONTACTS, DELETE_CONTACTS_SUCCESS, DELETE_CONTACTS_FAILURE] =
  createRequestActionTypes('contact/DELETE_CONTACTS');

const [GET_ITEMGROUP, GET_ITEMGROUP_SUCCESS, GET_ITEMGROUP_FAILURE] =
  createRequestActionTypes('contact/GET_ITEMGROUP');

const [ADD_CUSTOMGROUP, ADD_CUSTOMGROUP_SUCCESS, ADD_CUSTOMGROUP_FAILURE] =
  createRequestActionTypes('contact/ADD_CUSTOMGROUP');

const [
  MODIFY_CUSTOMGROUPNAME,
  MODIFY_CUSTOMGROUPNAME_SUCCESS,
  MODIFY_CUSTOMGROUPNAME_FAILURE,
] = createRequestActionTypes('contact/MODIFY_CUSTOMGROUPNAME');

const [
  REMOVE_CUSTOMGROUP,
  REMOVE_CUSTOMGROUP_SUCCESS,
  REMOVE_CUSTOMGROUP_FAILURE,
] = createRequestActionTypes('contact/REMOVE_CUSTOMGROUP');

const [
  MODIFY_GROUPMEMBER,
  MODIFY_GROUPMEMBER_SUCCESS,
  MODIFY_GROUPMEMBER_FAILURE,
] = createRequestActionTypes('contact/MODIFY_GROUPMEMBER');

const SET_CONTACTS = 'contact/SET_CONTACTS';

const MAPPING_USER_CHAT_ROOM = 'contact/MAPPING_USER_CHAT_ROOM';

const INIT = 'contact/INIT';

export const getContacts = createAction(GET_CONTACTS);
export const addContacts = createAction(ADD_CONTACTS);
export const deleteContacts = createAction(DELETE_CONTACTS);
export const getItemGroup = createAction(GET_ITEMGROUP);
export const mappingUserChatRoom = createAction(MAPPING_USER_CHAT_ROOM);
export const setContacts = createAction(SET_CONTACTS);
export const addCustomGroup = createAction(ADD_CUSTOMGROUP);
export const removeCustomGroup = createAction(REMOVE_CUSTOMGROUP);
export const modifyCustomGroupName = createAction(MODIFY_CUSTOMGROUPNAME);
export const modifyGroupMember = createAction(MODIFY_GROUPMEMBER);
export const init = createAction(INIT);

function createGetContactsSaga(type) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;
  return function* (action) {
    if (!action.payload) return;
    try {
      const response = yield call(contactApi.getContactList, action.payload);
      const success = response.data.status === 'SUCCESS';
      /* 사용자그룹 데이터 처리 */
      const filteredContacts = response.data.result.map(list => {
        // 그룹 내의 contact list iteration
        const filteredSub =
          list.sub &&
          list.sub.filter(user => {
            // id, name이 null일 경우 실제 유저 데이터가 아닌것으로 판단 => 필터링
            const userExists = user.id !== null && user.name !== null;
            return userExists;
          });
        return {
          ...list,
          sub: filteredSub,
        };
      });
      const data = [];
      const customGroups = filteredContacts
        .filter(contact => {
          if (contact.folderType != 'R' || contact.ownerID === '') {
            data.push(contact);
          }
          return (
            contact.folderType === 'R' &&
            contact.ownerID &&
            contact.ownerID != ''
          );
        })
        .map(contact => {
          // jobKey 데이터타입 Number > string 변환 (뷰에서 체크박스 여부 검사시 오류방지)
          if (Array.isArray(contact?.sub) === true) {
            contact.sub = contact.sub.map(c => ({
              ...c,
              jobKey: `${c.jobKey}` || c?.jobKey,
            }));
          }
          return contact;
        });
      data.map(contact => {
        if (contact.ownerID === '' && contact.folderType === 'R') {
          contact.sub = [];
          contact.sub = contact.sub.concat(customGroups);
        }
        return contact;
      });
      yield put({
        type: success ? SUCCESS : FAILURE,
        payload: {
          ...response.data,
          result: data,
        },
      });
    } catch (err) {
      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
        errMessage: err,
      });
    }
  };
}
const getContactsSaga = createGetContactsSaga(GET_CONTACTS);
// const getContactsSaga = createRequestSaga(
//   GET_CONTACTS,
//   contactApi.getContactList,
//   false,
// );

function createAddContactsSaga(type) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;

  return function* (action) {
    if (!action.payload) return;
    try {
      const response = yield call(contactApi.addContactList, action.payload);
      const success = response.data.status === 'SUCCESS';
      let message = null;

      const folderType =
        action?.payload?.[0]?.folderType || action?.payload?.folderType;
      if (folderType === 'C') {
        // 대화상대 추가
        message = success
          ? covi.getDic(
              'Msg_AddContacts_Success',
              '대화상대 추가에 성공했습니다.',
            )
          : covi.getDic(
              'Msg_AddContacts_Fail',
              '대화상대 추가에 실패했습니다.',
            );
      } else if (folderType === 'F') {
        // 즐겨찾기 추가
        message = success
          ? covi.getDic(
              'Msg_AddFavorites_Success',
              '즐겨찾기 추가에 성공했습니다.',
            )
          : covi.getDic(
              'Msg_AddFavorites_Fail',
              '즐겨찾기 추가에 실패했습니다.',
            );
      } else {
        // unknown 기본처리
        message = success
          ? covi.getDic('Msg_AddContacts_Success')
          : covi.getDic('Msg_AddContacts_Fail');
      }

      yield put({
        type: success ? SUCCESS : FAILURE,
        payload: response.data,
      });

      //대화상대 추가 피드백 (팝업창)
      yield put(
        create({
          type: 'Alert',
          message,
          callback: () => {},
        }),
      );
    } catch (err) {
      // request 에러
      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
        errMessage: err,
      });
    }
  };
}

const addContactsSaga = createAddContactsSaga(ADD_CONTACTS);

function createAddCustomGroupSaga(type) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;

  return function* (action) {
    if (!action.payload) return;

    try {
      const response = yield call(contactApi.addContactList, action.payload);
      const success = response.data.status === 'SUCCESS';
      let message = null;

      // 대화상대 성공 추가
      if (success === true) {
        const group = response.data.result[0];
        message = covi.getDic(
          'Msg_Add_Group_Success',
          '사용자그룹 생성에 성공하였습니다.',
        );

        /* 추가한 그룹 사용자 불러오기 */
        const data = yield call(contactApi.getItemGroupOneDepth, {
          folderID: group.folderId,
          folderType: group.folderType,
        });

        yield put({
          type: SUCCESS,
          payload: data.data.result[0],
        });
      } else {
        // 대화상대 추가 실패
        message = covi.getDic(
          'Msg_Add_Group_Failure',
          '사용자그룹 생성에 실패했습니다.<br />잠시 후에 다시 시도해주세요.',
        );
      }

      //대화상대 추가 피드백 (팝업창)
      yield put(
        create({
          type: 'Alert',
          message,
          callback: () => {},
        }),
      );
    } catch (err) {
      // request 에러
      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
        errMessage: err,
      });
    }
  };
}

const addCustomGroupSaga = createAddCustomGroupSaga(ADD_CUSTOMGROUP);

function createModifyGroupMemberSaga(type) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;

  return function* (action) {
    if (!action.payload) return;

    try {
      const response = yield call(contactApi.modifyContactList, action.payload);
      const success = response.data.status === 'SUCCESS';

      // 대화상대 성공 추가
      if (success === true) {
        const group = response.data.result[0];

        /* 추가한 그룹 사용자 불러오기 */
        const data = yield call(contactApi.getItemGroupOneDepth, {
          folderID: group.folderId,
          folderType: group.folderType,
        });

        yield put({
          type: SUCCESS,
          payload: data.data.result[0],
        });
      }
    } catch (err) {
      // request 에러
      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
        errMessage: err,
      });
    }
  };
}

const modifyGroupMemberSaga = createModifyGroupMemberSaga(MODIFY_GROUPMEMBER);

const removeCustomGroupSaga = createRequestSaga(
  REMOVE_CUSTOMGROUP,
  contactApi.deleteContactList,
);
const modifyCustomGroupNameSaga = createRequestSaga(
  MODIFY_CUSTOMGROUPNAME,
  contactApi.modiftyCustomGroupName,
);

const deleteContactsSaga = createRequestSaga(
  DELETE_CONTACTS,
  contactApi.deleteContactList,
);

const getItemGroupSaga = createRequestSaga(
  GET_ITEMGROUP,
  contactApi.getItemGroupOneDepth,
  false,
);

export function* contactSaga() {
  yield takeLatest(GET_CONTACTS, getContactsSaga);
  yield takeLatest(ADD_CONTACTS, addContactsSaga);
  yield takeLatest(DELETE_CONTACTS, deleteContactsSaga);
  yield takeLatest(GET_ITEMGROUP, getItemGroupSaga);
  yield takeLatest(ADD_CUSTOMGROUP, addCustomGroupSaga);
  yield takeLatest(REMOVE_CUSTOMGROUP, removeCustomGroupSaga);
  yield takeLatest(MODIFY_GROUPMEMBER, modifyGroupMemberSaga);
  yield takeLatest(MODIFY_CUSTOMGROUPNAME, modifyCustomGroupNameSaga);
}

const initialState = {
  contacts: [],
};

const contact = handleActions(
  {
    [INIT]: (state, action) => {
      return {
        ...initialState,
      };
    },
    [GET_CONTACTS_SUCCESS]: (state, action) => {
      return {
        ...state,
        contacts: action.payload.result,
      };
    },
    [ADD_CONTACTS_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        action.payload.result.forEach(item => {
          const folderType = item.folderType;
          const userInfo = item.userInfo;
          const orgFolderType = item.orgFolderType;

          if (folderType == 'G') {
            draft.contacts.push({
              folderID: item.folderId,
              folderName: userInfo.name,
              folderType: folderType,
              folderSortKey: item.folderSortKey,
              groupCode: userInfo.id,
              pChat: userInfo.pChat,
            });
          } else {
            const parent = draft.contacts.find(
              contact => contact.folderType == folderType,
            );

            // 즐겨찾기 데이터와 중복이 없을 경우에만 push
            if (!parent.sub) {
              parent.sub = [userInfo];
            } else {
              const duplicatedItemIdx = parent?.sub?.findIndex(
                item => item.id === userInfo.id,
              );
              if (duplicatedItemIdx === -1) {
                parent.sub.push(userInfo);
              }
            }

            if (folderType == 'F' && orgFolderType == 'C') {
              const contact = draft.contacts.find(
                contact => contact.folderType == 'C',
              );
              if (contact)
                contact.sub = contact.sub.filter(sub => sub.id != userInfo.id);
            }

            draft.contacts.forEach(fd => {
              if (
                (fd.folderType == 'G' || fd.folderType == 'M') &&
                fd.sub &&
                fd.sub.length > 0
              ) {
                fd.sub.forEach(subItem => {
                  if (subItem.id == userInfo.id) {
                    subItem.isContact = folderType;
                  }
                });
              }
            });
          }
        });
      });
    },
    [DELETE_CONTACTS_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const id = action.payload.result.contactId;
        const folderType = action.payload.result.folderType;

        if (folderType == 'G') {
          draft.contacts = draft.contacts.filter(
            item => item.folderID != action.payload.result.folderId,
          );
        } else {
          if (folderType == 'F') {
            let contactList = draft.contacts.find(
              contact => contact.folderType == 'C',
            );
            let favoriteList = draft.contacts.find(
              contact => contact.folderType == 'F',
            );

            if (contactList) {
              const addItem = favoriteList.sub.find(item => item.id == id);
              if (contactList.sub) contactList.sub.push(addItem);
              else contactList.sub = [addItem];
            }
          }

          const parent = draft.contacts.find(
            contact => contact.folderType == folderType,
          );

          parent.sub = parent.sub.filter(item => item.id != id);

          draft.contacts.forEach(fd => {
            if (
              (fd.folderType == 'G' || fd.folderType == 'M') &&
              fd.sub &&
              fd.sub.length > 0
            ) {
              fd.sub.forEach(subItem => {
                if (subItem.id == id) {
                  subItem.isContact = folderType == 'F' ? 'C' : '';
                }
              });
            }
          });
        }
      });
    },
    [SET_CONTACTS]: (state, action) => {
      // login시에만 사용

      /**
       * 2021.03.08
       * 유저 데이터가 비어있을 경우(ex: 퇴사자) 대화상대 목록에서 제거하는 로직
       *
       * action.payload.result => 모든 그룹(폴더) 데이터 Array
       * action.payload[i].sub => 해당 그룹의 유저목록
       */

      // 그룹 iteration
      const filteredContacts = action.payload.result.map(list => {
        // 그룹 내의 contact list iteration
        const filteredSub =
          list.sub &&
          list.sub.filter(user => {
            // id, name이 null일 경우 실제 유저 데이터가 아닌것으로 판단 => 필터링
            const userExists = user.id !== null && user.name !== null;
            return userExists;
          });

        return {
          ...list,
          sub: filteredSub,
        };
      });

      /* 
        서버데이터 변환 작업 
        contact 로 R - 하위그룹들이오면 - sub로 넣어줌.
        contact 사용자그룹 R이면서 folderID 3
          - contact R타입
          - contact R타입
      */
      /* 사용자그룹 데이터 처리 */
      let data = [];
      const customGroups = filteredContacts
        .filter(contact => {
          if (contact.folderType != 'R' || contact.ownerID === '') {
            data.push(contact);
          }
          return (
            contact.folderType === 'R' &&
            contact.ownerID &&
            contact.ownerID != ''
          );
        })
        .map(contact => {
          // jobKey 데이터타입 Number > string 변환 (뷰에서 체크박스 여부 검사시 오류방지)
          if (Array.isArray(contact?.sub) === true) {
            contact.sub = contact.sub.map(c => ({
              ...c,
              jobKey: `${c.jobKey}` || c?.jobKey,
            }));
          }
          return contact;
        });

      data.map(contact => {
        if (contact.ownerID === '' && contact.folderType === 'R') {
          contact.sub = [];
          contact.sub = contact.sub.concat(customGroups);
        }
        return contact;
      });

      return {
        ...state,
        contacts: data,
        //reload: false,
      };
    },
    [GET_ITEMGROUP_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.result.groupCode) {
          const groupCode = action.payload.result.groupCode;
          const contact = draft.contacts.find(
            contact => contact.groupCode == groupCode,
          );

          contact.sub = action.payload.result.sub;
        }
      });
    },
    [MAPPING_USER_CHAT_ROOM]: (state, action) => {
      return produce(state, draft => {
        for (let i = 0; i < draft.contacts.length; i++) {
          if (draft.contacts[i].sub && draft.contacts[i].sub.length > 0) {
            const target = draft.contacts[i].sub.find(
              t => t.id == action.payload.id,
            );
            if (target) target.roomID = action.payload.roomID;
          }
        }
      });
    },
    [ADD_CUSTOMGROUP_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const groupIdx = draft.contacts.findIndex(
          contact => contact.folderType == 'R',
        );
        const sub = action.payload.sub ? JSON.parse(action.payload.sub) : [];
        action.payload.sub = [];
        if (!draft.contacts[groupIdx].sub) {
          draft.contacts[groupIdx].sub = [];
          draft.contacts[groupIdx].sub.push({
            ...action.payload,
            sub: sub,
          });
        } else {
          draft.contacts[groupIdx].sub = draft.contacts[groupIdx].sub.concat({
            ...action.payload,
            sub: sub,
          });
        }
      });
    },
    [MODIFY_CUSTOMGROUPNAME_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const folderIdx = draft.contacts.findIndex(
          contact => contact.folderType == 'R',
        );
        const groupIdx = draft.contacts[folderIdx].sub.findIndex(
          group => Number(group.folderID) === action.payload.folderId,
        );
        draft.contacts[folderIdx].sub[groupIdx].folderName =
          action.payload.displayName;
      });
    },
    [REMOVE_CUSTOMGROUP_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const data = action.payload.result;
        const groupIdx = draft.contacts.findIndex(
          contact => contact.folderType == 'R',
        );
        //멤버/조직 삭제
        if (data.contactId || data.companyCode) {
          const delInfo = data.contactId || data.companyCode;
          const delgroupIdx = draft.contacts[groupIdx].sub.findIndex(
            group => data.folderId === group.folderID,
          );
          draft.contacts[groupIdx].sub[delgroupIdx].sub = draft.contacts[
            groupIdx
          ].sub[delgroupIdx].sub.filter(member => {
            return member.id != delInfo;
          });
        } else {
          //그룹삭제
          draft.contacts[groupIdx].sub = draft.contacts[groupIdx].sub.filter(
            group => {
              return data.folderId != group.folderID;
            },
          );
        }
      });
    },
    [MODIFY_GROUPMEMBER_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const groupIdx = draft.contacts.findIndex(
          contact => contact.folderType == 'R',
        );
        draft.contacts[groupIdx].sub.map(group => {
          if (group.folderID == action.payload.folderID) {
            group.sub = []; //그냥 overwrite
            group.sub = action.payload.sub
              ? JSON.parse(action.payload.sub)
              : [];
          }
          return group;
        });
      });
    },
  },
  initialState,
);

export default contact;
