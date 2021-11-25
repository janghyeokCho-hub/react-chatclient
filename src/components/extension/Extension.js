import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import SearchIcon from '@/icons/svg/Search';
import ExtensionBox from '@C/extension/ExtensionBox';
import { sendMain } from '@/lib/deviceConnector';

import { extensionAdd } from '@/modules/extension';

const extensionItemList = [
  {
    extensionId: 1,
    title: '그룹웨어',
    description: '메신저에서 그룹웨어를 사용해보세요',
    type: 'I',
    downloadURL: 'http://192.168.11.126:8080',
    photoPath: 'http://192.168.11.80/storage/no_image.jpg',
    createDate: new Date(),
    updateDate: new Date(),
    owner: 'ldh',
    version: '1.0.0',
    iconPath: 'http://192.168.11.80/storage/extension/3.svg',
  },
  {
    extensionId: 2,
    title: '메모이음',
    description: '메모를 통해 업무 능력을 향상시켜보세요',
    type: 'V',
    downloadURL: 'http://10.10.32.111:8080/Memo.js',
    photoPath: 'http://192.168.11.80/storage/no_image.jpg',
    createDate: new Date(),
    updateDate: new Date(),
    owner: 'ldh',
    version: '1.0.0',
    iconPath: 'http://192.168.11.80/storage/extension/2.svg',
  },
  {
    extensionId: 3,
    title: '웨더리음',
    description: '오늘의 날씨 정보를 실시간으로 받아보세요',
    type: 'V',
    downloadURL: 'http://10.10.32.111:8080/WeatherChecker.js',
    photoPath: 'http://192.168.11.80/storage/no_image.jpg',
    createDate: new Date(),
    updateDate: new Date(),
    owner: 'ldh',
    version: '1.0.0',
    iconPath: 'http://192.168.11.80/storage/extension/1.svg',
  },
  {
    extensionId: 4,
    title: '겜이음',
    description: '심심할 땐 게임으로 스트레스를 풀어보세요',
    type: 'V',
    downloadURL: 'http://10.10.32.111:8080/2048.js',
    photoPath: 'http://192.168.11.80/storage/no_image.jpg',
    createDate: new Date(),
    updateDate: new Date(),
    owner: 'ldh',
    version: '1.0.0',
    iconPath: 'http://192.168.11.80/storage/extension/4.svg',
  },
];

const Extension = () => {
  const searchInput = useRef(null);

  const handleSearch = () => {};

  const dispatch = useDispatch();

  useEffect(() => {
    searchInput.current.focus();
  }, []);

  const extensionList = useSelector(
    ({ extension }) => extension.extensions,
    shallowEqual,
  );

  if (extensionList?.length > 0) {
    return (
      <div className="extension-wrap" style={{ margin: '20px 15px' }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            display: 'inline-block',
            marginBottom: 15,
          }}
        >
          익스텐션
        </span>
        <div className="Searchbar">
          <input
            ref={searchInput}
            type="text"
            placeholder={'검색할 익스텐션 이름/카테고리를 입력하세요'}
            onChange={e => {
              onChange(e.target.value);
            }}
            onKeyDown={e => {
              if (e.keyCode == 13) {
                handleSearch();
              }
            }}
          />
          <SearchIcon onClick={handleSearch} />
        </div>
        <p
          style={{ color: '#999', fontWeight: 'bold', margin: '5px 0px' }}
        >{`익스텐션 목록 (${extensionItemList.length})`}</p>
        <ul>
          {extensionItemList &&
            extensionItemList.map(extension => {
              let find = extensionList.find(
                x => x.extensionId == extension.extensionId,
              );
              if (!find) {
                return (
                  <li>
                    <ExtensionBox
                      extensionId={extension.extensionId}
                      title={extension.title}
                      subtitle={extension.description}
                      photoPath={extension.photoPath}
                      isInstalled={false}
                      handleClick={() => {
                        sendMain('onExtensionEvent', extension);
                        dispatch(extensionAdd(extension));
                      }}
                    />
                  </li>
                );
              } else {
                return (
                  <li>
                    <ExtensionBox
                      extensionId={extension.extensionId}
                      title={extension.title}
                      subtitle={extension.description}
                      photoPath={extension.photoPath}
                      isInstalled={true}
                      handleClick={() => {
                        sendMain('onExtensionEvent', extension);
                        dispatch(extensionAdd(extension));
                      }}
                    />
                  </li>
                );
              }
            })}
        </ul>
      </div>
    );
  } else {
    return (
      <div className="extension-wrap" style={{ margin: '20px 15px' }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            display: 'inline-block',
            marginBottom: 15,
          }}
        >
          익스텐션
        </span>
        <div className="Searchbar">
          <input
            ref={searchInput}
            type="text"
            placeholder={'검색할 익스텐션 이름/카테고리를 입력하세요'}
            onChange={e => {
              onChange(e.target.value);
            }}
            onKeyDown={e => {
              if (e.keyCode == 13) {
                handleSearch();
              }
            }}
          />
          <SearchIcon onClick={handleSearch} />
        </div>
        <p
          style={{ color: '#999', fontWeight: 'bold', margin: '5px 0px' }}
        >{`익스텐션 목록 (${extensionItemList.length})`}</p>
        <ul>
          {extensionItemList &&
            extensionItemList.map(extension => {
              return (
                <li>
                  <ExtensionBox
                    extensionId={extension.extensionId}
                    title={extension.title}
                    subtitle={extension.description}
                    photoPath={extension.photoPath}
                    isInstalled={false}
                    handleClick={() => {
                      sendMain('onExtensionEvent', extension);
                      dispatch(extensionAdd(extension));
                    }}
                  />
                </li>
              );
            })}
        </ul>
      </div>
    );
  }
};

export default React.memo(Extension);
