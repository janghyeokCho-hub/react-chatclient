import React, { Component } from 'react';
import { evalConnector } from '@/lib/deviceConnector';

class UnreadCntButton extends Component {
  componentDidMount() {
    if (DEVICE_TYPE != 'b') {
      const { unreadCnt } = this.props;
      if (unreadCnt > 0) {
        // hot
        evalConnector({
          method: 'send',
          channel: 'change-tray',
          message: {
            mode: true,
          },
        });
      }
    }
  }

  componentDidUpdate(prevProps, prevStates, snapshot) {
    if (DEVICE_TYPE != 'b') {
      const { unreadCnt } = this.props;

      // 반전된 경우에만 액션 호출
      if (prevProps.unreadCnt == 0 && unreadCnt > 0) {
        // hot
        evalConnector({
          method: 'send',
          channel: 'change-tray',
          message: {
            mode: true,
          },
        });
      } else if (prevProps.unreadCnt > 0 && unreadCnt == 0) {
        // normal
        evalConnector({
          method: 'send',
          channel: 'change-tray',
          message: {
            mode: false,
          },
        });
      }
    }
  }

  render() {
    const { unreadCnt } = this.props;

    return (
      <>
        {unreadCnt > 0 && (
          <span
            style={{
              background: '#F86A60',
              minWidth: '15px',
              height: '18px',
              borderRadius: '45%',
              position: 'absolute',
              top: '10px',
              left: '10px',
              textAlign: 'center',
              fontSize: '11px',
              lineHeight: '18px',
              color: '#fff',
              fontWeight: 'bold',
              padding: '0px 1.5px',
            }}
          >
            {unreadCnt > 99 ? '99+' : unreadCnt}
          </span>
        )}
      </>
    );
  }
}

export default UnreadCntButton;
