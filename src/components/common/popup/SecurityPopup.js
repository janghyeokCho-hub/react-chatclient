import React from 'react';
import { evalConnector } from '@/lib/deviceConnector';
import { getConfig } from '@/lib/util/configUtil';
import { Box, Modal } from '@material-ui/core';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #999',
  boxShadow: 34,
  maxWidth: '100%',
  minWidth: '300px',
  width: 'auto',
  p: 4,
  display: 'table',
  padding: 25,
};

const SecurityPopup = props => {
  const { popUpVisible, setPopUpVisible, securityLevel, setSecurityLevel } =
    props;
  const IpSecurityCheck = getConfig('UseIpSecurity', {
    forcePolicyUse: false,
    forceValue: 0,
  });

  const handleConfig = data => {
    evalConnector({
      method: 'sendSync',
      channel: 'save-static-config',
      message: data,
    });
  };

  const handleIpSecurityLevel = e => {
    const value = parseInt(e.target.value);
    setSecurityLevel(value);
  };

  const handleConfirm = () => {
    handleConfig({ securityLevel: securityLevel });
    setPopUpVisible(false);
  };

  const handleClose = () => {
    setSecurityLevel(IpSecurityCheck.forceValue);
    setPopUpVisible(false);
  };

  return (
    <>
      <Modal open={popUpVisible} onClose={handleClose}>
        <Box sx={style} className="securityPopupBox">
          <div className="securityPopupTitle">
            {covi.getDic('IpSecurity', 'IP 보안')}
          </div>
          <div className="securityPopupDescription">
            {covi.getDic(
              'SecurityPopupDescription1',
              '자동 로그인 설정을 한 사용자의 정보를 타인이 가로채어 서비스를 부정하게 이용하는 것을 방지하기 위한 보안 기능입니다.',
            )}
            <br />
            {covi.getDic(
              'SecurityPopupDescription2',
              '최근 로그인 한 IP 정보와 서비스 이용 IP를 비교하여 사용자의 IP 보안 단계 별 설정 조건에 맞지 않는 다른 IP가 서비스 접근 시 이용을 차단 시킵니다.',
            )}
          </div>
          <div className="ipRadioBox">
            <div className="ipRadio">
              <input
                disabled={IpSecurityCheck.forcePolicyUse === true}
                id="LEVEL0"
                value={-1}
                name="platform"
                type="radio"
                checked={securityLevel === -1}
                onChange={handleIpSecurityLevel}
              />
              {covi.getDic('DoNotUse', '사용 하지 않음')}
            </div>
            <div className="ipRadio">
              <input
                id="LEVEL1"
                disabled={IpSecurityCheck.forcePolicyUse === true}
                value={1}
                name="platform"
                type="radio"
                checked={securityLevel === 1}
                onChange={handleIpSecurityLevel}
              />
              {covi.getDic(
                'Level1',
                '1단계 - 로그인한 IP 대역과 동일한 경우(C클래스)만 허용',
              )}
            </div>
            <div className="ipRadio">
              <input
                id="LEVEL2"
                disabled={IpSecurityCheck.forcePolicyUse === true}
                value={2}
                name="platform"
                type="radio"
                checked={securityLevel === 2}
                onChange={handleIpSecurityLevel}
              />
              {covi.getDic(
                'Level2',
                '2단계 - 로그인 후 IP주소가 변경되지 않은 경우만 허용',
              )}
            </div>
          </div>

          {IpSecurityCheck.forcePolicyUse === true && (
            <div className="ipCaution">
              {covi.getDic(
                'IpCaution',
                '※ 시스템 정책에 의해 IP 보안설정을 변경할 수 없습니다.',
              )}
            </div>
          )}

          <div className="ipBtnBox">
            <button className="ipConfirmBtn" onClick={handleConfirm}>
              {covi.getDic('Ok', '확인')}
            </button>
            <button className="ipCloseBtn" onClick={handleClose}>
              {covi.getDic('Cancel', '취소')}
            </button>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default SecurityPopup;
