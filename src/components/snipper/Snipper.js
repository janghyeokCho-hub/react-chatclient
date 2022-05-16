import React, { Fragment, useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { app, screen, getCurrentWindow, shell } from '@electron/remote';
import { evalConnector } from '@/lib/deviceConnector';

const path = require('path');
const screenSize = screen.getPrimaryDisplay().size;
const uuidv4 = require('uuid/v4');
const fs = require('fs');

const BtnStyle = {
  width: '130px',
  marginRight: '5px',
  marginTop: '10px',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'solid 2px #12CFEE',
  backgroundColor: '#12CFEE',
  color: '#FFF',
};

const PreviwImage={
  display: 'block',
  margin: '0px auto',
  maxWidth: '500px',
  maxHeight: '300px',
}

const Snipper = ({ props }) => {
  const [save_controls, setSave_controls] = useState(false);
  const [image, setImage] = useState('');
  const mainWindow = getCurrentWindow();

  const resizeWindowFor = view => {
    if (view === 'snip') {
      mainWindow.setSize(400, 500);
      let x = screenSize.width / 2 - 400;
      let y = screenSize.height / 2 - 250;
      mainWindow.setPosition(x, y);
    } else if (view === 'main') {
      const width = 400;
      const height = 200;
      mainWindow.setSize(width, height);
      let x = screenSize.width / 2 - width / 2;
      let y = screenSize.height / 2 - height / 2;
      mainWindow.setPosition(x, y);
    }
  };
  
  const saveToDisk = () => {
    const directory = app.getPath('pictures');
    const filepath = path.join(directory + '/' + uuidv4() + '.png');
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
    fs.writeFile(
      filepath,
      image.replace(/^data:image\/(png|gif|jpeg);base64,/, ''),
      'base64',
      err => {
        if (err) console.log(err);
        shell.showItemInFolder(filepath);
        discardSnip(null);
      },
    );
    mainWindow.hide();
  };

  const discardSnip = () => {
    setImage('');
    setSave_controls(false);
    resizeWindowFor('main');
    mainWindow.close();
  };

  function createCropWindow() {
    evalConnector({
      method: 'send',
      channel: 'create-crop-window',
    });
    mainWindow.hide();
  }

  function fullScreenCapture() {
    mainWindow.hide();
    evalConnector({
      method: 'send',
      channel: 'full-screen-capture',
    });
    mainWindow.show();
  }

  useEffect(() => {
    ipcRenderer.on('imageDataSnipper', (event, payload) => {
      setImage(payload);
      setSave_controls(true);
      resizeWindowFor('snip');
    });
  }, [image]);

  useEffect(() => {
    ipcRenderer.once('openSnipWin', () => {
      mainWindow.show();
    });
  }, []);

  return (
    <Fragment>
      <div className="snip-controls text-center" style={{ marginTop: '50px' }}>
        <div>
          <h2
            style={{
              textAlign: 'center',
              marginTop: '15px',
            }}
          >
            {covi.getDic('Snipper', '캡처도구')}
          </h2>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            style={BtnStyle}
            className="btn btn-primary mr-1"
            onClick={!save_controls ? fullScreenCapture : saveToDisk}
          >
            {!save_controls
              ? covi.getDic('Fullscreen', '전체화면')
              : covi.getDic('SaveToDisk', '사진폴더에 저장')}
          </button>

          <button
            style={BtnStyle}
            className="btn btn-primary mr-1"
            onClick={!save_controls ? createCropWindow : discardSnip}
          >
            {!save_controls
              ? covi.getDic('CropImage', '부분화면')
              : covi.getDic('Cancel', '취소')}
          </button>
        </div>
      </div>
      {image && (
        <div
          style={{
            margin: '50px auto',
          }}
        >
          <img
            className="preview"
            src={image}
            style={PreviwImage}
          />
        </div>
      )}
    </Fragment>
  );
};

export default Snipper;
