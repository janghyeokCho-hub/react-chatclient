import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RightConxtMenu from '@COMMON/popup/RightConxtMenu';
import UserInfoBox from '@COMMON/UserInfoBox';
import { openPopup, getDictionary, openLayer } from '@/lib/common';
import { openChatRoomView } from '@/lib/roomUtil';
import { removeCustomGroup } from '@/modules/contact';
import EditGroup from '@C/contact/EditGroup';

/* 
  그룹 하위 유저 컴포넌트
*/
const GroupUserItem = React.memo(
  ({ contact, groupItem, userInfo, checkObj }) => {
    const dispatch = useDispatch();
    const viewType = useSelector(({ room }) => room.viewType);
    const rooms = useSelector(
      ({ room }) => room.rooms,
      (left, right) => left.length == right.length,
    );
    const selectId = useSelector(({ room }) => room.selectId);
    const myInfo = useSelector(({ login }) => login.userInfo);

    const menus = useMemo(() => {
      const returnMenu = [];
      /* 
            유저/조직 부분 contextMenu : 대화 생성, 유저/조직 삭제 메뉴
        */
      returnMenu.push({
        code: 'deleteMember',
        isline: false,
        onClick: () => {
          const member =
            userInfo.type == 'U'
              ? { contactId: userInfo.id }
              : { contactId: userInfo.id, companyCode: userInfo.companyCode };
          //그룹 멤버/조직 단위 삭제 action
          dispatch(
            removeCustomGroup({
              folderId: groupItem.folderID,
              folderType: groupItem.folderType,
              ...member,
            }),
          );
        },
        name: covi.getDic('Delete_Group_Member', '그룹멤버 삭제'),
      });

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
          if (userInfo.pChat == 'Y') {
            openChatRoomView(
              dispatch,
              viewType,
              rooms,
              selectId,
              userInfo,
              myInfo,
            );
          } else
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
    }, [dispatch, userInfo, contact, viewType, rooms, selectId, myInfo]);

    return (
      <RightConxtMenu
        menuId={`user_${groupItem.folderID}_${userInfo.id}_${contact.folderID}`}
        menus={menus}
      >
        <UserInfoBox
          userInfo={userInfo}
          isInherit={true}
          isClick={true}
          checkObj={checkObj}
        />
      </RightConxtMenu>
    );
  },
);

/* 
    임의 그룹 하위 그룹 아이템 컴포넌트
*/
const GroupItem = ({ contact, groupItem, checkObj }) => {
  const myInfo = useSelector(({ login }) => login.userInfo);
  const viewTypeChat = useSelector(({ room }) => room.viewType);
  const rooms = useSelector(
    ({ room }) => room.rooms,
    (left, right) => left.legnth == right.length,
  );
  const selectId = useSelector(({ room }) => room.selectId);

  const dispatch = useDispatch();
  const [isopen, setIsopen] = useState(false);
  const subDivEl = useRef(null);

  useEffect(() => {
    setIsopen(false);
  }, []);

  const handleIsOpen = useCallback(() => {
    setIsopen(!isopen);
    subDivEl.current.style.display = isopen ? 'none' : '';
  }, [isopen]);

  const menus = useMemo(() => {
    const returnMenu = [];
    /*
        그룹 부분 cotextMenu : 그룹변경, 그룹삭제, 대화생성
    */
    returnMenu.push({
      code: 'modifyCustomGroup',
      isline: false,
      onClick: () => {
        EditGroupOpen();
      },
      name: covi.getDic('Chg_Group_Info', '그룹정보 변경'),
    });
    returnMenu.push({
      code: 'deleteCustomGroup',
      isline: false,
      onClick: () => {
        openPopup(
          {
            type: 'Confirm',
            title: covi.getDic('Eumtalk', '이음톡'),
            message: covi.getDic(
              'Confirm_Delete_Group',
              '해당 그룹을 삭제하시겠습니까?',
            ),
            initValue: '',
            callback: result => {
              if (result) {
                //사용자 그룹 단위 삭제 action
                dispatch(
                  removeCustomGroup({
                    folderId: groupItem.folderID,
                    folderType: groupItem.folderType,
                  }),
                );
              }
            },
          },
          dispatch,
        );
      },
      name: covi.getDic('Delete_Group', '그룹 삭제'),
    });

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
        if (contact.pChat == 'Y') {
          //그룹정보
          let groupInfos = {
            id: groupItem.folderID,
            type: groupItem.folderType,
          };

          openChatRoomView(
            dispatch,
            viewTypeChat,
            rooms,
            selectId,
            groupInfos,
            myInfo,
          );
        } else
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
  }, [dispatch, groupItem, viewTypeChat, rooms, selectId, myInfo]);

  const EditGroupOpen = useCallback(() => {
    openLayer(
      {
        component: (
          <EditGroup
            headerName={covi.getDic('Chg_Group_Info', '그룹정보 변경')}
            group={groupItem}
          />
        ),
      },
      dispatch,
    );
  }, [dispatch, groupItem]);

  return (
    <>
      <RightConxtMenu
        menuId={`groupFD_${groupItem.folderID}_${contact.folderID}`}
        menus={menus}
      >
        <div className={['contextArea'].join(' ')}>
          <a
            className={[
              'ListDivisionLine',
              isopen ? 'show' : '',
              'customGroup',
            ].join(' ')}
            onClick={handleIsOpen}
          >
            <span>{'┗ '}</span>
            <span className="groupName">
              {getDictionary(groupItem.folderName)}{' '}
            </span>
            <span>{groupItem.sub ? `(${groupItem.sub.length})` : `(0)`}</span>
          </a>
        </div>
      </RightConxtMenu>
      <ul
        className={['groupPeople', isopen ? 'show' : ''].join(' ')}
        ref={subDivEl}
      >
        {groupItem.sub &&
          groupItem.sub.map(userInfo => {
            return (
              <GroupUserItem
                key={`${groupItem.folderID}_${userInfo.id}`}
                contact={contact}
                groupItem={groupItem}
                userInfo={userInfo}
                checkObj={checkObj}
              />
            );
          })}
      </ul>
    </>
  );
};

export default React.memo(GroupItem);
