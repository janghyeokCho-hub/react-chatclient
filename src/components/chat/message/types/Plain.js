import React, { useMemo } from 'react';

const plainTextConvert = (text = '') => {
  return text;
  // return text.replace(/ /gim, '\u00A0');
};

const style = {
  /**
   * 2021.05.13
   * 공백이 긴 경우 메시지가 auto newline 무시하는 현상 방지
   *
   * !! NOTE !!
   * 현재 Electron의 chromium 버전에서는 break-spaces 지원 안함
   * => 연속된 공백을 자동 newline 처리 대신 한칸의 공백으로 표현됨
   * 추후개선 필요
   */
  whiteSpace: 'break-spaces',
  // '!', '$', '(', ')' 등 break-all 스타일에서 auto newline 무시하는 문자 대응
  wordBreak: 'break-word',
};

const Plain = ({ marking, text }) => {
  const convertText = useMemo(() => plainTextConvert(text), [text]);

  if (!marking || (marking && !marking.trim())) {
    return <span style={style}>{convertText}</span>;
  }

  const regex = new RegExp('(' + marking + ')', 'gi');

  if (regex.test(text)) {
    const parts = text.split(regex);
    // reset lastIndex for reuse
    regex.lastIndex = 0;
    return (
      <span>
        {parts
          .filter(part => part)
          .map((part, i) => {
            const render = regex.test(part.toLowerCase());
            if (render) {
              return (
                <span
                  key={i}
                  style={{ backgroundColor: '#222', color: '#fff', ...style }}
                >
                  {plainTextConvert(part)}
                </span>
              );
            } else {
              return (
                <span key={i} style={style}>
                  {plainTextConvert(part)}
                </span>
              );
            }
          })}
      </span>
    );
  } else {
    return <span style={style}>{convertText}</span>;
  }
};

export default React.memo(Plain);
