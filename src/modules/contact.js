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

const [
  GET_CONTACTS,
  GET_CONTACTS_SUCCESS,
  GET_CONTACTS_FAILURE,
] = createRequestActionTypes('contact/GET_CONTACTS');

const [
  ADD_CONTACTS,
  ADD_CONTACTS_SUCCESS,
  ADD_CONTACTS_FAILURE,
] = createRequestActionTypes('contact/ADD_CONTACTS');

const [
  DELETE_CONTACTS,
  DELETE_CONTACTS_SUCCESS,
  DELETE_CONTACTS_FAILURE,
] = createRequestActionTypes('contact/DELETE_CONTACTS');

const [
  GET_ITEMGROUP,
  GET_ITEMGROUP_SUCCESS,
  GET_ITEMGROUP_FAILURE,
] = createRequestActionTypes('contact/GET_ITEMGROUP');

const SET_CONTACTS = 'contact/SET_CONTACTS';

const MAPPING_USER_CHAT_ROOM = 'contact/MAPPING_USER_CHAT_ROOM';

const INIT = 'contact/INIT';

export const getContacts = createAction(GET_CONTACTS);
export const addContacts = createAction(ADD_CONTACTS);
export const deleteContacts = createAction(DELETE_CONTACTS);
export const getItemGroup = createAction(GET_ITEMGROUP);
export const mappingUserChatRoom = createAction(MAPPING_USER_CHAT_ROOM);
export const setContacts = createAction(SET_CONTACTS);
export const init = createAction(INIT);

const getContactsSaga = createRequestSaga(
  GET_CONTACTS,
  contactApi.getContactList,
  false,
);

function createAddContactsSaga(type) {
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
        message = covi.getDic("Msg_AddContacts_Success", "대화상대 추가에 성공했습니다.")
      } else {
        // 대화상대 추가 실패
        message = covi.getDic("Msg_AddContacts_Fail", "대화상대 추가에 실패했습니다.<br />잠시 후에 다시 시도해주세요.");
      }

      yield put({
        type: success ? SUCCESS : FAILURE,
        payload: response.data
      });

      //대화상대 추가 피드백 (팝업창)
      yield put(create({
        type: 'Alert',
        message,
        callback: () => {
        },
      }));
    } catch (err) {
      // request 에러
      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
        errMessage: err
      });
    }
  }
}

const addContactsSaga = createAddContactsSaga(ADD_CONTACTS);

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

            if (!parent.sub) parent.sub = [];
            parent.sub.push(userInfo);

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
      const filteredContacts = action.payload.result.map((list) => {
        // 그룹 내의 contact list iteration
        const filteredSub = list.sub && list.sub.filter((user) => {
          // id, name이 null일 경우 실제 유저 데이터가 아닌것으로 판단 => 필터링
          const userExists = user.id !== null && user.name !== null;
          return userExists;
        });

        return {
          ...list,
          sub: filteredSub
        };
      });
      return {
        ...state,
        contacts: filteredContacts,
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
  },
  initialState,
);

export default contact;
