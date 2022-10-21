import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import RightConxtMenu from '@COMMON/popup/RightConxtMenu';
import { openLink } from '@/lib/deviceConnector';
import { openLayer } from '@/lib/common';
import DocPropertyView from '@/components/chat/chatroom/layer/DocPropertyView';
import { modifyDocumentSetting } from '@/modules/document';

const DocumentItem = ({ item }) => {
  const dispatch = useDispatch();
  const handleChangeSetting = useCallback(
    value => {
      const params = {
        ...item,
        pinTop: value,
      };
      dispatch(modifyDocumentSetting(params));
    },
    [dispatch, item],
  );
  const menus = useMemo(() => {
    const returnMenu = [
      {
        code: `openDocumenu_${item.id}`,
        isline: false,
        onClick: () => {
          if (DEVICE_TYPE === 'd') {
            openLink(item.docURL);
          } else {
            window.open(item.docURL);
          }
        },
        name: covi.getDic('DocEdit', '문서 편집'),
      },
      {
        code: `viewDocumenu_${item.id}`,
        isline: false,
        onClick: () => {
          openLayer(
            {
              component: <DocPropertyView item={item} />,
            },
            dispatch,
          );
        },
        name: covi.getDic('ViewProperties', '속성 보기'),
      },
    ];

    if (!!item?.pinTop) {
      returnMenu.unshift({
        code: 'unpinDocument',
        isline: false,
        onClick: () => {
          handleChangeSetting('');
        },
        name: covi.getDic('UnpinToTop', '상단고정 해제'),
      });
    } else {
      returnMenu.unshift({
        code: 'pinDocument',
        isline: false,
        onClick: () => {
          const today = new Date();
          handleChangeSetting(`${today.getTime()}`);
        },
        name: covi.getDic('PinToTop', '상단고정'),
      });
    }

    if (returnMenu?.length) {
      returnMenu.push({
        code: 'line',
        isline: true,
        onClick: () => {},
        name: '',
      });
    }

    return returnMenu;
  }, [item]);

  const handleDocument = useCallback(() => {
    openLayer(
      {
        component: <DocPropertyView item={item} />,
      },
      dispatch,
    );
  }, [dispatch, item]);

  return (
    <RightConxtMenu
      key={`menu_document_${item.docID}`}
      menuId={`document_${item.docID}`}
      menus={menus}
    >
      <li
        key={`person_${item.docID}`}
        className="person"
        onDoubleClick={handleDocument}
      >
        <div className="name">{item.docTitle}</div>
        <span className="time">{!!item?.pinTop && `📌`}</span>
        <div className="team">{item.description}</div>
      </li>
    </RightConxtMenu>
  );
};

export default DocumentItem;
