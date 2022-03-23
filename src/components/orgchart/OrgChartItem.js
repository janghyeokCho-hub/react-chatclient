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
            name: covi.getDic('AddContact', '내 대화상대 추가'),
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
              folderType: orgType,
            });
          },
          name: covi.getDic('AddFavorite', '즐겨찾기 추가'),
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
          name: covi.getDic('AddContact', '내 대화상대 추가'),
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
              message: covi.getDic(
                'Msg_GroupInviteError',
                '해당 그룹은 그룹채팅을 시작할 수 없습니다.',
              ),
            },
            dispatch,
          );
      },
      name: covi.getDic('StartChat', '대화시작'),
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
