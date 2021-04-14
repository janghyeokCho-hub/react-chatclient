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
}) => {
  console.log('downloaded', downloaded);
  const handleOpenFile = useCallback(() => {
    onOpen(false);
  }, [onOpen]);

  const handleOpenPath = useCallback(() => {
    onOpen(true);
  }, [onOpen]);

  return (
    <span className="file-func-list">
      {!downloaded &&
        fileAttachViewMode &&
        fileAttachViewMode[0].type === 'PC' &&
        fileAttachViewMode[0].Download === true && (
          <>
            {onPreview && typeof onPreview === 'function' && (
              <span className="file-func-txt" onClick={onPreview}>
                {covi.getDic('Preview')}
              </span>
            )}
            {onDownload && typeof onDownload === 'function' && (
              <>
                {fileAttachViewMode &&
                  fileAttachViewMode[0].type === 'PC' &&
                  fileAttachViewMode[0].Download === true && (
                    <span className="file-func-txt" onClick={onDownload}>
                      {covi.getDic('Save')}
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
                  {covi.getDic('SaveAndOpen')}
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
            {covi.getDic('RunViewer')}
          </span>
        )}

      {downloaded && DEVICE_TYPE === 'd' && (
        <>
          {onPreview && typeof onPreview === 'function' && (
            <span className="file-func-txt" onClick={onPreview}>
              {covi.getDic('Preview')}
            </span>
          )}
          <span className="file-func-txt" onClick={handleOpenFile}>
            {covi.getDic('Open')}
          </span>
          <span className="file-func-txt" onClick={handleOpenPath}>
            {covi.getDic('OpenFolder')}
          </span>
        </>
      )}
    </span>
  );
};

export default React.memo(FileMenuBox);
