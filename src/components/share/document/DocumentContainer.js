import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SearchBar from '@COMMON/SearchBar';
import DocumentItems from './DocumentItems';
import { getDocuments } from '@/modules/document';
import { Scrollbars } from 'react-custom-scrollbars';

const DocumentContainer = () => {
  const dispatch = useDispatch();
  const { documents } = useSelector(({ document }) => document);

  const { id } = useSelector(({ login }) => ({
    id: login.id,
  }));
  const [docList, setDocList] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [unknownGroupData, setUnknownGroupData] = useState(null);
  const [unknownSearchData, setUnknownSearchData] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [listMode, setListMode] = useState('N'); //Normal, Search

  useEffect(() => {
    if (documents === null || !documents?.length) {
      dispatch(getDocuments(id));
    }
  }, [id]);

  useEffect(() => {
    if (documents?.length) {
      setDocList(documents);
    }
  }, [documents]);

  useEffect(() => {
    if (searchText !== '') {
      handleSearch();
    } else {
      setListMode('N');
    }
  }, [searchText]);

  useEffect(() => {
    if (docList) {
      // category => setting.category 로 변경시 보완작업 필요
      const data = docList.reduce(
        (result, item) => ({
          ...result,
          [item['category']]: [...(result[item['category']] || []), item],
        }),
        {},
      );
      let ordered = {};
      Object.keys(data)
        .sort((a, b) => {
          return a - b;
        })
        .forEach(key => {
          ordered[key] = data[key];
        });
      let unknownKey = [];
      if (ordered['']?.length) {
        unknownKey = unknownKey.concat(ordered['']);
        delete ordered[''];
      }
      if (ordered?.null?.length) {
        unknownKey = unknownKey.concat(ordered.null);
        delete ordered.null;
      }
      if (unknownKey) {
        let params = {};
        params[covi.getDic('Unspecified', '미지정')] = unknownKey;
        setUnknownGroupData(params);
      }
      setGroupData(ordered);
    }
  }, [docList]);

  const handleSearch = useCallback(async () => {
    const filterList = docList.filter(item => {
      let returnVal = false;
      if (item?.docTitle?.toLowerCase().includes(searchText.toLowerCase())) {
        return true;
      } else if (
        item?.description?.toLowerCase().includes(searchText.toLowerCase())
      ) {
        return true;
      } else if (
        item?.category?.toLowerCase().includes(searchText.toLowerCase())
      ) {
        return true;
      }

      return returnVal;
    });

    if (filterList) {
      const data = filterList.reduce(
        (result, item) => ({
          ...result,
          [item['category']]: [...(result[item['category']] || []), item],
        }),
        {},
      );
      let ordered = {};
      Object.keys(data)
        .sort((a, b) => {
          return a - b;
        })
        .forEach(key => {
          ordered[key] = data[key];
        });
      let unknownKey = [];
      if (ordered['']?.length) {
        unknownKey = unknownKey.concat(ordered['']);
        delete ordered[''];
      }
      if (ordered?.null?.length) {
        unknownKey = unknownKey.concat(ordered.null);
        delete ordered.null;
      }
      if (unknownKey) {
        let params = {};
        params[covi.getDic('Unspecified', '미지정')] = unknownKey;
        setUnknownSearchData(params);
      }
      setSearchData(ordered);
    }
    setListMode('S');
  }, [searchText, docList]);

  return (
    <>
      <SearchBar
        placeholder={covi.getDic(
          'Msg_DocSearch',
          '문서 제목, 설명, 카테고리 검색',
        )}
        input={searchText}
        onChange={e => {
          setSearchText(e.target.value);
        }}
      />

      <Scrollbars
        style={{ height: 'calc(100% - 124px)' }}
        autoHide={true}
        className="MessageList"
      >
        {listMode === 'N' &&
          unknownGroupData &&
          Object.entries(unknownGroupData).map(([key, items], index) => {
            let isFirstGroup = false;
            if (
              index === 0 &&
              (key === covi.getDic('Unspecified', '미지정') ||
                key === Object.keys(unknownGroupData)[0])
            ) {
              isFirstGroup = true;
            }

            return (
              <DocumentItems
                key={`docItems_${key}`}
                name={key}
                items={items.sort((a, b) => b.pinTop - a.pinTop)}
                isFirstGroup={isFirstGroup}
              />
            );
          })}
        {listMode === 'N' &&
          groupData &&
          Object.entries(groupData).map(([key, items], index) => {
            let isFirstGroup = false;
            if (
              !unknownGroupData &&
              index === 0 &&
              key === Object.keys(unknownGroupData)[0]
            ) {
              isFirstGroup = true;
            }
            return (
              <DocumentItems
                key={`docItems_${key}`}
                name={key}
                items={items.sort((a, b) => b.pinTop - a.pinTop)}
                isFirstGroup={isFirstGroup}
              />
            );
          })}

        {listMode === 'S' &&
          unknownSearchData &&
          Object.entries(unknownSearchData).map(([key, items], index) => {
            let isFirstGroup = false;
            if (
              index === 0 &&
              (key === covi.getDic('Unspecified', '미지정') ||
                key === Object.keys(unknownSearchData)[0])
            ) {
              isFirstGroup = true;
            }

            return (
              <DocumentItems
                key={`docItems_${key}`}
                name={key}
                items={items.sort((a, b) => b.pinTop - a.pinTop)}
                isFirstGroup={isFirstGroup}
              />
            );
          })}

        {listMode === 'S' &&
          searchData &&
          Object.entries(searchData).map(([key, items], index) => {
            let isFirstGroup = false;
            if (
              !unknownSearchData &&
              index === 0 &&
              key === Object.keys(unknownSearchData)[0]
            ) {
              isFirstGroup = true;
            }
            return (
              <DocumentItems
                key={`docItems_${key}`}
                name={key}
                items={items.sort((a, b) => b.pinTop - a.pinTop)}
                isFirstGroup={isFirstGroup}
              />
            );
          })}
      </Scrollbars>
    </>
  );
};

export default DocumentContainer;
