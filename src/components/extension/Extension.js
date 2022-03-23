import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import SearchIcon from '@/icons/svg/Search';
import ExtensionBox from '@C/extension/ExtensionBox';
import { sendMain, getExtension } from '@/lib/deviceConnector';

import { extensionAdd, extensionSet } from '@/modules/extension';

const extensionItemList = [
  {
    extensionId: 1,
    title: covi.getDic('Groupware', '그룹웨어'),
    description: covi.getDic(
      'Msg_tryGroupwareMessenger',
      '메신저에서 그룹웨어를 사용해보세요',
    ),
    type: 'I',
    downloadURL: 'http://192.168.11.126:8080',
    photoPath: 'http://192.168.11.80/storage/no_image.jpg',
    createDate: new Date(),
    updateDate: new Date(),
    owner: 'ldh',
    version: '1.0.0',
    iconPath: 'http://192.168.11.80/storage/extension/3.svg',
  },
];

const Extension = () => {
  const searchInput = useRef(null);

  const handleSearch = () => {};

  const dispatch = useDispatch();

  useEffect(() => {
    searchInput.current.focus();

    // load extension list
    const data = getExtension();
    if (data?.length > 0) {
      dispatch(extensionSet(data));
    }
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
          {covi.getDic('Extension', '익스텐션')}
        </span>
        <div className="Searchbar">
          <input
            ref={searchInput}
            type="text"
            placeholder={covi.getDic(
              'Msg_extensionSearch',
              '검색할 익스텐션 이름/카테고리를 입력하세요',
            )}
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
        >{`${covi.getDic('ExtensionList')} (${extensionItemList.length})`}</p>
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
          {covi.getDic('Extension', '익스텐션')}
        </span>
        <div className="Searchbar">
          <input
            ref={searchInput}
            type="text"
            placeholder={covi.getDic(
              'Msg_extensionSearch',
              '검색할 익스텐션 이름/카테고리를 입력하세요',
            )}
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
        >{`${covi.getDic('ExtensionList', '익스텐션 목록')} (${
          extensionItemList.length
        })`}</p>
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
