import React, { useState, useEffect, useCallback } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { getVersions } from '@/lib/setting';

const Versions = ({ match }) => {
  const [versions, setVersions] = useState([]);
  const [selectIdx, setSelectIdx] = useState(-1);

  useEffect(() => {
    // versions 정보 조회
    getVersions({
      platform: match.params.platform,
      arch: match.params.arch,
    }).then(({ data }) => {
      if (data.status == 'SUCCESS') {
        setVersions(data.versions);
        setSelectIdx(0);
      }
    });
  }, []);

  return (
    <>
      <div
        style={{
          height: '100%',
          boxSizing: 'border-box',
          float: 'left',
          width: '220px',
        }}
      >
        <div
          className="Topheader"
          style={{ borderBottom: '1px solid #efefef' }}
        >
          <span className="TopTitle">
            eumtalk
            <span style={{ marginLeft: '10px', fontSize: '13px' }}>
              current v{APP_VERSION}
            </span>
          </span>
        </div>

        <Scrollbars
          style={{ height: 'calc(100% - 124px)' }}
          autoHide={true}
          className="MessageList"
        >
          <ul style={{ width: '100%' }}>
            {versions &&
              versions.map((item, index) => {
                return (
                  <li
                    key={item.version}
                    style={{
                      position: 'relative',
                      padding: '13px 15px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      backgroundColor: index == selectIdx ? '#f6f6f6' : '#fff',
                    }}
                    onClick={() => {
                      setSelectIdx(index);
                    }}
                  >
                    <div>{item.version}</div>
                  </li>
                );
              })}
          </ul>
        </Scrollbars>
      </div>
      <div
        style={{
          width: '400px',
          position: 'relative',
          float: 'left',
          height: '100%',
          display: 'inline-block',
          borderLeft: '1px solid #efefef',
          boxSizing: 'border-box',
          backgroundColor: '#fff',
        }}
      >
        {(versions &&
          versions[selectIdx] &&
          versions[selectIdx].releaseNote && (
            <Scrollbars style={{ height: '100%' }} autoHide={true}>
              <div
                style={{ padding: '30px 20px' }}
                dangerouslySetInnerHTML={{
                  __html: versions[selectIdx].releaseNote,
                }}
              ></div>
            </Scrollbars>
          )) || <div style={{ padding: '30px 20px' }}>No Content.</div>}
      </div>
    </>
  );
};

export default Versions;
