import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLayer, openPopup } from '@/lib/common';
import * as channelApi from '@/lib/channel';
import Scrollbars from 'react-custom-scrollbars';

let domainURL = window.covi.baseURL;
if (domainURL == '') domainURL = window.location.origin;

const joinURL = `${domainURL}/client/login/join`;

const InviteExtUser = ({ headerName, roomId }) => {
  const userInfo = useSelector(({ login }) => login.userInfo);

  const [emailTxt, setEmailTxt] = useState('');
  const [oldList, setOldList] = useState([]);
  const [emailList, setEmailList] = useState([]);

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
          message: covi.getDic('Msg_CancelInviteEx'),
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
                      message: covi.getDic('Msg_Error'),
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
    if (emailList.length > 0) {
      channelApi
        .sendExternalUser({
          roomId,
          emailList: emailList.toString(),
          joinURL,
          registerInfo: JSON.stringify({
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.mailAddress,
          }),
        })
        .then(({ data }) => {
          let alertMsg = '';
          if (data.status == 'SUCCESS') {
            alertMsg = covi.getDic('Msg_SendInviteMail');
            setOldList([...oldList, ...emailList]);
            setEmailList([]);
          } else if (data.status == 'ERROR') {
            alertMsg = covi.getDic('Msg_Error');
          } else {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic('Msg_NoEmail'),
                callback: result => {
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
        });
    } else {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_NoAddMail'),
        },
        dispatch,
      );
    }
  }, [emailList]);

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
                {covi.getDic('WaitExUser')}
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
              placeholder={covi.getDic('Msg_InputEmail')}
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
              <span className="subtxt">{covi.getDic('Msg_InputSendMail')}</span>
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
            {covi.getDic('SendInviteMail')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default InviteExtUser;
