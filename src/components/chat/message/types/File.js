import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Progress from '@C/common/buttons/Progress';
import FileMenuBox from '@C/chat/message/types/FileMenuBox';
import {
  getFileExtension,
  convertFileSize,
  resizeImage,
  downloadByToken,
} from '@/lib/fileUpload/coviFile';
import * as messageApi from '@/lib/message';
import * as viewerApi from '@/lib/viewer';
import Config from '@/config/config';
import { openPopup } from '@/lib/common';
import { get, remove } from '@/lib/util/storageUtil';
import { openFile, openPath } from '@/lib/deviceConnector';
import { useChatFontSize } from '../../../../hooks/useChat';
import styled from 'styled-components';

const OneImageDiv = styled.div`
  padding-top: 10px;
  opacity: ${props => (props.progressData ? 0.5 : 1)};
  color: '#fff';
`;

const File = ({
  type,
  item,
  preview,
  id,
  isTemp,
  inprogress,
  total,
  replyView,
}) => {
  const extension = getFileExtension(item.ext);
  const [progressData, setProgressData] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const [fontSize] = useChatFontSize();
  const dispatch = useDispatch();
  const currentRoom = useSelector(({ room }) => room.currentRoom);
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);
  const roomID = useMemo(
    () => currentRoom?.roomID || currentChannel?.roomId,
    [currentRoom, currentChannel],
  );

  useEffect(() => {
    if (DEVICE_TYPE === 'd') {
      get('files', item.token, result => {
        if (result.status == 'SUCCESS') {
          if (result.data) setDownloaded(true);
        }
      });
    }
  }, []);

  const handlePreview = useCallback(() => {
    preview(item);
  }, [preview]);

  const handleDownload = useCallback(() => {
    downloadByToken(
      item.token,
      item.fileName,
      data => {
        if (data.result !== 'SUCCESS') {
          openPopup(
            {
              type: 'Alert',
              message: data.message,
            },
            dispatch,
          );
        } else {
          if (DEVICE_TYPE === 'd') setDownloaded(true);
        }
      },
      e => {
        handleProgress(e.loaded, e.total);
      },
    );
  }, [dispatch]);

  const handleProgress = useCallback((load, total) => {
    setProgressData({ load, total });
  }, []);

  const finishProgress = useCallback(() => {
    setProgressData(null);
  }, []);

  const handleDownloadWithProgress = useCallback(
    execute => {
      downloadByToken(
        item.token,
        item.fileName,
        data => {
          if (data.result != 'SUCCESS') {
            openPopup(
              {
                type: 'Alert',
                message: data.message,
              },
              dispatch,
            );
          } else {
            setDownloaded(true);
          }
        },
        e => {
          handleProgress(e.loaded, e.total);
        },
        execute,
      );
    },
    [dispatch, item],
  );

  const handleViewer = useCallback(async () => {
    await viewerApi.requestSynapViewer(dispatch, {
      fileId: item.token,
      fileExt: item.ext,
      roomID,
    });
  }, [item, roomID]);

  const handleOpenFile = useCallback(
    isFinder => {
      if (DEVICE_TYPE === 'd') {
        try {
          get('files', item.token, result => {
            try {
              if (result.status == 'SUCCESS' && result.data) {
                if (isFinder) {
                  openPath(result.data.path);
                } else {
                  openFile(result.data.path);
                }
              } else {
                setDownloaded(false);
              }
            } catch (e) {
              console.log('warning :::', e);
              setDownloaded(false);
              remove('files', item.token, () => {
                console.log('file info delete');
              });
            }
          });
        } catch (e) {
          console.log('warning :::', e);
          setDownloaded(false);
          remove('files', item.token, () => {
            console.log('file info delete');
          });
        }
      }
    },
    [item],
  );

  if (type == 'list') {
    return (
      <li className={extension}>
        <div
          style={{
            opacity: progressData ? 0.5 : 1,
          }}
          title={isTemp ? item.fullName : item.fileName}
        >
          <div>
            <span className="s-file-ico"></span>
            <p className="file-name" style={{ fontSize, color: '#000' }}>
              {isTemp ? item.fullName : item.fileName}
            </p>
            <span className="file-size">({convertFileSize(item.size)})</span>
          </div>

          {!isTemp && extension == 'img' && DEVICE_TYPE == 'd' && (
            <FileMenuBox
              onPreview={handlePreview}
              onDownload={() => {
                handleDownloadWithProgress(false);
              }}
              onDownloadWithOpen={() => {
                handleDownloadWithProgress(true);
              }}
              onViewer={handleViewer}
              downloaded={downloaded}
              onOpen={handleOpenFile}
            ></FileMenuBox>
          )}

          {!isTemp && extension != 'img' && DEVICE_TYPE == 'd' && (
            <FileMenuBox
              onDownload={() => {
                handleDownloadWithProgress(false);
              }}
              onDownloadWithOpen={() => {
                handleDownloadWithProgress(true);
              }}
              onViewer={handleViewer}
              downloaded={downloaded}
              onOpen={handleOpenFile}
            ></FileMenuBox>
          )}

          {!isTemp && DEVICE_TYPE == 'b' && (
            <FileMenuBox
              onDownload={() => {
                handleDownloadWithProgress(false);
              }}
              onViewer={handleViewer}
              downloaded={false}
            ></FileMenuBox>
          )}
        </div>
      </li>
    );
  } else {
    if (item.thumbnail) {
      messageApi
        .getThumbnail({
          token: item.token,
        })
        .then(response => {
          const data = Buffer.from(response.data, 'binary').toString('base64');
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          image.onload = () => {
            const imgBox = document.getElementById(item.token);
            try {
              // hieght에 따른 width 비율계산 필요
              const resize = resizeImage(image.width, image.height, 200, 200);

              imgBox.width = resize.resizeWidth;
              imgBox.height = resize.resizeHeight;
              imgBox.src = image.src;
            } catch (e) {}
          };
        })
        .catch(() => {
          // image not found ( 404 )
        });

      return (
        <OneImageDiv
          className={replyView ? undefined : 'msgtxt'}
          id={id || ''}
          data-messageid={id}
          progressData={progressData}
        >
          <img
            id={item.token}
            src={`${Config.ServerURL.HOST}/storage/no_image.jpg`}
            width={200}
            height={200}
            onClick={handlePreview}
          ></img>
          {progressData && (
            <div>
              <Progress
                load={progressData.load}
                total={progressData.total}
                handleFinish={finishProgress}
              ></Progress>
              <p style={{ textAlign: 'center' }}>
                {` ( ${convertFileSize(progressData.load)} / ${convertFileSize(
                  progressData.total,
                )} )`}
              </p>
            </div>
          )}
          {!progressData && !isTemp && DEVICE_TYPE === 'd' && (
            <FileMenuBox
              onPreview={handlePreview}
              onDownload={handleDownload}
              onViewer={handleViewer}
              downloaded={downloaded}
              onOpen={handleOpenFile}
            ></FileMenuBox>
          )}

          {!progressData && !isTemp && DEVICE_TYPE === 'b' && (
            <FileMenuBox
              onDownload={handleDownload}
              onViewer={handleViewer}
              downloaded={false}
            ></FileMenuBox>
          )}
        </OneImageDiv>
      );
    } else {
      return (
        <div
          className={`file-message ${extension}`}
          id={id || ''}
          data-messageid={id}
          style={{ cursor: 'pointer' }}
        >
          <div
            style={{ opacity: progressData ? 0.5 : 1 }}
            title={isTemp ? item.fullName : item.fileName}
          >
            <div className="file-type-ico"></div>
            <div className="file-info-txt">
              <p className="file-name" style={{ fontSize, color: '#000' }}>
                {isTemp ? item.fullName : item.fileName}
              </p>
              <p className="file-size">
                {covi.getDic('FileSize', '용량')}{' '}
                {!inprogress && convertFileSize(item.size)}{' '}
                {inprogress &&
                  total &&
                  convertFileSize(inprogress) + ' / ' + convertFileSize(total)}
              </p>
            </div>

            {!isTemp && extension == 'img' && DEVICE_TYPE == 'd' && (
              <FileMenuBox
                onPreview={handlePreview}
                onDownload={() => {
                  handleDownloadWithProgress(false);
                }}
                onDownloadWithOpen={() => {
                  handleDownloadWithProgress(true);
                }}
                onViewer={() => handleViewer}
                downloaded={downloaded}
                onOpen={handleOpenFile}
                fontSize={fontSize}
              ></FileMenuBox>
            )}

            {!isTemp && extension != 'img' && DEVICE_TYPE == 'd' && (
              <FileMenuBox
                onDownload={e => {
                  handleDownloadWithProgress(false);
                }}
                onDownloadWithOpen={() => {
                  handleDownloadWithProgress(true);
                }}
                onViewer={handleViewer}
                downloaded={downloaded}
                onOpen={handleOpenFile}
              ></FileMenuBox>
            )}

            {!isTemp && DEVICE_TYPE == 'b' && (
              <FileMenuBox
                onDownload={() => {
                  handleDownloadWithProgress(false);
                }}
                onViewer={handleViewer}
                downloaded={false}
              ></FileMenuBox>
            )}
          </div>
          {progressData && (
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
          )}
        </div>
      );
    }
  }
};

export default React.memo(File);
