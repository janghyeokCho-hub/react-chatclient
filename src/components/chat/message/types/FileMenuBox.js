import React, { useEffect, useCallback } from 'react';
import { getConfig } from '@/lib/util/configUtil';

const synapDocViewServer = getConfig('SynapDocViewServer');
const fileAttachViewMode = getConfig('FileAttachViewMode');

const FileMenuBox = ({
  onPreview,
  onDownload,
  onViewer,
  onDownloadWithOpen,
  downloaded,
  onOpen,
  fontSize,
}) => {
  const handleOpenFile = useCallback(() => {
    onOpen(false);
  }, [onOpen]);

  const handleOpenPath = useCallback(() => {
    onOpen(true);
  }, [onOpen]);

  return (
    <span className="file-func-list" style={{ fontSize }}>
      {!downloaded &&
        fileAttachViewMode &&
        fileAttachViewMode[0].type === 'PC' &&
        fileAttachViewMode[0].Download === true && (
          <>
            {onPreview && typeof onPreview === 'function' && (
              <span className="file-func-txt" onClick={onPreview}>
                {covi.getDic('Preview', '미리보기')}
              </span>
            )}
            {onDownload && typeof onDownload === 'function' && (
              <>
                {fileAttachViewMode &&
                  fileAttachViewMode[0].type === 'PC' &&
                  fileAttachViewMode[0].Download === true && (
                    <span className="file-func-txt" onClick={onDownload}>
                      {covi.getDic('Save', '저장')}
                    </span>
                  )}
              </>
            )}
            {onDownloadWithOpen &&
              typeof onDownloadWithOpen === 'function' &&
              fileAttachViewMode &&
              fileAttachViewMode[0].type === 'PC' &&
              fileAttachViewMode[0].Download === true && (
                <span className="file-func-txt" onClick={onDownloadWithOpen}>
                  {covi.getDic('SaveAndOpen', '저장 후 열기')}
                </span>
              )}
          </>
        )}
      {!downloaded &&
        DEVICE_TYPE === 'd' &&
        synapDocViewServer &&
        fileAttachViewMode &&
        fileAttachViewMode[0].type === 'PC' &&
        fileAttachViewMode[0].Viewer === true && (
          <span className="file-func-txt" onClick={onViewer}>
            {covi.getDic('RunViewer', '뷰어로 열기')}
          </span>
        )}

      {downloaded && DEVICE_TYPE === 'd' && (
        <>
          {onPreview && typeof onPreview === 'function' && (
            <span className="file-func-txt" onClick={onPreview}>
              {covi.getDic('Preview', '미리보기')}
            </span>
          )}
          <span className="file-func-txt" onClick={handleOpenFile}>
            {covi.getDic('Open', '열기')}
          </span>
          <span className="file-func-txt" onClick={handleOpenPath}>
            {covi.getDic('OpenFolder', '폴더 열기')}
          </span>
        </>
      )}
    </span>
  );
};

export default React.memo(FileMenuBox);
