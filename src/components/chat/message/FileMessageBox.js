import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import File from '@C/chat/message/types/file';
import Progress from '@C/common/buttons/Progress';
import { convertFileSize } from '@/lib/fileUpload/coviFile';
import { openPopup } from '@/lib/common';
import { getFileExtension, openFilePreview } from '@/lib/fileUpload/coviFile';
import { isAllImage, downloadByTokenAll } from '@/lib/fileUpload/coviFile';
import FileThumbList from '@C/chat/message/types/FileThumbList';

const FileMessageBox = ({ _, fileObj, id, isTemp, inprogress, total }) => {
  const filePermission = useSelector(({ login }) => login.filePermission);
  const [progressData, setProgressData] = useState(null);
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
            {filePermission.download === 'Y' && (
              <li>
                <span className="file-func-list">
                  <span
                    className="file-func-txt"
                    onClick={progressData ? null : handleAllDownLoad}
                  >
                    {progressData
                      ? `${covi.getDic(
                          'Downloading',
                          '다운로드중',
                        )} ( ${convertFileSize(
                          progressData.load,
                        )} / ${convertFileSize(progressData.total)} )`
                      : covi.getDic('AllSave', '일괄저장')}
                  </span>
                </span>
              </li>
            )}

            {progressData && (
              <li>
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: '-5px',
                    left: '0px',
                  }}
                >
                  <Progress
                    load={progressData.load}
                    total={progressData.total}
                    handleFinish={finishProgress}
                  ></Progress>
                </div>
              </li>
            )}
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
            {filePermission.download === 'Y' && (
              <li>
                <span className="file-func-list">
                  <span
                    className="file-func-txt"
                    onClick={progressData ? null : handleAllDownLoad}
                  >
                    {progressData
                      ? `${covi.getDic(
                          'Downloading',
                          '다운로드중',
                        )} ( ${convertFileSize(
                          progressData.load,
                        )} / ${convertFileSize(progressData.total)} )`
                      : covi.getDic('AllSave', '일괄저장')}
                  </span>
                </span>
              </li>
            )}

            {progressData && (
              <li>
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: '-5px',
                    left: '0px',
                  }}
                >
                  <Progress
                    load={progressData.load}
                    total={progressData.total}
                    handleFinish={finishProgress}
                  ></Progress>
                </div>
              </li>
            )}
          </ul>
          <p style={{ marginLeft: 15, padding: 10, color: '#999' }}>
            {inprogress &&
              total &&
              covi.getDic('Upload', '업로드 중') +
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
  /**
   * @param {*} load
   * @param {*} total
   */
  const handleProgress = useCallback((load, total) => {
    setProgressData({ load, total });
  }, []);

  const finishProgress = useCallback(() => {
    setProgressData(null);
  }, []);

  const handleAllDownLoad = async () => {
    const resp = await downloadByTokenAll(fileObj, true, handleProgress);
    openPopup(
      {
        type: 'Alert',
        message: resp.data?.message,
      },
      dispatch,
    );

    // 만료된 파일과 정상 파일 섞어서 다운로드시 Total size에 도달하지 못함
    setProgressData(null);
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
