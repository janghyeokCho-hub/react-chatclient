import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLayer, openPopup, getDictionary } from '@/lib/common';
import * as channelApi from '@/lib/channel';
import Scrollbars from 'react-custom-scrollbars';
import { TailSpin } from '@agney/react-loading';

let domainURL = window.covi.baseURL;
if (domainURL == '') domainURL = window.location.origin;

const joinURL = `${domainURL}/client/login/join`;
const emailExpression =
  /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

const InviteExtUser = ({ headerName, roomId }) => {
  const userInfo = useSelector(({ login }) => login.userInfo);

  const [emailTxt, setEmailTxt] = useState('');
  const [oldList, setOldList] = useState([]);
  const [emailList, setEmailList] = useState([]);
  const [inviting, setInviting] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    /*if(!userInfo.mailAddress || userInfo.mailAddress.length == 0 ){
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_NoEmail'),
          callback: result => {
            handleClose();}
        },
        dispatch,
      );
    }
    */
    channelApi.getExternalUser(roomId).then(({ data }) => {
      if (data.status == 'SUCCESS') {
        setOldList(data.result.map(item => item.ExternalEmail));
      }
    });
  }, []);

  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, [dispatch]);

  const addItem = useCallback(() => {
    // Email format validation
    if (emailExpression.test(emailTxt) === false) {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic(
            'Msg_InvalidEmail',
            '유효하지 않은 이메일입니다.',
          ),
        },
        dispatch,
      );
      return;
    }

    if (
      emailTxt != '' &&
      emailList.find(item => item == emailTxt) == undefined
    ) {
      channelApi
        .checkExternalUser({ roomId, email: emailTxt })
        .then(({ data }) => {
          if (data.status == 'SUCCESS') {
            setEmailList([emailTxt, ...emailList]);
            setEmailTxt('');
          } else {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic(data.message),
              },
              dispatch,
            );
          }
        });
    }
  }, [dispatch, roomId, emailTxt, emailList]);

  const deleteItem = useCallback(
    email => {
      let tempList = [...emailList];
      tempList.splice(
        tempList.findIndex(item => item == email),
        1,
      );

      setEmailList(tempList);
    },
    [emailList],
  );

  const deleteOldItem = useCallback(
    email => {
      openPopup(
        {
          type: 'Confirm',
          message: covi.getDic(
            'Msg_CancelInviteEx',
            '해당 외부사용자의 초대를 취소하시겠습니까?',
          ),
          callback: result => {
            if (result) {
              channelApi.delExternalUser({ roomId, email }).then(({ data }) => {
                if (data.status == 'SUCCESS') {
                  let tempList = [...oldList];
                  tempList.splice(
                    tempList.findIndex(item => item == email),
                    1,
                  );

                  setOldList(tempList);
                } else {
                  openPopup(
                    {
                      type: 'Alert',
                      message: covi.getDic(
                        'Msg_Error',
                        '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
                      ),
                    },
                    dispatch,
                  );
                }
              });
            }
          },
        },
        dispatch,
      );
    },
    [dispatch, oldList],
  );

  const handleSendMail = useCallback(() => {
    if (inviting === true) {
      return;
    }

    if (emailList.length > 0) {
      setInviting(true);
      channelApi
        .sendExternalUser({
          roomId,
          emailList: emailList.toString(),
          joinURL,
          registerInfo: JSON.stringify({
            id: userInfo.id,
            name: getDictionary(userInfo.name),
            email: userInfo.mailAddress,
          }),
        })
        .then(({ data }) => {
          let alertMsg = '';
          if (data.status == 'SUCCESS') {
            alertMsg = covi.getDic(
              'Msg_SendInviteMail',
              '초대메일이 성공적으로 전송되었습니다.',
            );
            setOldList([...oldList, ...emailList]);
            setEmailList([]);
          } else if (data.status == 'ERROR') {
            alertMsg = covi.getDic(
              'Msg_Error',
              '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
            );
          } else {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic(
                  'Msg_NoEmail',
                  '보내는 사람의 이메일 주소가 잘못되었습니다. 관리자에게 문의 하세요',
                ),
                callback: () => {
                  handleClose();
                },
              },
              dispatch,
            );
            return;
          }

          openPopup(
            {
              type: 'Alert',
              message: alertMsg,
            },
            dispatch,
          );
        })
        .finally(() => setInviting(false));
    } else {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_NoAddMail', '추가된 이메일이 없습니다.'),
        },
        dispatch,
      );
    }
  }, [emailList, inviting]);

  return (
    <div className="Layer-AddUser" style={{ height: '100%' }}>
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{headerName}</p>
        </div>
      </div>
      <div style={{ height: '90%' }}>
        {oldList.length > 0 && (
          <div className="addemail">
            <div style={{ padding: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>
                {covi.getDic('WaitExUser', '가입 대기중인 외부사용자')}
              </span>
            </div>
            <Scrollbars style={{ height: '80%' }} autoHide={true}>
              <ul className="addemaillist">
                {oldList.map(item => {
                  return (
                    <li
                      key={`old_${item}`}
                      onClick={() => {
                        deleteOldItem(item);
                      }}
                    >
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
            </Scrollbars>
          </div>
        )}
        <div className="addemail">
          <div className="addinput">
            <input
              type="text"
              placeholder={covi.getDic(
                'Msg_InputEmail',
                '이메일을 입력하세요.',
              )}
              value={emailTxt}
              onChange={e => {
                setEmailTxt(e.target.value);
              }}
            />
            <button className="addico" onClick={addItem}></button>
          </div>

          {emailList.length == 0 && (
            <div
              className="titbox"
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <span className="subtxt">
                {covi.getDic(
                  'Msg_InputSendMail',
                  '이메일을 작성하여 추가하고 메일보내기 버튼을 누르세요.',
                )}
              </span>
            </div>
          )}
          {emailList.length > 0 && (
            <Scrollbars style={{ height: '70%' }} autoHide={true}>
              <ul className="addemaillist">
                {emailList.map(item => {
                  return (
                    <li
                      key={item}
                      onClick={() => {
                        deleteItem(item);
                      }}
                    >
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
            </Scrollbars>
          )}
          <a className="Btn-pointcolor-full" onClick={handleSendMail}>
            {inviting ? (
              <TailSpin
                width="50"
                height="70%"
                style={{ verticalAlign: 'middle' }}
              />
            ) : (
              covi.getDic('SendInviteMail', '초대 메일 보내기')
            )}
          </a>
        </div>
      </div>
    </div>
  );
};

export default InviteExtUser;
