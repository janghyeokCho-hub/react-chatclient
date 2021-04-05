import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import Progress from '@C/common/buttons/Progress';
import FileMenuBox from '@C/chat/message/types/FileMenuBox';
import {
  getFileExtension,
  convertFileSize,
  resizeImage,
  downloadByToken,
} from '@/lib/fileUpload/coviFile';
import * as messageApi from '@/lib/message';
import Config from '@/config/config';
import { openPopup } from '@/lib/common';
import { get, remove } from '@/lib/util/storageUtil';
import { openFile, openPath } from '@/lib/deviceConnector';
import {
  isOdd,
  isLastIndex,
  isBeforeLastIndex,
  isFirstIndex,
  isSecondIndex,
} from '@/lib/util/indexUtil';

const File = ({ type, item, preview, id, isTemp, index, len }) => {
  const extension = getFileExtension(item.ext);
  const [progressData, setProgressData] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
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
    downloadByToken(item.token, item.fileName, data => {
      if (data.result != 'SUCCESS') {
        openPopup(
          {
            type: 'Alert',
            message: data.message,
          },
          dispatch,
        );
      } else {
        if (DEVICE_TYPE == 'd') {
          setDownloaded(true);
        }
      }
    });
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

  const handleOpenFile = useCallback(
    isFinder => {
      if (DEVICE_TYPE == 'd') {
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
              setDownloaded(false);
              remove('files', item.token, () => {
                console.log('file info delete');
              });
            }
          });
        } catch (e) {
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
            const resize = resizeImage(
              isLastIndex(index, len) && isOdd(len) ? 300 : 150,
              150,
              isLastIndex(index, len) && isOdd(len) ? 300 : 150,
              150,
            );

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
      <img
        id={item.token}
        src={`${Config.ServerURL.HOST}/storage/no_image.jpg`}
        width={isLastIndex(index, len) && isOdd(len) ? 300 : 150}
        height={150}
        style={{ border: '1px solid rgba(0,0,0,0)', borderRadius: 10 }}
        onClick={handlePreview}
      ></img>
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
        <p className="msgtxt" id={id || ''}>
          <img
            id={item.token}
            src={`${Config.ServerURL.HOST}/storage/no_image.jpg`}
            width={200}
            height={200}
            onClick={handlePreview}
          ></img>

          {!isTemp && DEVICE_TYPE == 'd' && (
            <FileMenuBox
              onPreview={handlePreview}
              onDownload={handleDownload}
              downloaded={downloaded}
              onOpen={handleOpenFile}
            ></FileMenuBox>
          )}

          {!isTemp && DEVICE_TYPE == 'b' && (
            <FileMenuBox
              onDownload={handleDownload}
              downloaded={false}
            ></FileMenuBox>
          )}
        </p>
      );
    } else {
      return (
        <div
          className={`file-message ${extension}`}
          id={id || ''}
          style={{ cursor: 'pointer' }}
        >
          <div
            style={{ opacity: progressData ? 0.5 : 1 }}
            title={isTemp ? item.fullName : item.fileName}
          >
            <div className="file-type-ico"></div>
            <div className="file-info-txt">
              <p className="file-name">
                {isTemp ? item.fullName : item.fileName}
              </p>
              <p className="file-size">
                {covi.getDic('FileSize')} {convertFileSize(item.size)}
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
                downloaded={downloaded}
                onOpen={handleOpenFile}
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
                downloaded={downloaded}
                onOpen={handleOpenFile}
              ></FileMenuBox>
            )}

            {!isTemp && DEVICE_TYPE == 'b' && (
              <FileMenuBox
                onDownload={() => {
                  handleDownloadWithProgress(false);
                }}
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
