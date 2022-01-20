import { useEffect } from 'react';
import LRU from 'lru-cache';
import useSWR from 'swr';
import qs from 'qs';
import produce from 'immer';
import { chatsvr, managesvr, filesvr } from '@/lib/api';
import { getDictionary } from '@/lib/common';
import { getAesUtil } from '@/lib/aesUtil';

// 데이터 split 구분자
export const NOTE_DATA_SEPARATOR = '$$';
export const NOTE_RECEIVER_SEPARATOR = '|';

// 긴급쪽지(컴플라이언스) 표기 전용 특수문자
export const emergencyMark = '❗';
export const nonEmergencyMark = '❕';

/**
 * 2021.07.08
 *
 * 단일창 상태(Web 버전/확장모드)에서 쪽지 반복 조회시 데이터 캐싱
 *
 * Future Works
 * 1. 서버 설정(UseNote)에서 만료시간 제어
 * 2. 일렉트론에서 새창으로 쪽지 열때에도 캐시데이터 활용 (IPC 기반 구현 필요)
 */
// const cachedNote = new LRU({
//     // 캐시에 저장할 최대 쪽지수
//     max: 20,
//     // 만료시간 15분
//     maxAge: 1000 * 60 * 15
// });

export function convertTimeFormat(timestamp) {
  if (!timestamp) {
    return '';
  }

  const sendDate = new Date(timestamp);
  const date = sendDate.toLocaleDateString('ko-KR').slice(0, -1); // 날짜 포맷 끝의 '.' 제거
  const time = sendDate.toLocaleTimeString('en-US', { hour12: false });
  return `${date} ${time}`;
}

export function useViewType(initialData = 'receive') {
  const state = useSWR('/note/viewType', null, { initialData });
  return [state.data, state.mutate];
}

export function useViewState(
  initialData = { type: null, noteId: null, noteInfo: null },
) {
  const state = useSWR('/note/state', null, { initialData });
  // getter, setter, clear
  return [state.data, state.mutate, () => state.mutate(initialData)];
}

export function useSearchState(initialData) {
  const state = useSWR('/note/list/search', null, { initialData });
  return [state.data, state.mutate];
}

export const SORT = {
  NAME: 'senderName',
  DATE: 'sendDate',
  ASC: 'A',
  DESC: 'D',
};
export function useSortState({ initialize = false } = {}) {
  const initialData = {
    sortName: SORT.DATE,
    sort: SORT.DESC,
  };
  const state = useSWR('/note/list/sort', null, initialize && { initialData });
  return {
    ...state,
    reverse(sort) {
      return sort === SORT.DESC ? SORT.ASC : SORT.DESC;
    },
    toggle(sortName) {
      if (sortName !== SORT.NAME && sortName !== SORT.DATE) {
        return;
      }
      return state.mutate(prev =>
        produce(prev, draft => {
          console.log(
            `Change to ${draft[sortName]} => ${this.reverse(draft[sortName])}`,
          );
          draft[sortName] = this.reverse(draft[sortName]);
        }),
      );
    },
  };
}

/**
 * viewType
 * 보관함 | 수신함 | 발신함
 * 'archive' | 'receive' | 'send'
 *
 * TODO:
 * 쪽지조회 / 수신여부조회는 지속적인 요청이 발생하므로
 * State 기반 Data fetcing에 특화된 swr 기반 구현 예정
 * 참고: https://www.npmjs.com/package/swr
 */

