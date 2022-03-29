import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';
import App from '@C/App';
import { HashRouter } from 'react-router-dom';
import ErrorBoundary from '@C/ErrorBoundary';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import rootReducer, { rootSaga } from '@/modules';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevTools } from 'redux-devtools-extension';
import SWRDevtools from '@jjordy/swr-devtools';
import { cache, mutate } from 'swr';
import { setInitConfig, getInitSettings } from '@/lib/util/configUtil';
import { createStorage } from '@/lib/util/storageUtil';
import { closeWindow, evalConnector } from '@/lib/deviceConnector';

// DESKTOP Local File DB
createStorage();

const sagaMiddleware = createSagaMiddleware();

const store = (() => {
  if (DEF_MODE == 'development') {
    return createStore(
      rootReducer,
      composeWithDevTools(applyMiddleware(sagaMiddleware)),
      // applyMiddleware(sagaMiddleware)
    );
  } else {
    return createStore(rootReducer, applyMiddleware(sagaMiddleware));
  }
})();

sagaMiddleware.run(rootSaga);

setInitConfig(result => {
  window.covi.config = result.config;
  window.covi.dic = result.dic;
  // lang, pn
  window.covi.settings = getInitSettings();

  ReactDOM.render(
    <>
      {DEF_MODE === 'development' && <SWRDevtools cache={cache} mutate={mutate} /> }
      <Provider store={store}>
        <ErrorBoundary>
          <HashRouter>
            <App />
          </HashRouter>
        </ErrorBoundary>
      </Provider>
    </>,
    document.getElementById('root'),
  );
});
