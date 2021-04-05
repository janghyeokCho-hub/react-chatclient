import React, { useCallback } from 'react';
import File from '@C/chat/message/types/file';
import { getFileExtension, openFilePreview } from '@/lib/fileUpload/coviFile';
import { isAllImage } from '@/lib/fileUpload/coviFile';
import FileThumbList from '@C/chat/message/types/FileThumbList';

const FileMessageBox = ({ messageId, fileObj, id, isTemp }) => {
  const handleFileList = fileObj => {
    let isAllImg = isAllImage(fileObj);
    if (isAllImg) {
      return (
        <div className="file-thumb-message-list" id={id || ''}>
          <ul
            className="file-list"
            style={{ maxWidth: '306px', minWidth: '306px' }}
          >
            {fileObj.map((item, index) => {
              return (
                <FileThumbList
                  key={index}
                  index={index}
                  len={fileObj.length}
                  type="list"
                  item={item}
                  preview={handlePreview}
                  id={id}
                  isTemp={isTemp}
                />
              );
            })}
          </ul>
        </div>
      );
    } else {
      console.log('isAllImgElse');
      return (
        <div className="file-message-list" id={id || ''}>
          <ul className="file-list">
            {fileObj.map((item, index) => {
              return (
                <File
                  key={index}
                  type="list"
                  item={item}
                  preview={handlePreview}
                  id={id}
                  isTemp={isTemp}
                />
              );
            })}
          </ul>
        </div>
      );
    }
  };

  const handlePreview = useCallback(
    item => {
      if (DEVICE_TYPE == 'd') {
        let imageList = null;
        if (Array.isArray(fileObj)) {
          imageList = fileObj.filter(item => {
            return getFileExtension(item.ext) == 'img';
          });
        }
        const extension = getFileExtension(item.ext);

        if (extension == 'img') {
          if (imageList && imageList.length > 1) {
            openFilePreview(item, imageList, 'L', null);
          } else {
            openFilePreview(item, null, 'N', null);
          }
        }
      }
    },
    [fileObj],
  );

  if (Array.isArray(fileObj)) {
    return handleFileList(fileObj);
  } else {
    return (
      <File
        type="unit"
        item={fileObj}
        preview={handlePreview}
        id={id}
        isTemp={isTemp}
      />
    );
  }
};

export default React.memo(FileMessageBox);