export async function getNoteList(path, sortName, sort) {
  const queryParams = {
    sortName,
    sort,
  };
  const result = await managesvr(
    'GET',
    path + qs.stringify(queryParams, { addQueryPrefix: true }),
    {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  );
  if (result && result.data && result.data.status === 'SUCCESS') {
    return result.data.result;
  }
}

// 쪽지 목록 조회
export function useNoteList({ viewType = 'receive' }) {
  const path = `/note/list/${viewType}`;
  const state = useSWR(path, null);
  const searchState = useSWR('/note/list/tmp', null, { initialData: null });

  return {
    ...state,
    data: searchState.data ? searchState.data : state.data,
    async search(searchText, sortName, sort) {
      const queryParams = {
        value:
          typeof searchText === 'string' && searchText.length
            ? searchText
            : undefined,
        sortName,
        sort,
      };
      const result = await managesvr(
        'GET',
        path + qs.stringify(queryParams, { addQueryPrefix: true }),
        {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      );
      if (result && result.data && result.data.status === 'SUCCESS') {
        searchState.mutate(result.data.result, false);
      }
    },
    clearSearchResult() {
      searchState.mutate(null, false);
    },
    find(noteId) {
      return state.data?.find(note => note.noteId === noteId);
    },
    removeNote(_viewType, noteId) {
      const targetNoteIdx = state.data?.findIndex(
        note => note.noteId === noteId,
      );
      // 대상 쪽지가 state 내에 없거나 viewType mismatch인 경우 로직 생략
      if (targetNoteIdx >= 0 === false || viewType !== _viewType) {
        return;
      }
      return state.mutate(prev =>
        produce(prev, draft => {
          // 캐시에 남아있는 쪽지 데이터 삭제 TODO
          // cachedNote.del(targetNoteIdx);

          // state에서 쪽지 삭제
          draft.splice(targetNoteIdx, 1);
        }),
      );
    },
    readNote(_viewType, noteId) {
      const targetNoteIdx = state.data?.findIndex(
        note => note.noteId === noteId,
      );

      // 대상 쪽지가 state 내에 없거나 viewType mismatch인 경우 로직 생략
      if (targetNoteIdx >= 0 === false || viewType !== _viewType) {
        return;
      }

      return state.mutate(prev =>
        produce(prev, draft => {
          const targetNote = draft[targetNoteIdx];
          // update readFlag
          targetNote &&
            draft.splice(targetNoteIdx, 1, {
              ...targetNote,
              readFlag: 'Y',
            });
        }),
      );
    },
  };
}

// 쪽지 내용 조회
export async function getNote(noteId) {
  // 페이지 초기 렌더링시 noteId 없이 getNote가 호출됨: AJAX 요청 생략
  if (typeof noteId === 'undefined' || noteId === null) {
    return null;
  }
  const response = await managesvr('get', `/note/read/${noteId}`);

  if (response.data.status === 'SUCCESS') {
    if (Array.isArray(response.data.result) === true) {
      return {
        ...response.data.result[0],
        files: response.data.file,
      };
    }
    return {
      ...response.data.result,
      files: response.data.file,
    };
  }
}

export function useNoteState(noteId) {
  const KEY = '/note/read';
  // noteId가 없을 땐 fetcher 파라미터를 제거하여 불필요한 ajax request 방지
  const state = useSWR(KEY, noteId ? () => getNote(noteId) : null, {
    revalidateOnFocus: false,
  });

  return {
    ...state,
    async mutateNote(newNoteId) {
      try {
        // 캐시에 쪽지 조회 내역이 남아있으면 ajax request 생략 TODO
        // const cachedNoteInfo = cachedNote.get(newNoteId);
        // if(cachedNoteInfo) {
        //     console.log('Note fetched from LRU cache  ', cachedNoteInfo);
        //     return state.mutate(cachedNoteInfo, false);
        // }

        // 캐시에 없거나 만료되었으면 서버에 새로 request
        const noteInfo = await getNote(newNoteId);
        // cachedNote.set(newNoteId, noteInfo);
        console.log('Note fetched   ', noteInfo);
        return state.mutate(noteInfo, false);
      } catch (err) {
        console.log('Note Fetch Error   ', err);
        return state.mutate(null, false);
      }
    },
  };
}

export function calculateNoteUnreadCount(list) {
  if (!list || list.length === 0) {
    return 0;
  } else {
    const cnt = list.reduce((acc, cur, i) => {
      if (cur.readFlag === 'N') {
        return acc + 1;
      }
      return acc;
    }, 0);
    return cnt;
  }
}

export function useNoteUnreadCount() {
  // const { data: noteList } = useNoteList({ viewType: 'receive' });
  const { data: noteList, mutate: setNoteList } = useSWR(
    '/note/list/receive',
    null,
  );
  const { data: unreadCnt, mutate: setUnreadCnt } = useSWR(
    '/note/list/receive/unread',
    null,
  );

  async function initializeData() {
    if (location?.href.includes('notelist') === false) {
      const initialData = await getNoteList('/note/list/receive');
      setNoteList(initialData);
    }
  }

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    setUnreadCnt(calculateNoteUnreadCount(noteList));
  }, [noteList]);

  return unreadCnt;
}

