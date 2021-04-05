import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import Check from '@COMMON/inputs/Check';
/*
  type="text"
  value={userId}
  placeholder={
    isExtUser ? covi.getDic('Email') : covi.getDic('LoginID')
  }
  onChange={e => onChangeId(e.target.value)}
  onKeyPress={handleKeyPress}
  className="LoginInput"
  disabled={loading}

*/

const MemoInput = forwardRef(
  (
    {
      memKey,
      changeValue,
      placeholder,
      value,
      onKeyPress,
      className,
      disabled,
    },
    ref,
  ) => {
    const prefix = 'eum:meminput';
    const [isMemoried, setIsMemoried] = useState(false);

    useEffect(() => {
      const memItem = localStorage.getItem(`${prefix}:${memKey}`);

      if (memItem) {
        changeValue(memItem);
        setIsMemoried(true);
      }
    }, []);

    const changeMemValue = useCallback(val => {
      localStorage.setItem(`${prefix}:${memKey}`, val);
    }, []);

    useEffect(() => {
      if (isMemoried) {
        // input 창에 있는 값 저장
        localStorage.setItem(`${prefix}:${memKey}`, value);
      } else {
        // localStorage에 저장되어있는 값 삭제
        localStorage.removeItem(`${prefix}:${memKey}`);
      }
    }, [isMemoried]);

    return (
      <div style={{ width: '100%', position: 'relative' }}>
        <Check
          style={{
            position: 'absolute',
            right: '5px',
            top: '10px',
            zIndex: '10',
          }}
          chkId={`${memKey}_check`}
          onChange={e => {
            setIsMemoried(e.target.checked);
          }}
          checked={isMemoried}
        ></Check>
        <input
          type="text"
          ref={ref}
          onChange={e => {
            const value = e.target.value;
            isMemoried && changeMemValue(value);
            changeValue(value);
          }}
          placeholder={placeholder}
          value={value}
          onKeyPress={onKeyPress}
          className={className}
          disabled={disabled}
        ></input>
      </div>
    );
  },
);

export default MemoInput;
