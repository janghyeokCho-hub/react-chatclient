import React, { createRef, useCallback, useState } from 'react';

function ContextBox(props) {
  const { setContext } = props;
  const [checkLink, setCheckLink] = useState(false);
  const editorRef = createRef();

  const handleKeyDown = useCallback(e => {
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      const cursorPosition = e.key === 'PageUp' ? 0 : e.target.textLength;
      e.preventDefault();
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, []);

  return (
    <div className="Layer-Note-Con" style={{ marginBottom: '60px' }}>
      <div className="Profile-info-input" style={{ textAlign: 'start' }}>
        <div className="input full">
          <div className="addLink">
            <div>
              <label
                className="string optional"
                htmlFor="user-name"
                style={{ cursor: 'inherit' }}
              >
                <p>{covi.getDic('Context', '내용')}</p>
              </label>
            </div>
            <div style={{ display: 'flex' }}>
              <input
                id="chkStyle04"
                className="chkStyle04"
                type="checkbox"
                onClick={() => setCheckLink(!checkLink)}
                checked={checkLink}
              />
              <label for="chkStyle04" className="Style04" />
              <p> {covi.getDic('AddLink', '바로가기 추가')}</p>
            </div>
          </div>
          {checkLink && (
            <div className="addLink">
              <label for="inputUrl">바로가기 URL: </label>
              <input id="inputUrl" type="text" />
            </div>
          )}
          <textarea
            ref={editorRef}
            onKeyDown={handleKeyDown}
            autoFocus
            className="messafe-to-send"
            onChange={e => {
              setContext(e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ContextBox;
