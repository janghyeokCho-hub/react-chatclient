import React, { useMemo } from 'react';

const plainTextConvert = (text = '') => {
  return text;
  // return text.replace(/ /gim, '\u00A0');
};

const style = {
  whiteSpace: 'pre-wrap',
};

const Plain = ({ marking, text }) => {
  const convertText = useMemo(() => plainTextConvert(text), [text]);

  if (!marking || (marking && !marking.trim())) {
    return <span style={style}>{convertText}</span>;
  }

  const regex = new RegExp('(' + marking + ')', 'gi');

  if (regex.test(text)) {
    const parts = text.split(regex);
    return (
      <span>
        {parts
          .filter(part => part)
          .map((part, i) =>
            marking && part.toLowerCase() == marking.toLowerCase() ? (
              <span
                key={i}
                style={{ backgroundColor: '#222', color: '#fff', ...style }}
              >
                {plainTextConvert(part)}
              </span>
            ) : (
              <span key={i} style={style}>
                {plainTextConvert(part)}
              </span>
            ),
          )}
      </span>
    );
  } else {
    return <span style={style}>{convertText}</span>;
  }
};

export default React.memo(Plain);
