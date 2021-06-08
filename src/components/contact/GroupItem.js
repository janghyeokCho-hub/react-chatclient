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
import { openPopup, getDictionary, openLayer} from '@/lib/common';
import { openChatRoomView } from '@/lib/roomUtil';
import { removeCustomGroup, deleteGroupMember } from "@/modules/contact";
import EditGroup from "./EditGroup";

/* 
  그룹 하위 유저 컴포넌트
*/
const GroupUserItem = React.memo(({contact, groupItem, userInfo, checkObj}) => {
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
            onClick: () =>{
                //그룹멤버 삭제
                console.log("그룹멤버 삭제")
                console.log(groupItem.folderID, userInfo.id)
                //dispatch(deleteGroupMember({members:[{id: userInfo.id}], group: {id: groupItem.id}}));
            },
            name: covi.getDic('그룹멤버 삭제')
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
                            viewType,
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
        });
        return returnMenu;
    }, [groupItem, userInfo, dispatch, viewType, rooms, selectId, myInfo]);

    return (
        <RightConxtMenu menuId={`user_${groupItem.folderID}_${userInfo.id}_${contact.folderID}`} menus={menus}>
            <UserInfoBox 
                userInfo={userInfo} 
                isInherit={true} 
                isClick={true} 
                checkObj={checkObj} 
            />
        </RightConxtMenu>
    )
});

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
        setIsopen(false)
    }, []);

    const handleIsOpen = useCallback(()=>{
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
            onClick: () =>{
                EditGroupOpen();
            },
            name: covi.getDic('그룹정보 변경'),
        });
        returnMenu.push({
            code: 'deleteCustomGroup',
            isline: false,
            onClick: () =>{
                //커스텀그룹 삭제 Action 정의
                //console.log(groupItem);
                //dispatch(removeCustomGroup({group:groupItem}));
            },
            name: covi.getDic('그룹 삭제'),
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
                let userInfos = { id: contact.groupCode, type: contact.folderType };
    
                userInfos.sub = groupItem.sub;
                //userInfos.sub가 채팅방에 추가됨.
                //sub에 그룹모두를 넣어주면될듯함.
                openChatRoomView(
                    dispatch,
                    viewTypeChat,
                    rooms,
                    selectId,
                    userInfos,
                    myInfo,
                );
              }else
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
    }, [dispatch, groupItem, viewTypeChat, rooms, selectId, myInfo]);

    const EditGroupOpen = useCallback(()=>{
        openLayer(
            {
              component: <EditGroup 
                    headerName={covi.getDic('그룹정보 변경')}
                    group={groupItem}
              />,
            },
            dispatch,
          );
      }, [dispatch, groupItem]);

    return (
        <>
            <RightConxtMenu menuId={`groupFD_${groupItem.folderID}_${contact.folderID}`} menus={menus}>
                <div className={["contextArea"].join(" ")}>
                    <a
                    className={['ListDivisionLine', isopen ? 'show' : '','customGroup'].join(' ')}
                    onClick={handleIsOpen}
                    >
                    <span>
                        {"┗   "}{getDictionary(groupItem.folderName)}{' '}
                        {(groupItem.sub ? `(${groupItem.sub.length})` : `(0)`)}
                    </span>
                    </a>
                </div>
            </RightConxtMenu>
            <ul className={["groupPeople",  isopen ? 'show' : ''].join(" ")} ref={subDivEl}>
                {groupItem.sub && groupItem.sub.map(userInfo =>{  
                    return(
                        <GroupUserItem
                            key={`${groupItem.folderID}_${userInfo.id}`} 
                            contact={contact}
                            groupItem={groupItem}
                            userInfo={userInfo}
                            checkObj={checkObj}
                        />
                    )})}
            </ul>
      </>
    );
};

export default React.memo(GroupItem);