// 쪽지 삭제
export function deleteNote({ viewType, noteId }) {
  return managesvr('delete', `/note/${viewType}/${noteId}`);
}

// 쪽지 보관
export function archiveNote({ noteId, sop }) {
  //PUT noteId
  return managesvr('put', `/note/${noteId}`, { sop });
}

// 쪽지 수신여부 조회
export function getReadList({ noteId }) {
  //GET noteId
  return managesvr('get', `/note/readlist/${noteId}`);
}

// 쪽지 즐겨찾기
export function setFavorite({ noteId, sop }) {
  //POST noteId
  return managesvr('post', `/note/favorites/${noteId}`, { sop });
}

// 파일 다운로드
export function downloadFile({
  userId = null,
  accessKey = null,
  serviceType = 'NOTE',
  downloadHandler = () => {},
}) {
  const module = 'CR';

  if (!userId || !accessKey) {
    return null;
  }

  //GET module userId accesskey serviceType
  return filesvr(
    'get',
    `/na/download/${module}/${userId}/${accessKey}/${serviceType}`,
    // `/download/${accessKey}`,
    {},
    {},
    downloadHandler,
  );
}

export async function makeZipFile(userId = null, files, handleProgress = null) {
  // 우선 쪽지에서만 사용
  const serviceType = 'NOTE';
  const module = 'CR';
  const JSZip = require('jszip')();

  // 모든 파일 size 합
  const totalSize = files.reduce((acc, cur) => {
    return (acc += cur.fileSize);
  }, 0);

  const results = await files.reduce(
    (prevPrms, currElem, i) =>
      prevPrms.then(async prevRes => {
        const currRes = await filesvr(
          'get',
          `/na/download/${module}/${userId}/${currElem.fileID}/${serviceType}`,
          {},
          {},
          e => {
            let { loaded } = e;
            if (typeof handleProgress === 'function') {
              // 현재 진행파일 이전 파일들의 size 합
              const completeSize = files.reduce((acc, cur, j) => {
                return i > j ? (acc += cur.fileSize) : acc;
              }, 0);

              handleProgress(loaded + completeSize, totalSize);
            }
          },
        );
        currRes.fileName = currElem.fileName;
        return [...prevRes, currRes];
      }),
    Promise.resolve([]),
  );

  for (const result of results) {
    if (result.status === 200) JSZip.file(result.fileName, result.data);
  }

  return { results, JSZip };
  /*
  return Promise.all(
    files.map(item => {
      return new Promise((resolve, reject) => {
        filesvr(
          'get',
          `/na/download/${module}/${userId}/${item.fileID}/${serviceType}`,
        )
          .then(resp => {
            if (resp.status === 200) JSZip.file(item.fileName, resp.data);
            resp.fileName = item.fileName;
            resolve(resp);
          })
          .catch(err => {
            console.error(err);
          });
      });
    }),
  )
    .then(results => {
      return { results, JSZip };
    })
    .catch(err => {
      console.error(err);
      return err;
    });
    */
}

