// orgchartitem
import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addFavorite, addContact } from '@/lib/contactUtil';
import RightConxtMenu from '@COMMON/popup/RightConxtMenu';
import UserInfoBox from '@COMMON/UserInfoBox';
import { openChatRoomView } from '@/lib/roomUtil';
import { openPopup } from '@/lib/common';
import { useSyncFavorite } from '@/hooks/useSyncFavorite';

const OrgChartItem = ({ result }) => {
  const contacts = useSelector(({ contact }) => contact.contacts);
  const viewType = useSelector(({ room }) => room.viewType);
  const rooms = useSelector(
    ({ room }) => room.rooms,
    (left, right) => left.length == right.length,
  );
  const selectId = useSelector(({ room }) => room.selectId);
  const myInfo = useSelector(({ login }) => login.userInfo);

  const dispatch = useDispatch();
  const { syncFavorite } = useSyncFavorite();

  const menus = useMemo(() => {
    const returnMenu = [];

    if (result.type == 'U') {
      const favoriteList =
        contacts.find(item => item.folderType == 'F') !== undefined
          ? contacts.find(item => item.folderType == 'F').sub
          : null;
      const contactList =
        contacts.find(item => item.folderType == 'C') !== undefined
          ? contacts.find(item => item.folderType == 'C').sub
          : null;
      let orgType = '';

      if (
        !favoriteList ||
        favoriteList.find(item => item.id == result.id) === undefined
      ) {
        if (
          !contactList ||
          contactList.find(item => item.id == result.id) === undefined
        ) {
          returnMenu.push({
            code: 'addContact',
            isline: false,
            onClick: () => {
              addContact(dispatch, result);
            },
            name: covi.getDic('AddContact'),
          });
        } else {
          orgType = 'C';
        }
        returnMenu.push({
          code: 'addFavorite',
          isline: false,
          onClick: () => {
            syncFavorite({
              op: 'add',
              userInfo: result,
              folderType: orgType
            });
          },
          name: covi.getDic('AddFavorite'),
        });
      }
    } else {
      if (contacts.find(item => item.groupCode == result.id) === undefined) {
        returnMenu.push({
          code: 'addContact',
          isline: false,
          onClick: () => {
            addContact(dispatch, result);
          },
          name: covi.getDic('AddContact'),
        });
      }
    }

    if (returnMenu.length > 0)
      returnMenu.push({
        code: 'line',
        isline: true,
        onClick: () => {},
        name: '',
      });

    returnMenu.push({
      code: 'startChat',
      isline: false,
      onClick: () => {
        if (result.pChat == 'Y')
          openChatRoomView(dispatch, viewType, rooms, selectId, result, myInfo);
        else
          openPopup(
            {
              type: 'Alert',
              message: covi.getDic('Msg_GroupInviteError'),
            },
            dispatch,
          );
      },
      name: covi.getDic('StartChat'),
    });

    return returnMenu;
  }, [result, contacts, viewType, rooms, selectId, myInfo, dispatch]);

  return (
    <RightConxtMenu
      menuId={`search_${result.id}_${result.deptCode}`}
      menus={menus}
    >
      <UserInfoBox
        userInfo={result}
        isInherit={false}
        isClick={result.type == 'U' ? true : false}
      />
    </RightConxtMenu>
  );
};

export default OrgChartItem;
