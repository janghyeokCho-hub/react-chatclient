import React, { useCallback } from 'react';
import { getConfig } from '@/lib/util/configUtil';
import { useSelector } from 'react-redux';

const synapDocViewServer = getConfig('SynapDocViewServer');

const FileMenuBox = ({
  onPreview,
  onDownload,
  onViewer,
  onDownloadWithOpen,
  downloaded,
  onOpen,
  fontSize,
}) => {
  const filePermission = useSelector(({ login }) => login.filePermission);
  const handleOpenFile = useCallback(() => {
    onOpen(false);
  }, [onOpen]);

  const handleOpenPath = useCallback(() => {
    onOpen(true);
  }, [onOpen]);

  return (
    <span className="file-func-list" style={{ fontSize }}>
      {!downloaded && (
        <>
          {onPreview && typeof onPreview === 'function' && (
            <span
              className="file-func-txt"
              onClick={onPreview}
              style={{
                gridColumn: 'auto',
              }}
            >
              {covi.getDic('Preview', '미리보기')}
            </span>
          )}
          {filePermission.download === 'Y' &&
            onDownload &&
            typeof onDownload === 'function' && (
              <span
                className="file-func-txt"
                onClick={onDownload}
                style={{
                  gridColumn: 'auto',
                }}
              >
                {covi.getDic('Save', '저장')}
              </span>
            )}
          {filePermission.download === 'Y' &&
            onDownloadWithOpen &&
            typeof onDownloadWithOpen === 'function' && (
              <span
                className="file-func-txt"
                onClick={onDownloadWithOpen}
                style={{
                  gridColumn: 'auto',
                }}
              >
                {covi.getDic('SaveAndOpen', '저장 후 열기')}
              </span>
            )}
        </>
      )}
      {!downloaded &&
        DEVICE_TYPE === 'd' &&
        filePermission.viewer === 'Y' &&
        synapDocViewServer && (
          <span
            className="file-func-txt"
            onClick={onViewer}
            style={{
              gridColumnStart: 3,
              gridColumnEnd: 4,
            }}
          >
            {covi.getDic('RunViewer', '뷰어로 열기')}
          </span>
        )}

      {downloaded && DEVICE_TYPE === 'd' && (
        <>
          {filePermission.viewer === 'Y' &&
            onPreview &&
            typeof onPreview === 'function' && (
              <span
                className="file-func-txt"
                onClick={onPreview}
                style={{
                  gridColumn: 'auto',
                }}
              >
                {covi.getDic('Preview', '미리보기')}
              </span>
            )}
          <span
            className="file-func-txt"
            onClick={handleOpenFile}
            style={{
              gridColumn: 'auto',
            }}
          >
            {covi.getDic('Open', '열기')}
          </span>
          <span
            className="file-func-txt"
            onClick={handleOpenPath}
            style={{
              gridColumnStart: 3,
              gridColumnEnd: 4,
            }}
          >
            {covi.getDic('OpenFolder', '폴더 열기')}
          </span>
        </>
      )}
    </span>
  );
};

export default React.memo(FileMenuBox);