// 쪽지 발송
// export function sendNote({ receiver, subject, context, files = [] }) {
export function sendNote({
  sender,
  receiveUser = [],
  receiveGroup = [],
  subject,
  context,
  files = [],
  fileInfos = [],
  isEmergency,
}) {
  const AESUtil = getAesUtil();
  const formData = new FormData();

  files.forEach(file => {
    console.log('Attach File   ', file);
    formData.append('files', file);
  });

  formData.append('fileInfos', JSON.stringify(fileInfos));
  formData.append('receiveUser', AESUtil.encrypt(JSON.stringify(receiveUser)));
  formData.append(
    'receiveGroup',
    AESUtil.encrypt(JSON.stringify(receiveGroup)),
  );
  formData.append('subject', subject);
  formData.append('context', context);
  formData.append('isEmergency', isEmergency);

  //POST
  return chatsvr('post', '/note/send', formData);
}

export function _translateName(user) {
  if (typeof user.displayName !== 'string') {
    // string이 아닐경우 다국어 처리 하지않고 원본 반환
    return user.displayName;
  }
  const name = getDictionary(user.displayName);
  const jp = user.jobPosition ? getDictionary(user.jobPosition) : '';

  return jp.length ? `${name} ${jp}` : name;
}

export function translateName(users) {
  if (Array.isArray(users) === true) {
    return users.map(user => _translateName(user)).join(', ');
  } else if (typeof users.displayName !== 'string') {
    // string이 아닐경우 다국어 처리 하지않고 원본 반환
    return users.displayName;
  }
  return _translateName(users);
}

/**
 * 쪽지 데이터에 sender* 키값으로 붙어온 senderInfo 획득
 * @param {NoteInfo | Object} info
 * @returns {Object}
 */
function _parseSenderInfo(info, opts) {
  const { jobPositionKey, nameKey } = opts;
  const returnData = {
    id: info.senderUserId,
    photoPath: info.senderPhotoPath,
    jobKey: info.senderJobKey,
    [nameKey]: info.senderDisplayName,
    // (가정) sender은 항상 유저
    type: 'U',
  };
  // localStorage 누락 or Electron 새창모드일 경우 데이터 일괄처리
  if (jobPositionKey === null) {
    returnData.LN = info.senderJobPositionName;
    returnData.PN = info.senderJobPositionName;
    returnData.TN = info.senderJobPositionName;
  } else {
    returnData[jobPositionKey] = info.senderJobPositionName;
  }
  // presence 옵션처리
  if (opts.removePresence === false) {
    returnData.presence = info.senderPresence;
  }

  if (typeof info.receiveDisplayName !== 'undefined') {
    const receivers = _parseReceiveData(
      { displayName: info.receiveDisplayName },
      opts,
    );
    return {
      sender: {
        ...returnData,
        /**
         * 2021.06.25
         * 쪽지 데이터의 sender.jobkey: number
         * 조직도 검색의 jobKey: string
         */
        ...(returnData?.jobKey && { jobKey: returnData.jobKey.toString() }),
      },
      receivers,
    };
  }

  return returnData;
}

/**
 * 문자열 파싱하여 sender 정보 획득
 *
 * 발신함
 * - displayName 포맷
 *      MY $$ {name}
 * 보관함
 * - 발신쪽지 displayName 포맷
 *      MY $$ {name} $$ {jobPosition}
 * - 수신쪽지 displayName 포맷
 *      S $$ {name} $$ {photoPath} $$ {jobPosition} $$ {id} $$ {presence}
 *
 * @param {string} data
 * @returns {Object}
 */
function _parseSenderData(data, opts) {
  try {
    const parsed = JSON.parse(data.displayName);
    if (Array.isArray(parsed) === true) {
      return parsed
        .map(info => {
          if (typeof info.displayName !== 'string') {
            return null;
          }
          const users = info.displayName.split(NOTE_DATA_SEPARATOR);
          const isMine = users[0] === 'MY';
          const { jobPositionKey } = opts;
          let returnData = null;

          if (isMine === true) {
            returnData = {
              isMine,
              displayName: users[1],
              [jobPositionKey]: users[2] || '',
            };
          } else {
            returnData = {
              isMine,
              displayName: users[1],
              photoPath: users[2],
              [jobPositionKey]: users[3] || '',
              id: users[4],
            };
            if (opts.removePresence === false) {
              returnData.presence = users[5];
            }
          }
          return returnData;
        })
        .filter(u => u !== null);
    }
  } catch (err) {
    console.info(err.message);
    return 'Unknown';
  }
}

