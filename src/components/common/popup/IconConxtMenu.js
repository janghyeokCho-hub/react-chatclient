import React, { useState, useCallback, useRef, useMemo } from 'react';
//import ContextMenu from '@COMMON/popup/ContextMenu';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';

// 아이콘 클릭시 표시되는 팝업

const IconConxtMenu = ({ menuId, children, menus }) => {
  const contextMenuTarget = useRef(null);

  const onClick = useCallback(e => {
    contextMenuTarget.current.handleContextClick(e);
  }, []);

  const drawMemu = useMemo(() => {
    return (
      <>
        <ContextMenuTrigger id={menuId} ref={contextMenuTarget}>
          <div style={{ cursor: 'pointer' }} onClick={onClick}>
            {children}
          </div>
        </ContextMenuTrigger>
        {menus && (
          <ContextMenu id={menuId}>
            {menus.map((menu, index) => {
              if (menu.isline) {
                return <MenuItem key={`menu_item_${index}`} divider />;
              } else {
                return (
                  <MenuItem key={`menu_item_${index}`} onClick={menu.onClick}>
                    {menu.name}
                  </MenuItem>
                );
              }
            })}
          </ContextMenu>
        )}
      </>
    );
  }, [menus, children]);

  return drawMemu;
};

export default React.memo(IconConxtMenu);
