import React, { useState, useEffect, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

const NoticeScrollBox = ({
  className,
  style,
  onScrollTop,
  onScrollBottom,
  loadingPage,
  pageInit,
  isTopEnd,
  isBottomEnd,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentTop, setCurrentTop] = useState(0);
  const [useScroll, setUseScroll] = useState(false);
  const [btnBottom, setBtnBottom] = useState(false);
  const scrollBox = useRef();
  const bottomBtn = useRef();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && scrollBox) {
      scrollBox.current.scrollToBottom();
    }
  }, [mounted]);

  useEffect(() => {
    if (!useScroll) {
      // scroll 사용중이 아닌경우 항상 bottom 유지
      if (scrollBox) {
        scrollBox.current.scrollToBottom();
      }
    }
  }, [useScroll, children]);

  const handleUpdate = value => {
    const { top, scrollTop, scrollHeight, clientHeight } = value;

    setCurrentTop(top);

    if (top < 0.15 && !loadingPage && !isTopEnd) {
      onScrollTop();
    }

    if (top > 0.85 && !loadingPage && !isBottomEnd) {
      onScrollBottom();
    }

    // TODO: 다른 사람이 보낸 메시지 도착 시 아래로 가지않도록 수정 필요
    if (isBottomEnd) {
      // 한페이지 이상 스크롤을 올렸을 경우
      if (
        top < 0.9 &&
        scrollHeight - (clientHeight + scrollTop) > clientHeight
      ) {
        setBtnBottom(true);
        setUseScroll(true);
      } else {
        setBtnBottom(false);
        setUseScroll(false);
      }
    }
  };

  const handleScrollStart = () => {};

  const handleScrollStop = () => {};

  const renderView = ({ style }) => {
    // horizontalScroll margin 17px
    const viewStyle = {
      height: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    };
    return <div style={{ ...style, ...viewStyle }}></div>;
  };

  useEffect(() => {
    if (btnBottom) {
      window.covi.listBottomBtn = bottomBtn.current;
    }
  }, [btnBottom]);

  return (
    <>
      <Scrollbars
        className={className}
        style={style}
        ref={scrollBox}
        onUpdate={handleUpdate}
        renderView={renderView}
        renderTrackHorizontal={() => <div style={{ display: 'none' }} />}
        onScrollStart={handleScrollStart}
        onScrollStop={handleScrollStop}
      >
        {children}
      </Scrollbars>
      {btnBottom && (
        <div
          style={{
            position: 'fixed',
            bottom: '144px',
            right: '21px',
            height: '40px',
            minWidth: '200px',
            maxWidth: '400px',
          }}
        >
          <button
            className="ChatDownBtn"
            style={{
              position: 'absolute',
              right: '5px',
              bottom: '0px',
            }}
            ref={bottomBtn}
            type="button"
            onClick={e => {
              setBtnBottom(false);
              setUseScroll(false);
              pageInit();
              scrollBox.current.scrollToBottom();
              e.preventDefault();
              e.stopPropagation();
            }}
          ></button>
        </div>
      )}
    </>
  );
};

export default NoticeScrollBox;
