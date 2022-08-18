import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import File from '@C/chat/message/types/file';
import Progress from '@C/common/buttons/Progress';
import { convertFileSize } from '@/lib/fileUpload/coviFile';
import { openPopup } from '@/lib/common';
import { getFileExtension, openFilePreview } from '@/lib/fileUpload/coviFile';
import { isAllImage, downloadByTokenAll } from '@/lib/fileUpload/coviFile';
import FileThumbList from '@C/chat/message/types/FileThumbList';
import MessageReplyBox from '@/components/reply/MessageReplyBox';
import styled from 'styled-components';

const FileMessageDiv = styled.div`
  margin-top: 5px;
`;

const FileMessageListDiv = styled.div`
  margin-top: 5px;
  color: #999;
  min-width: 220px;
  max-width: 270px;
  display: inline-block;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  box-sizing: border-box;
  text-align: left;
  position: relative;
  padding: 10px;
  cursor: pointer;
`;

const UploadProgressP = styled.p`
  margin-left: 15;
  padding: 10;
  color: '#999';
`;

const FileMessageBox = ({
  _,
  fileObj,
  isTemp,
  inprogress,
  total,
  id,
  isMine,
  context,
  replyID,
  replyInfo,
  goToOriginMsg,
  roomType = 'CHAT',
}) => {
  const replyView = replyID > 0 && !context;
  const filePermission = useSelector(({ login }) => login.filePermission);
  const [progressData, setProgressData] = useState(null);
  const dispatch = useDispatch();
  const handleFileList = fileObj => {
    let isAllImg = isAllImage(fileObj);
    if (isAllImg) {
      return (
        <div
          key={`file_img_list_${id}`}
          className="file-thumb-message-list"
          id={id ? id : undefined}
          style={{ paddingTop: replyView ? '10px' : undefined }}
        >
          <ul
            className="file-list"
            style={{ maxWidth: '220px', minWidth: '220px' }}
          >
            {fileObj.map((item, index) => {
              return (
                <FileThumbList
                  key={`img_thumb_${id}_${index}`}
                  index={index}
                  len={fileObj.length}
                  type="list"
                  item={item}
                  preview={handlePreview}
                  isTemp={isTemp}
                />
              );
            })}
            {filePermission.download === 'Y' && (
              <li>
                <span className="file-func-list">
                  <span
                    onClick={progressData ? null : handleAllDownLoad}
                    style={{
                      color: !replyView
                        ? '#999'
                        : isMine === 'Y'
                        ? '#fff'
                        : '#999',
                    }}
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
        <FileMessageListDiv key={`file_list_${id}`} id={id ? id : undefined}>
          <ul className="file-list">
            {fileObj.map((item, index) => {
              return (
                <File
                  key={`file_${id}_${index}`}
                  type="list"
                  item={item}
                  preview={handlePreview}
                  isTemp={isTemp}
                  replyView={replyView}
                />
              );
            })}
            {filePermission.download === 'Y' && (
              <li>
                <span className="file-func-list">
                  <span onClick={progressData ? null : handleAllDownLoad}>
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
          <UploadProgressP>
            {inprogress &&
              total &&
              covi.getDic('Upload', '업로드 중') +
                ' (' +
                convertFileSize(inprogress) +
                ' / ' +
                convertFileSize(total) +
                ')'}
          </UploadProgressP>
        </FileMessageListDiv>
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

  let returnJSX = [];

  if (Array.isArray(fileObj)) {
    returnJSX.push(handleFileList(fileObj));
  } else {
    returnJSX.push(
      <File
        key={`file_unit_${id}`}
        id={id ? id : undefined}
        type="unit"
        item={fileObj}
        preview={handlePreview}
        isTemp={isTemp}
        inprogress={inprogress}
        total={total}
        replyView={replyView}
      />,
    );
  }

  if (replyView) {
    returnJSX.unshift(
      <MessageReplyBox
        key={`message_reply_box_${id}`}
        replyID={replyID}
        replyInfo={replyInfo}
        goToOriginMsg={goToOriginMsg}
        roomType={roomType}
      />,
    );
    return (
      <FileMessageDiv
        key={`file_message_div_${id}`}
        id={id ? id : undefined}
        className="msgtxt"
      >
        {returnJSX}
      </FileMessageDiv>
    );
  } else {
    return returnJSX;
  }
};

export default React.memo(FileMessageBox);
