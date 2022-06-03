import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getItemGroup } from '@/modules/contact';
import UserInfoBox from '@COMMON/UserInfoBox';
import { deleteContact } from '@/lib/contactUtil';
import RightConxtMenu from '@COMMON/popup/RightConxtMenu';
import { openChatRoomView } from '@/lib/roomUtil';
import { openPopup, getDictionary, openLayer } from '@/lib/common';
import GroupItem from '@C/contact/GroupItem';
import AddContact from '@C/contact/AddContact';
import { useSyncFavorite } from '@/hooks/useSyncFavorite';

const ContactItem = React.memo(
  ({ contact, subItem, isMine, chineseWall = [] }) => {
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

      if (subItem.type != 'G' && !isMine) {
        if (contact.folderType != 'F' && subItem.isContact != 'F') {
          returnMenu.push({
            code: 'addFavorite',
            isline: false,
            onClick: () => {
              syncFavorite({
                op: 'add',
                userInfo: subItem,
                folderType:
                  subItem.isContact && subItem.isContact != ''
                    ? subItem.isContact
                    : contact.folderType,
              });
            },
            name: covi.getDic('AddFavorite', '즐겨찾기 추가'),
          });

          if (contact.folderType != 'M' && contact.folderType != 'G') {
            returnMenu.push({
              code: 'deleteContact',
              isline: false,
              onClick: () => {
                deleteContact(
                  dispatch,
                  subItem.id,
                  contact.folderID,
                  contact.folderType,
                );
              },
              name: covi.getDic('DelContact', '내 대화상대 삭제'),
            });
          }
        } else {
          returnMenu.push({
            code: 'deleteFavorite',
            isline: false,
            onClick: () => {
              /**
               * 2021.11.29
               * 부서탭에서 '즐겨찾기 삭제'시 folderID 파라미터가 부서코드로 넘어가면 삭제오류 발생
               * => folderID 파라미터 "1"로 고정
               */
              deleteContact(dispatch, subItem.id, '1', 'F');
            },
            name: covi.getDic('DelFavorite', '즐겨찾기 삭제'),
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
          if (subItem.pChat == 'Y')
            openChatRoomView(
              dispatch,
              viewType,
              rooms,
              selectId,
              subItem,
              myInfo,
            );
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
    }, [subItem, contact, dispatch, viewType, rooms, selectId, myInfo]);

    return (
      <RightConxtMenu
        menuId={`contact_${subItem.id}_${contact.folderID}`}
        menus={menus}
      >
        <UserInfoBox
          userInfo={subItem}
          isInherit={true}
          isClick={true}
          chineseWall={chineseWall}
        />
      </RightConxtMenu>
    );
  },
);

const Contact = ({ contact, viewType, checkObj, chineseWall = [] }) => {
  const userID = useSelector(({ login }) => login.id);
  const myInfo = useSelector(({ login }) => login.userInfo);
  const viewTypeChat = useSelector(({ room }) => room.viewType);
  const rooms = useSelector(
    ({ room }) => room.rooms,
    (left, right) => left.legnth == right.length,
  );
  const selectId = useSelector(({ room }) => room.selectId);

  const [isopen, setIsopen] = useState(true);
  const [isload, setIsload] = useState(false);
  const subDivEl = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (contact.sub === undefined && contact.folderType == 'G') {
      setIsopen(false);
      setIsload(false);
    }
  }, [contact.sub]);

  const handleIsOpen = useCallback(
    evt => {
      setIsopen(!isopen);
      if (isopen) subDivEl.current.style.display = 'none';
      else {
        if (contact.folderType == 'G' && !isload) {
          setIsload(true);
          dispatch(
            getItemGroup({
              folderID: contact.groupCode,
              folderType: contact.folderType,
            }),
          );
        }
        subDivEl.current.style.display = '';
      }
    },
    [contact, isopen, isload, dispatch],
  );

  const menus = useMemo(() => {
    const returnMenu = [];
    /* 
      사용자그룹 헤더에는 대화생성 기능제외, 그룹생성기능추가 
    */

    if (contact.folderType === 'R') {
      returnMenu.push({
        code: 'createCustomGroup',
        isline: false,
        onClick: () => {
          addGroupOpen();
        },
        name: covi.getDic('Create_Group', '그룹 생성'),
      });
    } else {
      returnMenu.push({
        code: 'startChat',
        isline: false,
        onClick: () => {
          if (contact.pChat == 'Y') {
            let userInfos = { id: contact.groupCode, type: contact.folderType };

            if (contact.folderType != 'G') {
              userInfos.sub = contact.sub;
            }

            if (
              contact.folderType != 'G' &&
              (!userInfos.sub || userInfos.sub.length == 0)
            ) {
              openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic(
                    'Msg_EmptyChatMember',
                    '대화를 시작할 상대가 없습니다.',
                  ),
                },
                dispatch,
              );
            } else {
              openChatRoomView(
                dispatch,
                viewTypeChat,
                rooms,
                selectId,
                userInfos,
                myInfo,
              );
            }
          } else
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic(
                  'Msg_EmptyChatMember',
                  '대화를 시작할 상대가 없습니다.',
                ),
              },
              dispatch,
            );
        },
        name: covi.getDic('StartChat', '대화시작'),
      });
    }

    if (contact.folderType == 'G') {
      returnMenu.push({
        code: 'deleteContact',
        isline: false,
        onClick: () => {
          deleteContact(dispatch, null, contact.folderID, contact.folderType);
        },
        name: covi.getDic('DelContact', '내 대화상대 삭제'),
      });
    }

    return returnMenu;
  }, [dispatch, contact, userID, myInfo, viewTypeChat, rooms, selectId]);

  const addGroupOpen = useCallback(() => {
    openLayer(
      {
        component: <AddContact useGroup={true} />,
      },
      dispatch,
    );
  }, [dispatch]);

  return (
    <>
      <RightConxtMenu menuId={`contactFD_${contact.folderID}`} menus={menus}>
        <div className={['contextArea'].join(' ')}>
          <a
            className={[
              'ListDivisionLine',
              isopen ? 'show' : '',
              contact.folderType == 'R' ? 'customGroup' : '',
            ].join(' ')}
            onClick={handleIsOpen}
          >
            <span>
              {getDictionary(contact.folderName)}{' '}
              {(contact.folderType == 'F' ||
                contact.folderType == 'C' ||
                contact.folderType == 'R') &&
                (contact.sub ? `(${contact.sub.length})` : `(0)`)}
            </span>
          </a>
        </div>
      </RightConxtMenu>
      <ul className="people" ref={subDivEl}>
        {contact.folderType != 'R'
          ? contact.sub &&
            contact.sub.map((sub, idx) => {
              if (viewType == 'list') {
                // 자기자신과 대화 허용 20200720 작업시작 - shpark1
                return (
                  <ContactItem
                    key={contact.folderID + '_' + sub.id + idx}
                    contact={contact}
                    subItem={sub}
                    isMine={sub.id == userID}
                    chineseWall={chineseWall}
                  />
                );
              } else if (viewType == 'checklist') {
                return (
                  <UserInfoBox
                    key={contact.folderID + '_' + sub.id + idx}
                    userInfo={sub}
                    isInherit={false}
                    isClick={false}
                    checkObj={checkObj}
                    isMine={sub.id == userID}
                    chineseWall={chineseWall}
                  />
                );
              }
            })
          : contact.sub &&
            contact.sub.map(group => {
              return (
                <GroupItem
                  key={'group_' + contact.folderID + '_' + group.folderID}
                  contact={contact}
                  groupItem={group}
                  checkObj={checkObj}
                  viewType={viewType}
                />
              );
            })}
      </ul>
    </>
  );
};

export default React.memo(Contact);
