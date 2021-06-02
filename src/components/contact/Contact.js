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
import { addFavorite, deleteContact } from '@/lib/contactUtil';
import RightConxtMenu from '@COMMON/popup/RightConxtMenu';
import { openChatRoomView } from '@/lib/roomUtil';
import { openPopup, getDictionary, openLayer } from '@/lib/common';
import GroupItem from './GroupItem';
import AddGroup from './AddGroup';

const ContactItem = React.memo(({ contact, subItem, isMine }) => {
  const viewType = useSelector(({ room }) => room.viewType);
  const rooms = useSelector(
    ({ room }) => room.rooms,
    (left, right) => left.length == right.length,
  );
  const selectId = useSelector(({ room }) => room.selectId);
  const myInfo = useSelector(({ login }) => login.userInfo);

  const dispatch = useDispatch();

  const menus = useMemo(() => {
    const returnMenu = [];
    
    if (subItem.type != 'G' && !isMine) {
      if (contact.folderType != 'F' && subItem.isContact != 'F') {
        returnMenu.push({
          code: 'addFavorite',
          isline: false,
          onClick: () => {
            addFavorite(
              dispatch,
              subItem,
              subItem.isContact && subItem.isContact != ''
                ? subItem.isContact
                : contact.folderType,
            );
          },
          name: covi.getDic('AddFavorite'),
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
            name: covi.getDic('DelContact'),
          });
        }
      } else {
        returnMenu.push({
          code: 'deleteFavorite',
          isline: false,
          onClick: () => {
            deleteContact(dispatch, subItem.id, null, 'F');
          },
          name: covi.getDic('DelFavorite'),
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
              message: covi.getDic('Msg_GroupInviteError'),
            },
            dispatch,
          );
      },
      name: covi.getDic('StartChat'),
    });

    return returnMenu;
  }, [subItem, contact, dispatch, viewType, rooms, selectId, myInfo]);

  return (
    <RightConxtMenu
      menuId={`contact_${subItem.id}_${contact.folderID}`}
      menus={menus}
    >
      <UserInfoBox userInfo={subItem} isInherit={true} isClick={true} />
    </RightConxtMenu>
  );
});

const Contact = ({ contact, viewType, checkObj }) => {
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

  const handleIsOpen = useCallback((evt) => {
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
  }, [contact, isopen, isload, dispatch]);

  const menus = useMemo(() => {
    const returnMenu = [
      {
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
                  message: covi.getDic('Msg_EmptyChatMember'),
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
                message: covi.getDic('Msg_GroupInviteError'),
              },
              dispatch,
            );
        },
        name: covi.getDic('StartChat'),
      },
    ];
    if (contact.folderType == 'G') {
      returnMenu.push({
        code: 'deleteContact',
        isline: false,
        onClick: () => {
          deleteContact(dispatch, null, contact.folderID, contact.folderType);
        },
        name: covi.getDic('DelContact'),
      });
    }

    return returnMenu;
  }, [dispatch, contact, userID, myInfo, viewTypeChat, rooms, selectId]);
  
  const addGroupOpen = useCallback(()=>{
    openLayer(
      {
        component: <AddGroup />,
      },
      dispatch,
    );
  }, [dispatch]);

  return (
    <>
      <RightConxtMenu menuId={`contactFD_${contact.folderID}`} menus={menus}>
        <div className={["contextArea", contact.folderType == 'R' ? 'group': ''].join(" ")}>
          <a
            className={['ListDivisionLine', isopen ? 'show' : '', contact.folderType == 'R' ? 'customGroup': ''].join(' ')}
            onClick={handleIsOpen}
          >
            <span>
              {getDictionary(contact.folderName)}{' '}
              {(contact.folderType == 'F' || contact.folderType == 'C' || contact.folderType == 'R') &&
                (contact.sub ? `(${contact.sub.length})` : contact.groups ?  `(${contact.groups.length})` : `(0)`)}
            </span>
          </a>
        </div>
        {contact.folderType == 'R' ?  <div className={['addGroupBtn'].join(' ')} onClick={addGroupOpen}></div>: null}
      </RightConxtMenu>
      <ul className="people" ref={subDivEl}>
        {contact.sub ? contact.sub &&
          contact.sub.map(sub => {
            if (viewType == 'list') {
              // 자기자신과 대화 허용 20200720 작업시작 - shpark1
              return (
                <ContactItem
                  key={contact.folderID + '_' + sub.id}
                  contact={contact}
                  subItem={sub}
                  isMine={sub.id == userID}
                />
              );
            } else if (viewType == 'checklist') {
              return (
                <UserInfoBox
                  key={contact.folderID + '_' + sub.id}
                  userInfo={sub}
                  isInherit={false}
                  isClick={false}
                  checkObj={checkObj}
                  isMine={sub.id == userID}
                />
              );
            }
          }): 
          contact.groups && contact.groups.map(group =>{           
            console.log(contact.folderID, group.groupID)
            return(
              <GroupItem 
                key={'group'+contact.folderID + '_' + group.groupID}
                contact={contact}
                groupItem={group}  
                //isMine={sub.id == userID}//먼지파악필.
              />
            )
          })}
      </ul>
    </>
  );
};

export default React.memo(Contact);
