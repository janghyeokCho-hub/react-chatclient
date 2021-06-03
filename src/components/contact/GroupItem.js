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
import EditGroup from "./EditGroup";


/* 
    임의 그룹 하위 그룹 아이템 컴포넌트
*/
const GroupItem = ({ contact, groupItem, viewType, checkObj }) => {
    
    const dispatch = useDispatch();
    const [isopen, setIsopen] = useState(false);

    const subDivEl = useRef(null);

    useEffect(() => {
        setIsopen(false)
    }, []);

    const handleIsOpen = useCallback(()=>{
        setIsopen(!isopen);
        if (isopen) subDivEl.current.style.display = 'none';
        else {
            subDivEl.current.style.display = '';
        }
    }, [isopen]);

    const menus = useMemo(() => {
      const returnMenu = [];
      //임의그룹 contextMenu 추가 로직
  
      return returnMenu;
    }, [groupItem, contact, dispatch, viewType]);
  
    const EditGroupOpen = useCallback(()=>{
        openLayer(
            {
              component: <EditGroup 
                    headerName={covi.getDic('그룹정보 변경')}
                    isNewRoom={true}
                    group={groupItem}
              />,
            },
            dispatch,
          );
      }, [dispatch]);

    return (
        <>
            <RightConxtMenu menuId={`groupFD_${contact.folderID}`} menus={menus}>
                <div className={["contextArea", 'group'].join(" ")}>
                    <a
                    className={['ListDivisionLine', isopen ? 'show' : '','customGroup'].join(' ')}
                    onClick={handleIsOpen}
                    >
                    <span>
                        {"┗   "}{getDictionary(groupItem.groupName)}{' '}
                        {(groupItem.sub ? `(${groupItem.sub.length})` : `(0)`)}
                    </span>
                    </a>
                </div>
                {viewType == 'list'  ? <div className={['editGroupBtn'].join(' ')} onClick={EditGroupOpen}></div> : null}
            </RightConxtMenu>
            <ul className={["groupPeople",  isopen ? 'show' : ''].join(" ")} ref={subDivEl}>
                <RightConxtMenu menuId={`group_${groupItem.id}_${contact.folderID}`} menus={menus}>
                    {groupItem.sub && groupItem.sub.map(subItem =>{  
                        return(
                            <UserInfoBox 
                                key={`${groupItem.groupID}_${subItem.targetId}`} 
                                userInfo={subItem} 
                                isInherit={true} 
                                isClick={true} 
                                checkObj={checkObj} 
                            />
                        )
                    })}
                </RightConxtMenu>
            </ul>
      </>
    );
};

export default React.memo(GroupItem);
