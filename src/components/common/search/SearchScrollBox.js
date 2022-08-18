import React, { useState, useEffect, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { scrollIntoView } from '@/lib/util/domUtil';

const SearchScrollBox = ({
  className,
  style,
  onScrollTop,
  onScrollBottom,
  loadingPage,
  isTopEnd,
  isBottomEnd,
  moveId,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const scrollBox = useRef();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && scrollBox) {
    }
  }, [mounted]);

  useEffect(() => {
    if (moveId) {
      // 특정 객체를 가운데로 이동
      const moveObj = document.querySelector(`[data-messageid='${moveId}']`);
      if (moveObj) {
        scrollIntoView('center', moveObj.offsetParent);
        moveObj.classList.add('shake');
        // 다시 흔들림 효과를 주기 위해 event class 삭제
        setTimeout(() => {
          moveObj.classList.remove('shake');
        }, 500);
      } else {
        // scroll을 중앙으로 위치
        scrollBox.current.scrollTop(0.5);
      }
    }
  }, [moveId]);

  const handleUpdate = value => {
    const { top } = value;

    if (top < 0.15 && !loadingPage && !isTopEnd) {
      onScrollTop();
    }

    if (top > 0.85 && !loadingPage && !isBottomEnd) {
      onScrollBottom();
    }
  };

  const renderView = ({ style }) => {
    // horizontalScroll margin 17px
    const viewStyle = {
      height: '100%',
      overflowX: 'hidden',
    };
    return <div style={{ ...style, ...viewStyle }}></div>;
  };

  return (
    <>
      <Scrollbars
        className={className}
        style={style}
        ref={scrollBox}
        onUpdate={handleUpdate}
        renderView={renderView}
        renderTrackHorizontal={() => <div style={{ display: 'none' }} />}
      >
        {children}
      </Scrollbars>
    </>
  );
};

export default SearchScrollBox;
