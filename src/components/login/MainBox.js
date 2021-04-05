import React, { useState, useMemo } from 'react';
import LinkButton from '@COMMON/buttons/LinkButton';
import SelectBox from '@COMMON/buttons/SelectBox';
import { useDispatch } from 'react-redux';
import { getConfig } from '@/lib/util/configUtil';
import { evalConnector } from '@/lib/deviceConnector';
import { openPopup } from '@/lib/common';

const MainBox = () => {
  const dispatch = useDispatch();

  const [lang, setLang] = useState(covi.settings.lang);

  const clientLangList = useMemo(() => {
    const langList = getConfig('ClientLangList');

    if (typeof langList == 'object') return langList;
    else return [{ name: '한국어', value: 'ko' }];
  }, []);

  const handleConfig = data => {
    const result = evalConnector({
      method: 'sendSync',
      channel: 'save-static-config',
      message: data,
    });
  };

  return (
    <>
      <div className="LoginBox">
        <h1 className="logo-img"></h1>
        <div>
          <LinkButton to="/client/login" className="LoginBtn Type1">
            {covi.getDic('EmployeeLogin')}
          </LinkButton>
          <LinkButton
            to="/client/login?type=external"
            className="LoginBtn Type2"
          >
            {covi.getDic('ExternalLogin')}
          </LinkButton>
        </div>
        <SelectBox
          items={clientLangList}
          order={1}
          defaultValue={lang}
          onChange={(item, canceled) => {
            openPopup(
              {
                type: 'Confirm',
                message: covi.getDic('Msg_ApplyAndRefresh'),
                callback: result => {
                  if (result) {
                    localStorage.setItem('covi_user_lang', item.value);

                    if (DEVICE_TYPE == 'd') {
                      handleConfig({ lang: item.value });
                      evalConnector({
                        method: 'send',
                        channel: 'reload-app',
                        message: { clearConfigs: true, isLangChange: true },
                      });
                      // reload App
                    } else {
                      location.reload();
                    }
                  } else {
                    canceled();
                  }
                },
              },
              dispatch,
            );
          }}
        ></SelectBox>
      </div>
      {/*
      TODO: 아래 기능 구현되면 표시
      <div className="LoginBottom">
        <Link to="/client/login/join">외부사용자 계정생성</Link>
        <Link to="/client/download">다운로드 페이지</Link>
        <Link to="/client/download">다운로드 페이지</Link>
      </div>*/}
    </>
  );
};

export default MainBox;
