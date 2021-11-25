import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import loadable from '@loadable/component';
import FileInfoBox from '@COMMON/FileInfoBox';
import { changeFiles, clearFiles, deleteFile } from '@/modules/message';
import { messageCurrentTyping } from '@/modules/room';
import * as coviFile from '@/lib/fileUpload/coviFile';
import * as commonApi from '@/lib/common';
import { Scrollbars } from 'react-custom-scrollbars';
import { evalConnector, openSubPop, getEmitter } from '@/lib/deviceConnector';
import { getConfig } from '@/lib/util/configUtil';
import { clearEmoticon } from '@/modules/channel';

const EmojiLayer = loadable(() =>
  import('@C/chat/chatroom/controls/emoji/EmojiLayer'),
);

const EmoticonLayer = loadable(() =>
  import('@C/chat/chatroom/controls/emoticon/EmoticonLayer'),
);

const MessagePostBox = forwardRef(
  (
    {
      postAction,
      viewExtension,
      onExtension,
      disabeld,
      disabledButtons,
      liveMeet,
      zoomMeet,
      zoomSignup,
      remoteAssistance,
      remoteHost,
      placeholder,
      isLock,
    },
    ref,
  ) => {
    const tempFiles = useSelector(({ message }) => message.tempFiles);
    const selectEmoticon = useSelector(({ channel }) => channel.selectEmoticon);

    const useRemoteVNC = getConfig('useRemoteVNC', {
      isUse: false,
      remoteType: '',
      openTarget: [],
      hostOptions: '',
    });
    const useCapture = getConfig('UseCapture', 'N');

    const { PC } = getConfig('FileAttachMode') || {};
    const [inputLock, setInputLock] = useState(isLock);
    const [useEmoji, setUseEmoji] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const { myInfo } = useSelector(({ login }) => ({
      myInfo: login.userInfo,
    }));

    const [context, setContext] = useState('');

    const fileUploadControl = useRef(null);
    const sendBtn = useRef(null);

    const dispatch = useDispatch();
    const currentEmoticon = useMemo(() => {
      if (selectEmoticon === '' || selectEmoticon === null) {
        return null;
      }
      return `eumtalk://emoticon.${selectEmoticon.GroupName}.${selectEmoticon.EmoticonName}.${selectEmoticon.EmoticonType}.${selectEmoticon.CompanyCode}`;
    }, [selectEmoticon]);

    const handleSendMessage = useCallback(() => {
      const fileCtrl = coviFile.getInstance();
      const files = fileCtrl.getFiles();
      const fileInfos = fileCtrl.getRealFileInfos();

      if (currentEmoticon) {
        handleEmoticon(currentEmoticon);
        dispatch(clearEmoticon());
      }

      if (
        (context.replace(/\s*/, '') != '' && context != '') ||
        files.length > 0
      ) {
        let inputContext = context;

        // TODO: 메시지 정규식 처리 필요 시 아래 부분에서 처리
        const regExp = new RegExp('(<br>|<br/>|<br />)', 'gi');
        inputContext = inputContext.replace(regExp, '\n');
        inputContext = inputContext.replace(/\s+$/, ''); // 마지막 공백문자 전부 제거

        let checkURLResult = null;

        checkURLResult = commonApi.checkURL(inputContext);

        postAction(
          inputContext,
          files.length > 0 ? { files, fileInfos } : null,
          checkURLResult && checkURLResult.isURL ? checkURLResult : null,
        );

        const historyArr = [context, ...history];
        historyArr.splice(5, historyArr.length - 5); // max 5
        setContext('');
        setHistory(historyArr);
        setHistoryIndex(-1);
        fileCtrl.clear();
        dispatch(clearFiles());
      }
    }, [dispatch, context, postAction, currentEmoticon]);

    const handleEmojiControl = useCallback(() => {
      if (viewExtension == 'E') {
        onExtension(''); // 창 해제 ( 열려있는 경우 )
      } else {
        onExtension('E'); // 창 설정
      }
    }, [onExtension, viewExtension]);

    const handleStickerControl = useCallback(() => {
      if (viewExtension == 'S') {
        onExtension(''); // 창 해제 ( 열려있는 경우 )
      } else {
        onExtension('S'); // 창 설정
      }
    }, [onExtension, viewExtension]);

    const handleAppend = useCallback(
      append => {
        const text = context + append;
        setContext(text);
      },
      [context],
    );

    const handleEmoticon = useCallback(
      emoticon => {
        // emoticon만 전송
        postAction(emoticon, null, null);
        // emoticon은 바로 발송
        onExtension('');
      },
      [onExtension, postAction],
    );

    useEffect(() => {
      // 화면전환시 history 비워줌
      // 최초 화면전환시 focus
      !inputLock && ref.current.focus();

      setHistory([]);
      setHistoryIndex(-1);

      if (DEVICE_TYPE == 'd') {
        const appConfig = evalConnector({
          method: 'getGlobal',
          name: 'APP_SECURITY_SETTING',
        });

        setUseEmoji(appConfig.get('useEmoji') ? true : false);
      }

      return () => {
        /**
         * 2020.12.24
         * unmount시점에 typing 플래그 false로
         * 플래그 초기화를 하지 않으면 window 사이즈를 조절해서 채팅창이 사라졌을때 경고창이 계속 등장함 *
         */
        dispatch(
          messageCurrentTyping({
            typing: false,
          }),
        );
      };
    }, []);

    useEffect(() => {
      // 채팅방 이동 경고창 flag 업데이트
      dispatch(
        messageCurrentTyping({
          typing: ref.current.value.length > 0 || tempFiles.length > 0,
        }),
      );
    }, [context, tempFiles]);

    useEffect(() => {
      setInputLock(isLock);
    }, [isLock]);

    const handleFileChange = useCallback(
      e => {
        const target = e.target;
        const fileCtrl = coviFile.getInstance();

        if (target.files.length > 0) {
          // 파일업로드 금지
          if (PC && PC.upload === false) {
            commonApi.openPopup(
              {
                type: 'Alert',
                message: covi.getDic(
                  'Block_FileUpload',
                  '파일 첨부가 금지되어 있습니다.',
                ),
              },
              dispatch,
            );
            return;
          }
          const appendResult = fileCtrl.appendFiles(target.files);

          if (appendResult.result == 'SUCCESS') {
            dispatch(changeFiles({ files: fileCtrl.getFileInfos() }));
          } else {
            commonApi.openPopup(
              {
                type: 'Alert',
                message: coviFile.getValidationMessage(appendResult.message),
              },
              dispatch,
            );
          }
        }

        e.target.value = '';
        ref.current.focus();
      },
      [dispatch],
    );

    const handleFileDelete = useCallback(
      tempId => {
        const fileCtrl = coviFile.getInstance();
        fileCtrl.delFile(tempId);
        dispatch(deleteFile(tempId));
      },
      [dispatch],
    );

    const handlePaste = useCallback(
      e => {
        const { clipboardData } = e;

        // 파일이 명백한경우
        try {
          if (
            clipboardData.types.length == 1 &&
            clipboardData.types[0] == 'Files'
          ) {
            // 파일업로드 금지
            if (PC && PC.upload === false) {
              commonApi.openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic(
                    'Block_FileUpload',
                    '파일 첨부가 금지되어 있습니다.',
                  ),
                },
                dispatch,
              );
              return;
            }
            if (clipboardData.files.length > 0) {
              // 한개의 파일에 대해서만 처리
              // 이미지만 붙혀넣을 수 있음
              const pasteData = clipboardData.files[0];
              console.log(pasteData);
              const fileCtrl = coviFile.getInstance();
              const appendFileInfo = fileCtrl.makeFileInfo(pasteData, true);
              if (appendFileInfo.image) {
                const pasteResult = fileCtrl.pasteFiles(pasteData);
                console.log('pasteResult', pasteResult);

                if (pasteResult.result == 'SUCCESS') {
                  dispatch(changeFiles({ files: fileCtrl.getFileInfos() }));
                } else {
                  commonApi.openPopup(
                    {
                      type: 'Alert',
                      message: coviFile.getValidationMessage(
                        pasteResult.message,
                      ),
                    },
                    dispatch,
                  );
                }
              }
            }
          } else {
            const text = clipboardData.getData('Text');
            if (document.queryCommandSupported('insertText')) {
              document.execCommand('insertText', false, text);
            } else {
              document.execCommand('paste', false, text);
            }
          }
        } catch (ex) {
          console.log('paste error');
        }
        e.preventDefault();
      },
      [dispatch],
    );

    const handleKeyDown = useCallback(
      e => {
        if (!e.shiftKey && e.keyCode == 13) {
          sendBtn.current.click();
          e.preventDefault();
          e.stopPropagation();
          return false;
        } else if (e.ctrlKey && (e.keyCode == 38 || e.keyCode == 40)) {
          if (history.length > 0) {
            const nextIndex = (historyIndex + 1) % history.length;

            setContext(history[nextIndex]);
            setHistoryIndex(nextIndex);
            return false;
          }
        }
      },
      [historyIndex, history, currentEmoticon],
    );

    const callLiveMeet = useCallback(() => {
      commonApi.openPopup(
        {
          type: 'Confirm',
          message: '화상회의 초대장이 발송됩니다. 발송하시겠습니까?',
          callback: result => {
            if (result) {
              liveMeet();
            }
          },
        },
        dispatch,
      );
    }, [dispatch, liveMeet]);

    function fileCapture() {
      getEmitter().once('imageData', (event, data) => {
        var file = dataURLtoFile(data);
        var fileCtrl = coviFile.getInstance();
        const captureResult = fileCtrl.pasteFiles(file);
        if (captureResult.result == 'SUCCESS') {
          dispatch(changeFiles({ files: fileCtrl.getFileInfos() }));
        } else {
          commonApi.openPopup(
            {
              type: 'Alert',
              message: coviFile.getValidationMessage(captureResult.message),
            },
            dispatch,
          );
        }
      });
    }

    const dataURLtoFile = (dataurl, fileName) => {
      var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n),
        fileName = 'capture.png';

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], fileName, { type: mime });
    };

    const createSessionKey = () => {
      return Math.floor(Math.random() * 1000000000);
    };

    const handleRemoteAssistance = async () => {
      const sessionKey = createSessionKey();

      callRemoteHost(sessionKey);

      evalConnector({
        method: 'removeListener',
        channel: 'onRemoteAssistance',
      });

      const response = await evalConnector({
        method: 'send',
        channel: 'onRemoteAssistance',
        message: {
          sessionKey: sessionKey,
          isViewer: 'N',
        },
      });
    };

    const callRemoteVNC = useCallback(async () => {
      const ip = await evalConnector({
        method: 'sendSync',
        channel: 'req-get-remote-info',
        message: {},
      });
      if (ip != null) {
        try {
          let useableIPList = [];

          ip.map(ipInfo => {
            useableIPList.push({
              name: ipInfo,
              callback: () => {
                const msgObj = {
                  title: '원격지원',
                  context: `호스트 ${commonApi.getJobInfo(
                    myInfo,
                  )}님의 원격 요청`,
                  func: {
                    name: '원격 지원 시작',
                    type: 'remotevnc',
                    data: {
                      hostAddr: ipInfo,
                      hostId: myInfo,
                    },
                  },
                };
                postAction(JSON.stringify(msgObj), null, null, 'A');

                evalConnector({
                  method: 'removeListener',
                  channel: 'onVNCRemoteHost',
                });

                evalConnector({
                  method: 'send',
                  channel: 'onVNCRemoteHost',
                  message: {
                    options: useRemoteVNC.hostOptions,
                  },
                });
              },
            });
          });

          commonApi.openPopup(
            {
              type: 'Select',
              title: '원격 IP 대역 선택',
              buttons: useableIPList,
            },
            dispatch,
          );
        } catch (ex) {
          commonApi.openPopup(
            {
              type: 'Alert',
              message: '원격 지원이 종료 되었습니다.',
            },
            dispatch,
          );
          console.log(ex);
        }
      }
    }, [remoteHost]);

    const callRemoteHost = useCallback(
      sessionKey => {
        // commonApi.openPopup({
        //   type: 'Confirm',
        //   message: '원격지원요청 메세지가 발송됩니다. 발송하시겠습니까?',
        //   callback: result => {
        //     console.log('callback!!')
        //     if (result) {
        //       remoteHost(sessionKey)
        //     }
        //   }
        // },
        //   dispatch,
        // )
        remoteHost(sessionKey);
      },
      [dispatch, remoteAssistance, remoteHost],
    );

    const callZoomMeet = useCallback(() => {
      const zoomToken = localStorage.getItem('covi_user_access_zoom_token');
      if (zoomToken === null) {
        zoomSignup &&
          commonApi.openPopup(
            {
              type: 'Confirm',
              message: covi.getDic(
                'Msg_ConnectZoom',
                'Zoom 연동이 필요합니다. 확인 클릭시 Zoom 로그인으로 이동합니다.',
              ),
              callback(result) {
                result === true && zoomSignup(result);
              },
            },
            dispatch,
          );
      } else {
        zoomMeet &&
          commonApi.openPopup(
            {
              type: 'Confirm',
              message: '화상회의(Zoom) 초대장이 발송됩니다. 발송하시겠습니까?',
              callback: result => {
                if (result) {
                  zoomMeet();
                }
              },
            },
            dispatch,
          );
      }
    }, [dispatch, zoomMeet, zoomSignup]);

    return (
      <>
        <div
          className="message-input-wrap"
          onClick={e => {
            ref.current.focus();
          }}
        >
          <div
            className="message-input clearfix"
            style={{
              position: 'relative',
              backgroundColor: inputLock ? '#f9f9f9' : '',
            }}
          >
            <textarea
              ref={ref}
              disabled={disabeld || inputLock ? 'disabled' : ''}
              onChange={e => {
                setContext(e.target.value);
              }}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              className="message-to-send"
              placeholder={
                !inputLock ? placeholder : covi.getDic('Msg_LockInput')
              }
              value={context}
              style={{ backgroundColor: inputLock ? '#f9f9f9' : '' }}
            ></textarea>
            <div className="input-bottombox">
              {!disabledButtons && (
                <div className="input-icobox">
                  <button
                    className={(viewExtension == 'S' && 'active') || ''}
                    alt="Sticker"
                    title="Sticker"
                    onClick={e => {
                      !inputLock && handleStickerControl();
                      e.stopPropagation();
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18.798"
                      height="18.798"
                      viewBox="0 0 18.798 18.798"
                    >
                      <path
                        d="M9.4,18.8A9.4,9.4,0,1,0,0,9.4,9.4,9.4,0,0,0,9.4,18.8Zm0-17.44A8.04,8.04,0,1,1,1.359,9.4,8.057,8.057,0,0,1,9.4,1.359Z"
                        fill="#999"
                      ></path>
                      <path
                        d="M138.561,144.952a1.076,1.076,0,1,0-.759-.317A1.072,1.072,0,0,0,138.561,144.952Z"
                        transform="translate(-131.993 -137.093)"
                        fill="#999"
                      ></path>
                      <path
                        d="M273.428,144.952a1.076,1.076,0,1,0-.759-.317A1.052,1.052,0,0,0,273.428,144.952Z"
                        transform="translate(-261.469 -137.093)"
                        fill="#999"
                      ></path>
                      <path
                        d="M128.641,271.19c3.5,0,4.518-2.355,4.564-2.446a.687.687,0,0,0-.362-.895.662.662,0,0,0-.883.362c-.034.068-.747,1.619-3.307,1.619-2.48,0-2.922-1.461-2.944-1.529v.011l-1.325.328C124.417,268.744,125.062,271.19,128.641,271.19Z"
                        transform="translate(-119.412 -257.091)"
                        fill="#999"
                      ></path>
                    </svg>
                  </button>
                  {useEmoji && (
                    <button
                      className={(viewExtension == 'E' && 'active') || ''}
                      alt="Emoji"
                      title="Emoji"
                      onClick={e => {
                        !inputLock && handleEmojiControl();
                        e.stopPropagation();
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18.089"
                        height="18.08"
                        viewBox="0 0 18.089 18.08"
                      >
                        <path
                          d="M88.17,180.515h0c-.455-.45-.911-.908-1.356-1.353L85.3,177.643c-1.769-1.773-3.6-3.606-5.414-5.415a.8.8,0,0,0-.5-.208,7.845,7.845,0,0,0-2.144.259,9.022,9.022,0,0,0-3.152,1.489,9.247,9.247,0,0,0-2.337,2.5,8.84,8.84,0,0,0-1.187,6.754,9.15,9.15,0,0,0,3.2,5.063,9.037,9.037,0,0,0,5.625,2.011,8.166,8.166,0,0,0,3.5-.735,9.746,9.746,0,0,0,4-3.278,9.471,9.471,0,0,0,1.542-4.942A.784.784,0,0,0,88.17,180.515Zm-1.876.157c-.23.046-.469.094-.706.139l-.548.106-.01,0c-.5.1-1.017.2-1.529.285a3.5,3.5,0,0,1-.589.049,3.686,3.686,0,0,1-3.67-3,4.89,4.89,0,0,1,.086-1.841c.109-.554.216-1.111.319-1.652v-.007l.13-.679,6.587,6.581ZM78.423,174.2l-.01.053c-.143.745-.291,1.515-.433,2.274a4.961,4.961,0,0,0,1.115,4.21,4.857,4.857,0,0,0,3.188,1.786,5.853,5.853,0,0,0,1.975-.122c.687-.139,1.389-.272,2.068-.4l.009,0,.724-.138a7.577,7.577,0,0,1-6.908,6.893c-.255.024-.513.036-.768.036a7.742,7.742,0,0,1-5.329-2.073,7.766,7.766,0,0,1,4.526-13.338Z"
                          transform="translate(-70.341 -172.018)"
                          fill="#999"
                        ></path>
                      </svg>
                    </button>
                  )}
                  {(typeof PC === 'undefined' || PC.upload !== false) && (
                    <button
                      type="button"
                      alt="File"
                      title="File"
                      onClick={e => {
                        !inputLock && fileUploadControl.current.click();
                        e.stopPropagation();
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16.882"
                        height="18.798"
                        viewBox="0 0 16.882 18.798"
                      >
                        <path
                          d="M36.374,5.613a.67.67,0,0,0-.947-.947l-7.011,7.011a2.152,2.152,0,0,0,3.043,3.043L38.8,7.374A1.046,1.046,0,0,0,39,7.24c.981-.981,3.589-3.589,1.081-6.1A3.483,3.483,0,0,0,36.764.085a6.371,6.371,0,0,0-3.043,1.872L25.763,9.915a4.9,4.9,0,0,0-1.393,3.7,5.535,5.535,0,0,0,1.572,3.656A5.327,5.327,0,0,0,29.564,18.8h.111a4.943,4.943,0,0,0,3.533-1.438l7.847-7.847a.67.67,0,0,0-.947-.947l-7.847,7.847a3.673,3.673,0,0,1-2.675,1.048,3.962,3.962,0,0,1-2.876-6.6L34.668,2.9a5.178,5.178,0,0,1,2.374-1.5,2.149,2.149,0,0,1,2.1.7,1.738,1.738,0,0,1,.58,1.906A4.92,4.92,0,0,1,38.6,5.736a1.394,1.394,0,0,0-.134.1l-7.947,7.947a.812.812,0,0,1-1.148-1.148Z"
                          transform="translate(-24.365 0)"
                          fill="#999"
                        ></path>
                      </svg>
                    </button>
                  )}
                  {liveMeet && (
                    <button
                      type="button"
                      alt="Meet"
                      title="Meet"
                      onClick={e => {
                        !inputLock && callLiveMeet();
                      }}
                    >
                      <img
                        src="data:image/png;base64,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"
                        width="18"
                        height="18"
                      />
                    </button>
                  )}

                  {zoomMeet && (
                    <button
                      type="button"
                      alt="Zoom Meet"
                      title="Zoom Meet"
                      onClick={e => {
                        !inputLock && callZoomMeet();
                      }}
                    >
                      <img
                        src="data:image/png;base64,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"
                        width="18"
                        height="18"
                      />
                    </button>
                  )}

                  {DEVICE_TYPE == 'd' && useRemoteVNC.isUse && (
                    <button
                      type="button"
                      alt="RemoteVNC"
                      title="remote"
                      onClick={e => {
                        !inputLock && callRemoteVNC();
                      }}
                    >
                      <svg
                        viewBox="0 0 64 64"
                        width="18"
                        height="18"
                        fill="#999"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M60,3H22a2,2,0,0,0-2,2v6H4a2,2,0,0,0-2,2V45a2,2,0,0,0,2,2h8.264l-3.5,7H4v4H40V54H35.236l-3.5-7H42a2,2,0,0,0,2-2V39H60a2,2,0,0,0,2-2V5A2,2,0,0,0,60,3ZM40,15V35H6V15ZM30.764,54H13.236l3.5-7H27.264ZM40,43H6V39H40Zm18-8H44V13a2,2,0,0,0-2-2H24V7H58Z" />
                        <path d="M12,31H22a2,2,0,0,0,2-2V21a2,2,0,0,0-2-2H12a2,2,0,0,0-2,2v8A2,2,0,0,0,12,31Zm2-8h6v4H14Z" />
                        <rect height="4" width="8" x="28" y="19" />
                        <rect height="4" width="8" x="28" y="27" />
                        <rect height="4" width="6" x="48" y="11" />
                        <rect height="4" width="6" x="48" y="19" />
                        <rect height="4" width="6" x="48" y="27" />
                      </svg>
                    </button>
                  )}

                  {DEVICE_TYPE == 'd' && useCapture == 'Y' && (
                    <button
                      type="button"
                      alt="Screen Shot"
                      title="Screen Shot"
                      onClick={e => {
                        openSubPop(
                          'screenShot',
                          '#/client/nw/snipper',
                          {},
                          400,
                          200,
                          'sticky',
                          false,
                          { resize: false },
                        ),
                          fileCapture();
                      }}
                    >
                      <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGQSURBVDhPrZPrjoJADIV5/4fzgnclIhpBokYwKipiN1+TktmM/tnsJCdlOu2hPZ0J6rqW/8BHoqZpPJ+LT+ce0ev1kv1+L9PpVGazmQf8x+PRI/tFBAl2PB5Lt9uVfr/vodPpyHw+94lIBs/nUx2Px0Mmk4mEYSiDwcADZBARSw4gP6iqSpbLpQyHQ62E0t0kKjOwx08scYCc1WolwWazkV6vJ0mSyGKx0G+qwVLZdruV3W4naZpqop1bq4B9sF6v9eN6vUqe5xpoxJTvLvb2Y6vaKtSKXD0IiqJIxXy/33K73aQoCtWOPUAKl6wlYgOZlXw6nbQCLGfoQ1voySrLstXLIzIynCRQEdOBhDPGjk6s+/0uo9Go7eQjEZZ2aAHxIcIPUZZlLRHJX4kAvR8OB004n886XtpANwhYtPxVIwNJjB1xWdjL5dJOEMtT8TRi/C4R4G/oAwEtsrBcEbtrbrwSceE4cMHf0IRvCOM4VgLzY914tAoonfYIRAcX+NyX/y2GYvTRMmp7vH9B0zTyA4j3ppt5v3daAAAAAElFTkSuQmCC"
                        width="18"
                        height="18"
                      />
                    </button>
                  )}

                  {DEVICE_TYPE == 'd' &&
                    remoteAssistance &&
                    remoteAssistance.use && (
                      <button
                        type="button"
                        alt="Remote Assistance"
                        title="Remote Assistance"
                        onClick={e => {
                          handleRemoteAssistance();
                        }}
                      >
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGQSURBVDhPrZPrjoJADIV5/4fzgnclIhpBokYwKipiN1+TktmM/tnsJCdlOu2hPZ0J6rqW/8BHoqZpPJ+LT+ce0ev1kv1+L9PpVGazmQf8x+PRI/tFBAl2PB5Lt9uVfr/vodPpyHw+94lIBs/nUx2Px0Mmk4mEYSiDwcADZBARSw4gP6iqSpbLpQyHQ62E0t0kKjOwx08scYCc1WolwWazkV6vJ0mSyGKx0G+qwVLZdruV3W4naZpqop1bq4B9sF6v9eN6vUqe5xpoxJTvLvb2Y6vaKtSKXD0IiqJIxXy/33K73aQoCtWOPUAKl6wlYgOZlXw6nbQCLGfoQ1voySrLstXLIzIynCRQEdOBhDPGjk6s+/0uo9Go7eQjEZZ2aAHxIcIPUZZlLRHJX4kAvR8OB004n886XtpANwhYtPxVIwNJjB1xWdjL5dJOEMtT8TRi/C4R4G/oAwEtsrBcEbtrbrwSceE4cMHf0IRvCOM4VgLzY914tAoonfYIRAcX+NyX/y2GYvTRMmp7vH9B0zTyA4j3ppt5v3daAAAAAElFTkSuQmCC"
                          width="18"
                          height="18"
                        />
                      </button>
                    )}
                </div>
              )}
              {(inputLock && (
                <button
                  ref={sendBtn}
                  onClick={e => {
                    setInputLock(false);
                    ref.current.focus();
                  }}
                  alt="Unlock"
                  title="Unlock"
                  type="button"
                  className="sendbtn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="23"
                    height="23"
                    viewBox="0 0 16.124 16.124"
                  >
                    <g transform="translate(-119 -286.5)">
                      <circle
                        cx="8.062"
                        cy="8.062"
                        r="8.062"
                        transform="translate(119 286.5)"
                        fill="#929292"
                      />
                      <g transform="translate(124.375 291.203)">
                        <g transform="translate(0 0)">
                          <path
                            d="M4.85,6.651H.693A.718.718,0,0,1,0,5.912V2.957a.718.718,0,0,1,.693-.74h.346V1.848A1.8,1.8,0,0,1,2.771,0,1.8,1.8,0,0,1,4.5,1.848v.369H4.85a.718.718,0,0,1,.692.74V5.912A.717.717,0,0,1,4.85,6.651ZM2.8,3.263a.56.56,0,0,0-.56.56V5.007a.56.56,0,1,0,1.12,0V3.823A.56.56,0,0,0,2.8,3.263ZM2.771.739A1.077,1.077,0,0,0,1.732,1.848v.369H3.811V1.848A1.077,1.077,0,0,0,2.771.739Z"
                            transform="translate(0 0)"
                            fill="#f5f5f5"
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                </button>
              )) || (
                <button
                  ref={sendBtn}
                  onClick={e => {
                    !inputLock && handleSendMessage(e);
                  }}
                  alt="Send"
                  title="Send"
                  type="button"
                  className="sendbtn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20.066"
                    height="25.802"
                    viewBox="0 0 20.066 25.802"
                  >
                    <g transform="translate(7.704 -0.001) rotate(45)">
                      <g transform="translate(-0.001 0.002)">
                        <g transform="translate(0 0)">
                          <path
                            d="M.337,6.861A.537.537,0,0,0,.3,7.843l6.291,3.051L17.485,0Z"
                            transform="translate(0.001 -0.002)"
                            fill="#6d6d6d"
                          ></path>
                        </g>
                      </g>
                      <g transform="translate(7.352 0.761)">
                        <path
                          d="M206.344,32.2l3.051,6.291a.537.537,0,0,0,.483.3h.019a.537.537,0,0,0,.479-.337l6.859-17.148Z"
                          transform="translate(-206.344 -21.306)"
                          fill="#6d6d6d"
                        ></path>
                      </g>
                    </g>
                  </svg>
                </button>
              )}
            </div>
            <div style={{ width: '0px', height: '0px' }}>
              <input
                ref={fileUploadControl}
                type="file"
                multiple={true}
                style={{ opacity: '0.0', width: '0px', height: '0px' }}
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {viewExtension == 'E' && (
          <EmojiLayer onAppend={handleAppend}></EmojiLayer>
        )}
        {viewExtension == 'S' && (
          <EmoticonLayer onClick={handleEmoticon}></EmoticonLayer>
        )}

        {tempFiles && tempFiles.length > 0 && (
          <div
            className="Before-file-transfer"
            style={{
              bottom: viewExtension == '' ? '135px' : '355px',
              height: '110px',
              position: 'absolute',
            }}
          >
            <Scrollbars
              renderTrackVertical={() => <div style={{ display: 'none' }} />}
              autoHide={true}
            >
              <ul style={{ height: 'calc(100% - 2px)' }}>
                {tempFiles.map(item => {
                  return (
                    <FileInfoBox
                      key={item.tempId}
                      tempId={item.tempId}
                      fileInfo={item}
                      onDelete={handleFileDelete}
                    ></FileInfoBox>
                  );
                })}
              </ul>
            </Scrollbars>
          </div>
        )}
      </>
    );
  },
);

export default React.memo(MessagePostBox);
