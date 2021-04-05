import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@COMMON/popup/Alert';
import Confirm from '@COMMON/popup/Confirm';
import Prompt from '@COMMON/popup/Prompt';
import Custom from '@COMMON/popup/Custom';
import Toast from '@COMMON/popup/Toast';
import Select from '@COMMON/popup/Select';
/*
  하단 주석에 사용예제 있음.
*/

const SimplePopup = () => {
  const popups = useSelector(
    ({ popup }) => popup.popups,
    (left, right) => left.length == right.length,
  );
  const toasts = useSelector(
    ({ popup }) => popup.toasts,
    (left, right) => left.length == right.length,
  );

  const popupSelector = useCallback(() => {
    const openPop = popups[0];
    const popType = openPop.type;

    if (popType === 'Alert') {
      return <Alert key={openPop.id} popObj={openPop}></Alert>;
    } else if (popType === 'Confirm') {
      return <Confirm key={openPop.id} popObj={openPop}></Confirm>;
    } else if (popType === 'Prompt') {
      return <Prompt key={openPop.id} popObj={openPop}></Prompt>;
    } else if (popType === 'Select') {
      return <Select key={openPop.id} popObj={openPop}></Select>;
    } else if (popType === 'Custom') {
      return <Custom key={openPop.id} popObj={openPop}></Custom>;
    }
  }, [popups]);

  const toastSelector = useCallback(() => {
    const openToast = toasts[0];
    return <Toast key={openToast.id} popObj={openToast}></Toast>;
  }, [toasts]);

  return (
    <>
      {popups.length > 0 && popupSelector()}
      {toasts.length > 0 && toastSelector()}
    </>
  );
};

export default SimplePopup;

/*

<button
        type="button"
        onClick={() => {
          common.openPopup(
            {
              type: 'Custom',
              message: '표시할 팝업 메시지 입니다.',
              initValue: 'Prompt의 경우 초기 값을 지정할 수 있습니다.',
              btns: {
                btnTrue: {
                  color: 'gray',
                  text: '확인',
                  callback: () => {
                    console.log('true');
                  },
                },
                btnFalse: {
                  color: 'red',
                  text: '취소',
                  callback: () => {
                    console.log('false');
                  },
                },
                btnETC: {
                  color: 'blue',
                  text: '기타',
                  callback: () => {
                    console.log('etc');
                  },
                },
              },
              hold: false,
              close: true,
            },
            dispatch,
          );
        }}
      >
        Custom Popup open
      </button>

      <button
        type="button"
        onClick={() => {
          common.openPopup(
            {
              type: 'Alert',
              message: '표시할 팝업 메시지 입니다.',
              callback: () => {
                console.log('Alert');
              },
            },
            dispatch,
          );
        }}
      >
        Alert
      </button>

      <button
        type="button"
        onClick={() => {
          common.openPopup(
            {
              type: 'Prompt',
              message: '표시할 메시지',
              initValue: 'Prompt의 경우 초기 값을 지정할 수 있습니다.',
              callback: result => {
                console.log(result);
              },
            },
            dispatch,
          );
        }}
      >
        Prompt
      </button>

      <button
        type="button"
        onClick={() => {
          common.openPopup(
            {
              type: 'Confirm',
              message: '표시할 메시지',
              callback: result => {
                console.log(result);
              },
            },
            dispatch,
          );
        }}
      >
        Confirm
      </button>


*/
