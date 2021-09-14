import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import Progress from '@C/common/buttons/Progress';
import FileMenuBox from '@C/chat/message/types/FileMenuBox';
import {
  getFileExtension,
  convertFileSize,
  resizeImage,
  downloadByToken,
  checkByToken,
} from '@/lib/fileUpload/coviFile';
import * as messageApi from '@/lib/message';
import * as viewerApi from '@/lib/viewer';
import Config from '@/config/config';
import { openPopup } from '@/lib/common';
import { get, remove } from '@/lib/util/storageUtil';
import { openFile, openPath } from '@/lib/deviceConnector';
import { getDic } from '@/lib/util/configUtil';
import { logRenderer } from '@/lib/deviceConnector';
import { useChatFontSize } from '../../../../hooks/useChat';

const File = ({ type, item, preview, id, isTemp, inprogress, total }) => {
  const extension = getFileExtension(item.ext);
  const [progressData, setProgressData] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const [fontSize] = useChatFontSize();
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
    console.log('click');
    preview(item);
  }, [preview]);

  const handleDownload = useCallback(() => {
    console.log('저장');
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

  const handleViewer = useCallback(() => {
    let fileType = 'URL';
    let token = localStorage.getItem('covi_user_access_token');

    console.log('item.token', item.token);
    token = token.replace(/\^/gi, '-');

    //filePath 사이냅 서버가 문서를 변환하기 위해 다운받을 주소
    let eumTalkfilePath = `${window.covi.baseURL}/restful/na/nf/synabDownload/${item.token}/${token}`;
    let filePath = `${eumTalkfilePath}`;

    //fid 사이냅 변환요청시 관리자 페이지에 표시되는 문서ID (다운로드 링크에 따라오는 파일토큰)
    let fid = `${item.token}`;
    // let waterMarkText = 'EumTalk';

    viewerApi
      .sendConversionRequest({
        fileType,
        filePath,
        fid,
      })
      .then(response => {
        if (!response || !response.data) {
        }
        let job = 'job';
        let key = response.data.key;
        let url = '';
        let view = 'view/';
        url = response.config.url.indexOf(job);
        url = response.config.url.substring(0, url);
        url = url + view + key;

        if (DEVICE_TYPE == 'd') {
          window.openExternalPopup(url);
        } else {
          window.open(url);
        }
      })
      .catch(err => {
        if (err && err.response) {
          const errInfo = {
            message: err.message,
            status: err.response.status,
            statusText: err.response.statusText,
            url: err.response.config.url,
            data: err.response.data,
            requestBody: err.response.config.data,
            headers: err.response.headers,
          };
          console.log('Synap Error :  ', errInfo);
          logRenderer('Synap Error :  ' + JSON.stringify(errInfo));
        }
        let message;
        if (!err) {
          message = getDic('Msg_Error');
        } else if (err.response.status === 500) {
          // '파일이 만료되었거나 문서 변환 오류가 발생했습니다.;The file has already expired or failed to convert from the server'
          message = getDic(
            'Msg_SynapError',
            '파일이 만료되었거나 문서 변환 오류가 발생했습니다.',
          );
        } else if (err.response.status === 404) {
          // '문서뷰어 서버를 찾을 수 없습니다. 관리자에게 문의해주세요.;Cannot find Viewer Server. Please contact the manager.'
          message = getDic(
            'Msg_SynapFailed',
            '문서뷰어 서버를 찾을 수 없습니다. 관리자에게 문의해주세요.',
          );
        } else {
          message =
            'Synap Viewer failed to convert the file with errStatus ' +
            err.response.status;
        }

        //getDic('Msg_FileExpired')
        openPopup(
          {
            type: 'Alert',
            message,
          },
          dispatch,
        );
        //
      });
  });

  const handleOpenFile = useCallback(
    isFinder => {
      console.log('isFinder', isFinder);
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
            <span className="file-name">
              {isTemp ? item.fullName : item.fileName}
            </span>
            <span className="file-size">({convertFileSize(item.size)})</span>
          </div>

          {!isTemp && extension == 'img' && DEVICE_TYPE == 'd' && (
            <FileMenuBox
              onPreview={handlePreview}
              onDownload={e => {
                handleDownloadWithProgress(false);
              }}
              onDownloadWithOpen={e => {
                handleDownloadWithProgress(true);
              }}
              onViewer={handleViewer}
              downloaded={downloaded}
              onOpen={handleOpenFile}
            ></FileMenuBox>
          )}

          {!isTemp && extension != 'img' && DEVICE_TYPE == 'd' && (
            <FileMenuBox
              onDownload={e => {
                handleDownloadWithProgress(false);
              }}
              onDownloadWithOpen={e => {
                handleDownloadWithProgress(true);
              }}
              onViewer={handleViewer}
              downloaded={downloaded}
              onOpen={handleOpenFile}
            ></FileMenuBox>
          )}

          {!isTemp && DEVICE_TYPE == 'b' && (
            <FileMenuBox
              onDownload={e => {
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
              onViewer={handleViewer}
              downloaded={downloaded}
              onOpen={handleOpenFile}
            ></FileMenuBox>
          )}

          {!isTemp && DEVICE_TYPE == 'b' && (
            <FileMenuBox
              onDownload={handleDownload}
              onViewer={handleViewer}
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
              <p className="file-name" style={{ fontSize }}>
                {isTemp ? item.fullName : item.fileName}
              </p>
              <p className="file-size">
                {covi.getDic('FileSize')}{' '}
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
