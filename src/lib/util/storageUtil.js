let db = null;

const DATABASE = 'EUMTALK';
// DB_VERSION UPGRAGE :: 2020-06-15 - 2
const DB_VERSION = 2;

export const createStorage = () => {
  // DB 생성
  const req = indexedDB.open(DATABASE, DB_VERSION);

  // DB 생성 성공
  req.onsuccess = e => {
    db = req.result;
  };
  // DB 생성 오류
  req.onerror = e => {
    console.error('indexedDB : ', e.target.errorCode);
    db = null;
  };

  // DB 마그레이션 - Version 상승 또는 새로만들어질때만 실행
  req.onupgradeneeded = e => {
    db = req.result;

    if (!db.objectStoreNames.contains('files')) {
      const storeFile = e.currentTarget.result.createObjectStore('files', {
        keyPath: 'token',
      });
      storeFile.createIndex('path', 'path', { unique: false });
    }

    if (!db.objectStoreNames.contains('backgrounds')) {
      const storeBackground = e.currentTarget.result.createObjectStore(
        'backgrounds',
        {
          keyPath: 'roomID',
        },
      );
      storeBackground.createIndex('background', 'background', {
        unique: false,
      });
    }
  };
};

const getObjectStore = (store_name, mode) => {
  if (db != null)
    return db.transaction(store_name, mode).objectStore(store_name);
  else return null;
};

// 데이터 입력 (차후 다른용도로 사용 시 소스 리팩터링 필요)
export const insert = (storeName, data, callback) => {
  let store = getObjectStore(storeName, 'readwrite');
  if (store != null) {
    let req = null;
    try {
      req = store.add(data);

      req.onsuccess = () => {
        callback({ status: 'SUCCESS' });
      };

      req.onerror = () => {
        callback({ status: 'FAILURE' });
      };
    } catch (e) {}
  }
};

// 데이터 조회 (차후 다른용도로 사용 시 소스 리팩터링 필요)
export const get = (storeName, key, callback) => {
  let store = getObjectStore(storeName, 'readonly');
  if (store != null) {
    let req = null;
    try {
      req = store.get(key);

      req.onsuccess = () => {
        if (req.result) callback({ status: 'SUCCESS', data: req.result });
        else callback({ status: 'NORESULT', data: null });
      };

      req.onerror = () => {
        callback({ status: 'FAILURE' });
      };
    } catch (e) {}
  }
};

// 데이터 삭제 (차후 다른용도로 사용 시 소스 리팩터링 필요)
export const remove = (storeName, key, callback) => {
  let store = getObjectStore(storeName, 'readwrite');
  if (store != null) {
    let req = null;
    try {
      req = store.delete(key);

      req.onsuccess = () => {
        callback({ status: 'SUCCESS' });
      };

      req.onerror = () => {
        callback({ status: 'FAILURE' });
      };
    } catch (e) {}
  }
};

// 데이터 업데이트 (차후 다른용도로 사용 시 소스 리팩터링 필요)
export const update = (storeName, data, callback) => {
  let store = getObjectStore(storeName, 'readwrite');
  if (store != null) {
    let req = null;
    try {
      req = store.put(data);

      req.onsuccess = () => {
        callback({ status: 'SUCCESS' });
      };

      req.onerror = () => {
        callback({ status: 'FAILURE' });
      };
    } catch (e) {}
  }
};