/**
 * 문자열 파싱하여 receiver 정보 획득
 *
 * 쪽지조회
 * - receiveDisplayName 포맷
 *      S $$ {name} $$ {jobPosition}?
 *
 * @param {string} data
 * @returns {Object}
 */
function _parseReceiveData(data, opts) {
  try {
    const parsed = JSON.parse(data.displayName);
    const { jobPositionKey, nameKey } = opts;

    if (Array.isArray(parsed) === true) {
      return parsed
        .map(info => {
          if (typeof info.displayName !== 'string') {
            return null;
          }
          const users = info.displayName.split(NOTE_DATA_SEPARATOR);
          const isMine = users[0] === 'MY';
          if (users.length > 5) {
            /**
             * 유저일 경우
             * 0 isMine
             * 1 displayName
             * 2 jobPosition
             * 3 id
             * 4 photoPath
             * 5 companyCode
             * 6 jobKey
             */
            const jobPositionValue = users[2] || '';
            const returnData = {
              isMine,
              [nameKey]: users[1],
              id: users[3],
              photoPath: users[4],
              jobKey: users[6],
              type: 'U',
            };
            // localStorage 누락 or Electron 새창모드일 경우 데이터 일괄처리
            if (jobPositionKey === null) {
              returnData.LN = jobPositionValue;
              returnData.PN = jobPositionValue;
              returnData.TN = jobPositionValue;
            } else {
              returnData[jobPositionKey] = jobPositionValue;
            }
            return returnData;
          } else {
            /**
             * 그룹일 경우
             * 0 isMine
             * 1 displayName
             * 2 companyCode
             * 3 groupCode(id)
             */
            return {
              isMine,
              name: users[1],
              displayName: users[1],
              companyCode: users[2],
              id: users[3],
              type: 'G',
            };
          }
        })
        .filter(u => u !== null);
    }
  } catch (err) {
    console.info(err.message);
    return 'Unknown';
  }
}

export function parseSender(info, opts) {
  // opts 방어코드
  const defaultOpts = {
    useOrgChartFormat: false,
    removePresence: false,
  };
  const _opts = Object.assign(defaultOpts, opts);
  if (_opts.useOrgChartFormat) {
    _opts.jobPositionKey = localStorage.getItem('covi_user_jobInfo');
    _opts.nameKey = 'name';
  } else {
    _opts.jobPositionKey = 'jobPosition';
    _opts.nameKey = 'displayName';
  }

  const isReceiveData = typeof info?.senderUserId !== 'undefined';

  if (isReceiveData === true) {
    return _parseSenderInfo(info, _opts);
  } else {
    return _parseSenderData(info, _opts);
  }
}

export function getFileClass(extension) {
  if (typeof extension !== 'string') {
    return 'etc';
  }

  switch (extension.toLowerCase()) {
    // 문서
    case 'doc':
    case 'docx':
      return 'doc';
    // 이미지
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'bmp':
    case 'heif':
    case 'gif':
    case 'tiff':
    case 'raw':
      return 'img';
    // 엑셀
    case 'xls':
    case 'xlsx':
    case 'xlsm':
    case 'xlsb':
    case 'xltx':
    case 'xlt':
    case 'xlam':
      return 'xls';
    // 파워포인트
    case 'ppt':
    case 'pptx':
    case 'pptm':
    case 'pot':
    case 'potx':
    case 'potm':
      return 'ppt';
    case 'pdf':
      return 'pdf';
    //기타
    default:
      return 'etc';
  }
}
