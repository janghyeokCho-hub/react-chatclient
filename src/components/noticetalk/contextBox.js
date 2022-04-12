import React, { createRef, useCallback } from 'react';
import RequireIcon from '@/icons/svg/requireIcon';

const ContextBox = props => {
  const { setContext, url, setUrl, checkLink, setCheckLink, validURL } = props;
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
            <div style={{ display: 'flex' }}>
              <div>
                <label
                  className="string optional"
                  htmlFor="user-name"
                  style={{ cursor: 'inherit' }}
                >
                  <p>{covi.getDic('Context', '내용')}</p>
                </label>
              </div>
              <div className="RequireIcon">
                <RequireIcon />
              </div>
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
            <div className="add_link_container">
              <div className="addLink">
                <label for="inputUrl"> {covi.getDic('URL', 'URL: ')}</label>
                <input
                  value={url}
                  onChange={e => {
                    console.log(e.target.value);
                    setUrl(e.target.value);
                  }}
                  id="inputUrl"
                  type="text"
                />
              </div>
              <div className="warning_Box">
                {!validURL && (
                  <span className="warning_txt">
                    {covi.getDic(
                      'CheckURL',
                      '올바른 URL형식을 사용하고 있는지 확인하세요.',
                    )}
                  </span>
                )}
              </div>
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
};

export default ContextBox;
