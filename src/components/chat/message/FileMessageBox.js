import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import File from '@C/chat/message/types/file';
import { convertFileSize } from '@/lib/fileUpload/coviFile';
import { getDic } from '@/lib/util/configUtil';
import { openPopup } from '@/lib/common';
import { getFileExtension, openFilePreview } from '@/lib/fileUpload/coviFile';
import { isAllImage, downloadByTokenAll } from '@/lib/fileUpload/coviFile';
import FileThumbList from '@C/chat/message/types/FileThumbList';

const FileMessageBox = ({ _, fileObj, id, isTemp, inprogress, total }) => {
  const [downloading, setDownloading] = useState(false);
  const dispatch = useDispatch();
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
            <li>
              <span className="file-func-list">
                <span
                  className="file-func-txt"
                  onClick={downloading ? null : handleAllDownLoad}
                >
                  {downloading
                    ? covi.getDic('Compressing')
                    : covi.getDic('AllSave')}
                </span>
              </span>
            </li>
          </ul>
        </div>
      );
    } else {
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
            <li>
              <span className="file-func-list">
                <span
                  className="file-func-txt"
                  onClick={downloading ? null : handleAllDownLoad}
                >
                  {downloading
                    ? covi.getDic('Compressing')
                    : covi.getDic('AllSave')}
                </span>
              </span>
            </li>
          </ul>
          <p style={{ marginLeft: 15, padding: 10, color: '#999' }}>
            {inprogress &&
              total &&
              getDic('Upload') +
                ' (' +
                convertFileSize(inprogress) +
                ' / ' +
                convertFileSize(total) +
                ')'}
          </p>
        </div>
      );
    }
  };

  const handleAllDownLoad = async () => {
    const resp = await downloadByTokenAll(fileObj, setDownloading, true);
    setDownloading(false);
    if (resp !== null) {
      if (!resp.result) {
        openPopup(
          {
            type: 'Alert',
            message: resp.data.message,
          },
          dispatch,
        );
      } else {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_Save'),
          },
          dispatch,
        );
      }
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
        inprogress={inprogress}
        total={total}
      />
    );
  }
};

export default React.memo(FileMessageBox);
