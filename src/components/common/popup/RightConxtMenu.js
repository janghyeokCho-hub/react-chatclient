import React, { useState, useCallback } from 'react';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';

// 오른쪽 버튼 클릭시 표시되는 팝업

const RightConxtMenu = ({ menuId, children, menus }) => (
  <>
    <ContextMenuTrigger id={menuId}>{children}</ContextMenuTrigger>
    {menus && (
      <ContextMenu id={menuId}>
        {menus.map(menu => {
          if (menu.isline) {
            return <MenuItem key={menu.code} divider />;
          } else {
            return (
              <MenuItem
                key={menu.code}
                onClick={e => {
                  menu.onClick(e);
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                {menu.name}
              </MenuItem>
            );
          }
        })}
      </ContextMenu>
    )}
  </>
);

export default React.memo(RightConxtMenu);
