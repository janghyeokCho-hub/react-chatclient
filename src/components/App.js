import React, { Component, Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import TokenChecker from '@COMMON/TokenChecker';
import URLChecker from '@COMMON/URLChecker';
import SocketContainer from '@/containers/socket/SocketContainer';

import { hot } from 'react-hot-loader';

import {
  IndexMain,
  LoginMain,
  JoinForm,
  AutoLogin,
  AppTemplate,
  ChatRoom,
  Channel, // 채널
  MakeRoom,
  UserSetting,
  FileLayer,
  Offline,
  Versions,
  JoinSuccess,
  Snipper,
  Extension,
} from '@C/route/main/index.async';

import SimplePopup from '@COMMON/popup/SimplePopup';
import PresenceContainer from '@/containers/presence/PresenceContainer';
import Titlebar from '@C/Titlebar';
import { Helmet } from 'react-helmet';

const TITLE = APP_VERSION;

class App extends Component {
  constructor(props) {
    console.log('Version ::', APP_VERSION);
    super(props);
    this.state = {
      view: this.getContext(),
    };
  }

  getContext = () => {
    const context = global.location.hash;
    return context.split('?')[1];
  };

  tokenCheck = () => {
    const { token } = this.props;
    const localToken = localStorage.getItem('covi_user_access_token');
    let tokenCheckFlag = false;
    let gotoURL = '';

    // store에 token이 존재하지 않고 localStorage에만 존재할경우 token 체크 필요
    if (!token && localToken) {
      tokenCheckFlag = true;
    } else if (token && !localToken) {
      localStorage.setItem('covi_user_access_token', token);
    } else if (!token && !localToken) {
      gotoURL = '/client';
    }

    return { tokenCheckFlag: tokenCheckFlag, gotoURL: gotoURL };
  };

  getInitTheme = () => {
    return (window.covi.settings && window.covi.settings.theme) || 'blue';
  };

  getFontSizeClz = () => {
    let fontSize = 'm';
    if (
      this.props.fontSize === 's' ||
      this.props.fontSize === 'm' ||
      this.props.fontSize === 'l'
    ) {
      fontSize = this.props.fontSize;
    } else {
      fontSize = (window.covi.settings && window.covi.settings.fontSize) || 'm';
    }
    return `font-size-${fontSize}`;
  };

  render() {
    const { tokenCheckFlag, gotoURL } = this.tokenCheck();
    const { theme, fontSize, error } = this.props;

    return (
      <>
        <Helmet>
          <title>eumtalk - v{TITLE}</title>
        </Helmet>
        {(navigator.onLine && (
          <div
            className={[
              theme ? theme : this.getInitTheme(),
              this.getFontSizeClz(),
            ].join(' ')}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
          >
            {DEVICE_TYPE === 'b' ||
            (DEVICE_TYPE == 'd' && this.state.view == 'snip') ? (
              <></>
            ) : (
              <>
                <Titlebar></Titlebar>
              </>
            )}

            {/* <div
              style={{
                width: '100%',
                height: DEVICE_TYPE == 'b' ? '100%' : 'calc(100% - 30px)',
                position: 'relative',
              }}
            > */}

            {this.state.view == 'snip' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}
              >
                {tokenCheckFlag &&
                  ((DEVICE_TYPE == 'd' && (
                    <TokenChecker
                      returnURL={window.location.hash}
                    ></TokenChecker>
                  )) || (
                    <TokenChecker
                      returnURL={window.location.pathname}
                    ></TokenChecker>
                  ))}
                {!tokenCheckFlag && (
                  <Switch>
                    <Route path="/client" component={IndexMain} exact />
                    <Route path="/client/login" component={LoginMain} exact />
                    <Route
                      path="/client/login/join"
                      component={JoinForm}
                    ></Route>
                    <Route
                      path="/client/login/joinsucess"
                      component={JoinSuccess}
                    ></Route>
                    <Route
                      path="/client/autoLogin"
                      component={AutoLogin}
                    ></Route>
                    <Route
                      path="/client/nw/versions/:platform/:arch"
                      component={Versions}
                    />
                    {/* 로그인 이후 URL */}
                    {gotoURL !== '/client' ? (
                      <Switch>
                        <Route path="/client/main" component={AppTemplate} />
                        <Route
                          path="/client/nw/chatroom/:roomID"
                          component={ChatRoom}
                        />
                        <Route
                          path="/client/nw/makeroom"
                          component={MakeRoom}
                        />
                        <Route path="/client/nw/snipper" component={Snipper} />
                        <Route
                          path="/client/nw/extension"
                          component={Extension}
                        />
                        <Route
                          path="/client/nw/usersetting"
                          component={UserSetting}
                        />
                        <Route
                          path="/client/nw/preview"
                          component={FileLayer}
                        />
                        {/* 채널 */}
                        <Route
                          path="/client/nw/channel/:roomId"
                          component={Channel}
                        />
                        <Route
                          component={props => (
                            <URLChecker {...props} gotoURL={gotoURL} />
                          )}
                        />
                      </Switch>
                    ) : (
                      <Route
                        component={props => (
                          <URLChecker {...props} gotoURL={gotoURL} />
                        )}
                      />
                    )}
                  </Switch>
                )}
                <SimplePopup /> {/* 공통 알림 팝업 */}
                <SocketContainer /> {/* 소켓 관리 */}
                <PresenceContainer /> {/* 프레젠스 관리 */}
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: DEVICE_TYPE == 'b' ? '100%' : 'calc(100% - 30px)',
                  position: 'relative',
                }}
              >
                {tokenCheckFlag &&
                  ((DEVICE_TYPE == 'd' && (
                    <TokenChecker
                      returnURL={window.location.hash}
                    ></TokenChecker>
                  )) || (
                    <TokenChecker
                      returnURL={window.location.pathname}
                    ></TokenChecker>
                  ))}
                {!tokenCheckFlag && (
                  <Switch>
                    <Route path="/client" component={IndexMain} exact />
                    <Route path="/client/login" component={LoginMain} exact />
                    <Route
                      path="/client/login/join"
                      component={JoinForm}
                    ></Route>
                    <Route
                      path="/client/login/joinsucess"
                      component={JoinSuccess}
                    ></Route>
                    <Route
                      path="/client/autoLogin"
                      component={AutoLogin}
                    ></Route>
                    <Route
                      path="/client/nw/versions/:platform/:arch"
                      component={Versions}
                    />
                    {/* 로그인 이후 URL */}
                    {gotoURL !== '/client' ? (
                      <Switch>
                        <Route path="/client/main" component={AppTemplate} />
                        <Route
                          path="/client/nw/extension"
                          component={Extension}
                        />
                        <Route
                          path="/client/nw/chatroom/:roomID"
                          component={ChatRoom}
                        />
                        <Route
                          path="/client/nw/makeroom"
                          component={MakeRoom}
                        />
                        <Route path="/client/nw/snipper" component={Snipper} />
                        <Route
                          path="/client/nw/usersetting"
                          component={UserSetting}
                        />
                        <Route
                          path="/client/nw/preview"
                          component={FileLayer}
                        />
                        {/* 채널 */}
                        <Route
                          path="/client/nw/channel/:roomId"
                          component={Channel}
                        />
                        <Route
                          component={props => (
                            <URLChecker {...props} gotoURL={gotoURL} />
                          )}
                        />
                      </Switch>
                    ) : (
                      <Route
                        component={props => (
                          <URLChecker {...props} gotoURL={gotoURL} />
                        )}
                      />
                    )}
                  </Switch>
                )}
                <SimplePopup /> {/* 공통 알림 팝업 */}
                <SocketContainer /> {/* 소켓 관리 */}
                <PresenceContainer /> {/* 프레젠스 관리 */}
              </div>
            )}
          </div>
        )) || <Offline></Offline>}
      </>
    );
  }
}

const appModule = () => {
  if (DEVICE_TYPE == 'b') {
    return hot(module)(
      connect(
        ({ login, menu }) => ({
          token: login.token,
          theme: menu.theme,
          fontSize: menu.fontSize,
        }),
        {},
      )(App),
    );
  } else {
    return connect(
      ({ login, menu }) => ({
        token: login.token,
        theme: menu.theme,
        fontSize: menu.fontSize,
      }),
      {},
    )(App);
  }
};

export default appModule();
