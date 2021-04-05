import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import LatestMessage from '@/components/chat/chatroom/normal/LatestMessage';

let _normalUseScroll = false;
let beforeScrollHeight = 0;

const ListScrollBox = ({
  className,
  style,
  onClick,
  onScrollTop,
  pageInit,
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
    if (!_normalUseScroll) {
      // scroll 사용중이 아닌경우 항상 bottom 유지
      if (scrollBox) {
        scrollBox.current.scrollToBottom();
      }
    }
  }, [children]);

  const handleUpdate = useCallback(
    value => {
      const { top, scrollTop, scrollHeight, clientHeight } = value;

      if (top < 0.15) {
        onScrollTop();
      }

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
      if (
        top < 0.9 &&
        scrollHeight - (clientHeight + scrollTop) > clientHeight
      ) {
        setBtnBottom(true);
        _normalUseScroll = true;
        setShowReceive(true);
      } else {
        setBtnBottom(false);
        _normalUseScroll = false;
        setShowReceive(false);
      }
      */
    },
    [onScrollTop],
  );

  const renderView = useCallback(({ style }) => {
    // horizontalScroll margin 17px
    const viewStyle = {
      height: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    };
    return <div style={{ ...style, ...viewStyle }}></div>;
  }, []);

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

export default React.memo(ListScrollBox);
