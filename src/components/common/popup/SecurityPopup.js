import React from 'react';
import { evalConnector } from '@/lib/deviceConnector';
import { getConfig } from '@/lib/util/configUtil';
import { Box, Modal } from '@material-ui/core';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #999',
  boxShadow: 34,
  p: 4,
};

const SecurityPopup = props => {
  const { popUpVisible, setPopUpVisible, securityLevel, setSecurityLevel } = props;
  const IpSecurityCheck = getConfig('UseIpSecurity', {forcePolicyUse: false, forceValue: 0});

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
          <div className="securityPopupTitle">{covi.getDic('IpSecurity')}</div>
          <div className="securityPopupDescription">
            {covi.getDic('SecurityPopupDescription1')}
            <br />
            {covi.getDic('SecurityPopupDescription2')}
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
              {covi.getDic('DoNotUse')}
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
              {covi.getDic('Level1')}
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
              {covi.getDic('Level2')}
            </div>
          </div>

          {IpSecurityCheck.forcePolicyUse === true && (
            <div className="ipCaution">{covi.getDic('IpCaution')}</div>
          )}

          <div className="ipBtnBox">
            <button className="ipConfirmBtn" onClick={handleConfirm}>
              {covi.getDic('Ok')}
            </button>
            <button className="ipCloseBtn" onClick={handleClose}>
              {covi.getDic('Cancel')}
            </button>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default SecurityPopup;
