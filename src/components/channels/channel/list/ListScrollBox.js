import React, { useState, useEffect, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import LatestMessage from '@C/channels/channel/list/LatestMessage';

let _normalUseScroll = false;
let beforeScrollHeight = 0;
const ListScrollBox = ({
  className,
  style,
  onClick,
  onScrollTop,
  onScrollBottom,
  loadingPage,
  pageInit,
  isTopEnd,
  isBottomEnd,
  isClickNewMessageSeperator,
  isShowNewMessageSeperator,
  handleShowNewMessageSeperator,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const [btnBottom, setBtnBottom] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const scrollBox = useRef();
  const bottomBtn = useRef();

  useEffect(() => {
    setMounted(true);

    return () => {
      if (scrollBox) {
        scrollBox.current.container.onclick = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mounted && scrollBox) {
      scrollBox.current.scrollToBottom();

      scrollBox.current.container.onclick = e => {
        onClick();
      };
    }
  }, [mounted]);

  useEffect(() => {
    // if (!useScroll) {
    if (!_normalUseScroll && !isClickNewMessageSeperator) {
      // scroll 사용중이 아닌경우 항상 bottom 유지
      if (scrollBox) {
        scrollBox.current.scrollToBottom();
      }
    }
  }, [children]);

  const handleUpdate = value => {
    const { top, scrollTop, scrollHeight, clientHeight } = value;

    // 사용자가 수동으로 스크롤을 '여기까지 앍었습니다' 가 보일 때까지 조정되도록
    if (isShowNewMessageSeperator && !isClickNewMessageSeperator) {
      const ele = document.getElementById('newMessageSeperator');
      if (ele) {
        if (Math.floor(ele.offsetTop) > Math.floor(scrollTop)) {
          handleShowNewMessageSeperator(false);
        }
      }
    }
    //

    if (top < 0.15 && !loadingPage && !isTopEnd) {
      onScrollTop();
    }

    if (top > 0.85 && !loadingPage && !isBottomEnd) {
      onScrollBottom();
    }

    // TODO: 다른 사람이 보낸 메시지 도착 시 아래로 가지않도록 수정 필요
    if (isBottomEnd) {
      if (scrollHeight > clientHeight) {
        if (beforeScrollHeight == scrollHeight && top <= 0.99) {
          _normalUseScroll = true;
          setBtnBottom(true);
          setShowReceive(true);
        }

        if (top > 0.99) {
          _normalUseScroll = false;
          setBtnBottom(false);
          setShowReceive(false);
        }
      }

      beforeScrollHeight = scrollHeight;

      /*
      // 한페이지 이상 스크롤을 올렸을 경우
      if (
        top < 0.9 &&
        scrollHeight - (clientHeight + scrollTop) > clientHeight
      ) {
        setBtnBottom(true);
        setUseScroll(true);
        setShowReceive(true);
      } else {
        setBtnBottom(false);
        setUseScroll(false);
        setShowReceive(false);
      }
      */
    }
  };

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
      >
        {children}
      </Scrollbars>
      {(btnBottom || showReceive) && (
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
          {btnBottom && (
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
                setShowReceive(false);
                _normalUseScroll = false;
                pageInit();
                scrollBox.current.scrollToBottom();
                e.preventDefault();
                e.stopPropagation();
              }}
            ></button>
          )}
          {showReceive && <LatestMessage></LatestMessage>}
        </div>
      )}
    </>
  );
};

export default ListScrollBox;
