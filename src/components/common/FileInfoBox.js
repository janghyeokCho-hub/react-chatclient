import React, { useEffect, useRef } from 'react';
import * as coviFile from '@/lib/fileUpload/coviFile';
import Config from '@/config/config';

const FileInfoBox = ({ tempId, fileInfo, onDelete }) => {
  const thumbNail = useRef(null);

  useEffect(() => {
    const fileCtrl = coviFile.getInstance();
    fileCtrl.imageProcessing(tempId, fileInfoObj => {
      thumbNail.current.src = fileInfoObj.thumbDataURL;
      // thumbNail.current.width = fileInfoObj.width;
      // thumbNail.current.height = fileInfoObj.height;
    });
  }, []);

  return (
    <li>
      <div
        className={`file-message ${coviFile.getFileExtension(fileInfo.ext)}`}
      >
        {(fileInfo.image && (
          <div
            style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              position: 'absolute',
              top: '50%',
              left: '20px',
              transform: 'translate(0, -50%)',
            }}
          >
            <img
              ref={thumbNail}
              src={`${Config.ServerURL.HOST}/storage/no_image.jpg`}
              width="40"
              height="40"
            ></img>
          </div>
        )) || <div className="file-type-ico"></div>}
        <div className="file-info-txt">
          <p className="file-name">
            {fileInfo.fileName}.{fileInfo.ext}
          </p>
          <p>{coviFile.convertFileSize(fileInfo.size)}</p>
        </div>

        <span
          className="del"
          onClick={e => {
            onDelete(tempId);
          }}
        ></span>
      </div>
    </li>
  );
};

export default FileInfoBox;
