// components\chat\chatroom\layer\InviteMember.js

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteLayer, clearLayer, openPopup, getJobInfo } from '@/lib/common';
import { createChannel, uploadChannelIcon } from '@/lib/channel';
import { getAesUtil } from '@/lib/aesUtil';
import { getAllUserWithGroup } from '@/lib/room';
import { getConfig } from '@/lib/util/configUtil';
import { openChannel, getChannelCategories } from '@/modules/channel';

import ProfileBox from '@C/common/ProfileBox';
import ContactList from '@C/contact/ContactList';
import OrgChart from '@C/orgchart/OrgChart';
import Scrollbars from 'react-custom-scrollbars';

const CreateChannel = ({ headerName }) => {
  const { viewType, rooms, selectId, myInfo, channelCategories, sender } =
    useSelector(({ room, channel, login }) => ({
      viewType: room.viewType,
      rooms: room.rooms,
      selectId: room.selectId,
      myInfo: login.userInfo,
      channelCategories: channel.categories,
      sender: login.id,
    }));

  // 채널 기본 정보
  const [selectStage, setSelectStage] = useState(0);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [displayCategory, setDisplayCategory] = useState(false);
  const [openType, setOpenType] = useState('P'); // P(비공개)
  const [secretKey, setSecretKey] = useState('');
  const [iconImagePath, setIconImagePath] = useState(null);
  const [icon, setIcon] = useState(null);

  // 사용자 초대
  const [members, setMembers] = useState([]);
  const [oldMembers, setOldMembers] = useState([]);
  const [selectTab, setSelectTab] = useState('C');

  const fileUploadControl = useRef(null);

  const IsSaaSClient = getConfig('IsSaaSClient', 'N');

  const dispatch = useDispatch();

  useEffect(() => {
    if (channelCategories == null || channelCategories.length == 0)
      if (IsSaaSClient == 'Y')
        dispatch(getChannelCategories({ companyCode: myInfo.CompanyCode }));
      else dispatch(getChannelCategories());

    setOldMembers([
      {
        id: myInfo.id,
        name: myInfo.name,
        presence: myInfo.presence,
        photoPath: myInfo.photoPath,
        PN: myInfo.PN,
        LN: myInfo.LN,
        TN: myInfo.TN,
        dept: myInfo.dept,
        type: 'U',
      },
    ]);
    addInviteMember({
      id: myInfo.id,
      name: myInfo.name,
      presence: myInfo.presence,
      photoPath: myInfo.photoPath,
      PN: myInfo.PN,
      LN: myInfo.LN,
      TN: myInfo.TN,
      dept: myInfo.dept,
      type: 'U',
    });
  }, []);

  useEffect(() => {
    if (channelCategories && channelCategories.length > 0 && !category) {
      // setCategory(channelCategories[0].categoryCode);
      setCategory(channelCategories[0]);
    }
  }, [channelCategories]);

  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const handleDelete = useCallback(userId => {
    delInviteMember(userId);
    document
      .getElementsByName('invite_' + userId)
      .forEach(item => (item.checked = false));
  }, []);

  const checkObj = useMemo(
    () => ({
      name: 'invite_',
      onChange: (e, userInfo) => {
        if (e.target.checked) {
          addInviteMember({
            id: userInfo.id,
            name: userInfo.name,
            presence: userInfo.presence,
            photoPath: userInfo.photoPath,
            PN: userInfo.PN,
            LN: userInfo.LN,
            TN: userInfo.TN,
            dept: userInfo.dept,
            type: userInfo.type,
            isShow: true,
          });

          document
            .getElementsByName('invite_' + userInfo.id)
            .forEach(item => (item.checked = true));
        } else {
          delInviteMember(userInfo.id);
          document
            .getElementsByName('invite_' + userInfo.id)
            .forEach(item => (item.checked = false));
        }
      },
      disabledList: oldMembers,
      disabledKey: 'id',
      checkedList: members,
      checkedKey: 'id',
    }),
    [oldMembers, members],
  );

  const addInviteMember = useCallback(member => {
    setMembers(prevState => prevState.concat(member));
  }, []);

  const delInviteMember = useCallback(memberId => {
    setMembers(prevState => prevState.filter(item => item.id != memberId));
  }, []);

  // 채널 아이콘
  const handleFileChange = e => {
    const target = e.target;

    if (target.files.length > 0) {
      const iconImage = target.files[0];

      // validation check
      if (!iconImage.type.startsWith('image/')) {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic(
              'Msg_InvalidImage',
              '잘못된 이미지 입니다. 다른 이미지를 등록해주세요.',
            ),
            callback: () => {},
          },
          dispatch,
        );
        return;
      }

      setIconImagePath(URL.createObjectURL(iconImage));
      setIcon(iconImage);

      /* const data = new FormData();
      data.append('file', iconImage);
      modifyUserProfileImage(data).then(({ data }) => {
        if (data.status === 'SUCCESS') {
          // 프로필 사진 등록 성공
          dispatch(changeMyPhotoPath(data.result));
        }
      }); */
    }
  };

  // 채널 생성
  const handleCreateBtn = () => {
    if (selectStage === 0) {
      setSelectStage(1);
      return;
    }
    /*
    let inviteMembers = [];
    const groupItem = members.find(item => item.type == 'G');
    if (groupItem != undefined) {
      getAllUserWithGroup(groupItem.id).then(({ data }) => {
        inviteMembers = inviteMembers.concat(data.result);
        handleCreateBtnCallback(inviteMembers);
      });
    } else {
      members.forEach(item => {
        inviteMembers.push(item);
      });
      handleCreateBtnCallback(inviteMembers);
    } */

    let inviteMembers = [];
    let groupItems = [];
    members.forEach(item => {
      if (item.type != 'G') {
        inviteMembers.push(item);
      } else {
        groupItems.push(item);
      }
    });

    let groupItemSize = groupItems.length;
    if (groupItemSize > 0) {
      groupItems.forEach(groupItem => {
        getAllUserWithGroup(groupItem.id).then(({ data }) => {
          inviteMembers = inviteMembers.concat(data.result);
          groupItemSize--;
          if (groupItemSize == 0) {
            handleCreateBtnCallback(inviteMembers);
          }
        });
      });
    } else {
      handleCreateBtnCallback(inviteMembers);
    }
  };

  const handleCreateBtnCallback = inviteMembers => {
    // 비밀번호 암호화
    let encryptSecretKey = '';
    if (openType != 'O' && secretKey) {
      const AESUtil = getAesUtil();
      encryptSecretKey = AESUtil.encrypt(secretKey);
    }

    const makeInfo = {
      name: name,
      roomType: 'C',
      description: desc,
      categoryCode: category.categoryCode,
      openType: openType, //P(비공개), O(공개), L(목록 공개)
      secretKey: encryptSecretKey, // openType이 L일 경우에 암호화 하여 전달
      members: inviteMembers,
    };

    const makeData = {
      newChannel: true,
      makeInfo: makeInfo,
    };

    // dispatch(openChannel(makeData));
    // dispatch(makeChannelView(makeInfo));
    let invites = [];
    let targetArr = [];
    makeInfo.members.forEach(item => {
      invites.push(item.id);
      if (item.id != sender) {
        targetArr.push({
          targetCode: item.id,
          targetType: 'UR',
        });
      }
    });

    if (invites.indexOf(sender) == -1) {
      invites.push(sender);
    }

    const data = {
      roomType: makeInfo.roomType,
      name: makeInfo.name, // 이름
      description: makeInfo.description, // ONLY CHANNEL
      openType: makeInfo.openType,
      secretKey: makeInfo.secretKey,
      categoryCode: makeInfo.categoryCode,
      members: invites, // 채널 생성 시 참가 인원 ( 자기 자신도 멤버에 포함 )
      targetArr, //
    };

    createChannel(data).then(({ data }) => {
      if (data.status === 'SUCCESS') {
        const { roomId } = data.result.room;
        // TODO: 채널 아이콘 등록
        if (icon) {
          const formData = new FormData();
          formData.append('fileName', icon);
          formData.append('roomId', roomId);

          uploadChannelIcon(formData).then(({ data }) => {
            const params = { roomId };
            if (data.flag === true) {
              params.iconPath = data.photoPath;
            }
            dispatch(openChannel(params));
          });
        } else {
          if (data?.result?.room && roomId) {
            dispatch(openChannel(data.result.room));
          }
        }
      }
    });
    clearLayer(dispatch);
  };

  return (
    <div className="layerWrap Layer-AddChannel">
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{headerName}</p>
        </div>
        <a className="Okbtn" onClick={handleCreateBtn}>
          <span className="colortxt-point mr5">
            {selectStage === 0
              ? covi.getDic('Next', '다음')
              : covi.getDic('CreateChannel', '채널 생성')}
          </span>
        </a>
      </div>

      <div
        className={[
          'container Layer-AddChannel-Con tabcontent',
          selectStage === 0 ? 'active' : '',
        ].join(' ')}
        style={{ height: 'calc(100% - 50px)' }}
      >
        <Scrollbars style={{ height: 'calc(100% - 80px)' }} autoHide={true}>
          <div
            className="add-cover-photo"
            onClick={e => {
              fileUploadControl.current.click();
            }}
          >
            {!iconImagePath ? (
              <span>{covi.getDic('AddPhoto', '사진추가')}</span>
            ) : (
              <img
                src={iconImagePath}
                style={{ width: '100%', height: '100%', borderRadius: '15px' }}
              />
            )}
            <input
              ref={fileUploadControl}
              type="file"
              accept="image/*"
              style={{ opacity: '0.0' }}
              onChange={handleFileChange}
            />
          </div>
          <div className="Profile-info-input">
            <div className="input full">
              <label style={{ cursor: 'default' }} className="string optional">
                {covi.getDic('ChannelName', '채널이름')}
              </label>
              <input
                className="string optional"
                placeholder={covi.getDic(
                  'Msg_InputChannelName',
                  '채널이름을 입력하세요.',
                )}
                type="text"
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="input full">
              <label style={{ cursor: 'default' }} className="string optional">
                {covi.getDic('ChannelDescription', '채널설명')}
              </label>
              <input
                className="string optional"
                placeholder={covi.getDic(
                  'Msg_InputChannelDesc',
                  '채널설명을 입력하세요.',
                )}
                type="text"
                onChange={e => setDesc(e.target.value)}
              />
            </div>
            <div className="input full">
              <label style={{ cursor: 'default' }} className="string optional">
                {covi.getDic('Category', '카테고리')}
              </label>
              <div className="link_select_box">
                <a onClick={() => setDisplayCategory(!displayCategory)}>
                  {category.categoryName}
                </a>
                <ul
                  className="select_list"
                  style={{ display: displayCategory ? 'block' : 'none' }}
                >
                  {channelCategories.map(category => {
                    return (
                      <li
                        key={category.categoryCode}
                        onClick={() => {
                          setCategory(category);
                          setDisplayCategory(false);
                        }}
                      >
                        {category.categoryName}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className="input full">
              <label style={{ cursor: 'default' }} className="string optional">
                {covi.getDic('ChannelType', '공개여부')}
              </label>
              <div className="checkbox-wrap">
                <div className="chkStyle01">
                  <input
                    type="radio"
                    name="chk_info"
                    id="chk02"
                    onChange={e => setOpenType('P')}
                    checked={openType === 'P'}
                  />
                  <label htmlFor="chk02">
                    <span></span>
                    {covi.getDic('Private', '비공개')}
                  </label>
                </div>
                <div className="chkStyle01">
                  <input
                    type="radio"
                    id="chk01"
                    onChange={e => setOpenType('O')}
                    name="chk_info"
                    checked={openType === 'O'}
                  />
                  <label htmlFor="chk01">
                    <span></span>
                    {covi.getDic('Public', '공개')}
                  </label>
                </div>
                <div className="chkStyle01">
                  <input
                    type="radio"
                    name="chk_info"
                    id="chk03"
                    onChange={e => setOpenType('L')}
                    checked={openType === 'L'}
                  />
                  <label htmlFor="chk03">
                    <span></span>
                    {covi.getDic('Permission', '목록만공개')}
                  </label>
                </div>
              </div>
            </div>
            {openType != 'O' && (
              <div className="input full">
                <label
                  style={{ cursor: 'default' }}
                  className="string optional"
                >
                  {covi.getDic('ChannelPassword', '가입암호')}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic(
                    'Msg_InputChannelPassword',
                    '가입시 필요한 암호를 입력하세요.',
                  )}
                  type="password"
                  onChange={e => setSecretKey(e.target.value)}
                />
              </div>
            )}
          </div>
        </Scrollbars>
        <div
          className="layer-bottom-btn-wrap"
          onClick={() => {
            if (!name) {
              openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic(
                    'Msg_InputChannelName',
                    '채널이름을 입력하세요.',
                  ),
                },
                dispatch,
              );
            } else if (openType != 'O' && secretKey == '') {
              openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic(
                    'Msg_InputPassword',
                    '비밀번호를 입력해주세요',
                  ),
                },
                dispatch,
              );
            } else {
              setSelectStage(1);
            }
          }}
        >
          <a className="Btn-pointcolor-full">{covi.getDic('Next', '다음')}</a>
        </div>
      </div>

      <div
        className={[
          'container AddUser tabcontent',
          selectStage === 1 ? 'active' : '',
        ].join(' ')}
      >
        <div className="org_select_wrap">
          <ul>
            {members &&
              members.map(item => {
                if (item.isShow) {
                  return (
                    <li key={'invite_' + item.id}>
                      <a
                        className="ui-link"
                        onClick={() => {
                          handleDelete(item.id);
                        }}
                      >
                        <ProfileBox
                          userId={item.id}
                          img={item.photoPath}
                          presence={item.presence}
                          isInherit={true}
                          userName={item.name}
                          handleClick={false}
                        />
                        <p className="name">{getJobInfo(item)}</p>
                        <span className="del"></span>
                      </a>
                    </li>
                  );
                }
              })}
          </ul>
        </div>
        <ul className="tab">
          <li className={selectTab == 'C' ? 'active' : ''} data-tab="tab1">
            <a
              onClick={() => {
                setSelectTab('C');
              }}
            >
              {covi.getDic('Contact', '내 대화상대')}
            </a>
          </li>
          <li className={selectTab == 'O' ? 'active' : ''} data-tab="tab2">
            <a
              onClick={() => {
                setSelectTab('O');
              }}
            >
              {covi.getDic('OrgChart', '조직도')}
            </a>
          </li>
        </ul>
        <div
          className={['tabcontent', selectTab == 'C' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <ContactList viewType="checklist" checkObj={checkObj} />
          </div>
        </div>
        <div
          className={['tabcontent', selectTab == 'O' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={checkObj} />
          </div>
        </div>
        <div
          className={['tabcontent', selectTab == 'E' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            {covi.getDic('ExternalUser', '외부사용자')}
          </div>
        </div>
        <div className="layer-bottom-btn-wrap">
          <a className="Btn-pointcolor-full" onClick={handleCreateBtn}>
            {covi.getDic('CreateChannel', '채널 생성')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default CreateChannel;
