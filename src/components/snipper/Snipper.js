import React, { Fragment, useState, useEffect } from 'react';
import Cropper from './Cropper';
import Jimp from 'jimp';
import { ipcRenderer } from 'electron';
import { app, screen, getCurrentWindow, BrowserWindow, clipboard, shell, desktopCapturer, nativeImage } from '@electron/remote';

const path = require('path');
const screenSize = screen.getPrimaryDisplay().size;
const uuidv4 = require('uuid/v4');
const fs = require('fs');

let snipWindow = null;
let mainWindow = null;
let allWindows = BrowserWindow.getAllWindows();

const Snipper = ({ props }) => {
    // const dispatch = useDispatch();

    useEffect(() => {
        ipcRenderer.once('windowControl', (event, data) => {
            console.log('windowControl', data);
        });
    }, []);

    const [view, setView] = useState(getContext());
    // const [ view, setView ] = useState(false);
    const [save_controls, setSave_controls] = useState(false);
    const [image, setImage] = useState('');

    function getContext() {
        const context = global.location.hash;
        ipcRenderer.once('windowControl', (event, data) => {
            console.log('windowControl', data);
        });
        return context.split('?')[1];
    }

    const initCropper = () => {
        mainWindow = getCurrentWindow();
        // mainWindow.hide();
        // allWindows = BrowserWindow.getAllWindows();
        // allWindows.map(item => {
        //     item.hide();
        // })
        snipWindow = new BrowserWindow({
            width: screenSize.width,
            height: screenSize.height,
            frame: false,
            transparent: true,
            kiosk: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                nodeIntegrationInSubFrames: true
            }
        });
        snipWindow.moveTop();

        // snipWindow.openDevTools();
        snipWindow.on('close', () => {
            snipWindow = null;
        });
        ipcRenderer.once('snip', (event, data) => {
            captureScreen(data, null);
        });
        ipcRenderer.once('cancelled', event => {
            // mainWindow.show();
            allWindows.map(item => {
                item.show();
            });
            // allWindows.show();
        });
        snipWindow.loadURL(window.location.href + '?snip');
        snipWindow.setResizable(false);
        //snipWindow.webContents.openDevTools();
    };

    const getAllInstances = () => {
        return BrowserWindow.getAllWindows();
    };

    const getMainInstance = () => {
        let instances = getAllInstances();
        return instances.filter((instance) => {
            return instance.id !== getCurrentWindow().id;
        });
    };

    const destroyCurrentWindow = () => {
        getCurrentWindow().close();
    };

    async function getScreenShot(format) {
        console.log('Start getScreenShot');
        const imageFormat = format || 'image/png';
        const handleStream = (stream) => new Promise((resolve, reject) => {
            // Create canvas
            const video_dom = document.createElement('video');
            video_dom.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
            // Event connected to stream
            video_dom.onloadedmetadata = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Set video ORIGINAL height (screenshot)
                video_dom.play();

                video_dom.style.width = video_dom.videoWidth + 'px'; // videoWidth
                video_dom.style.height = video_dom.videoHeight + 'px'; // videoHeight
                canvas.width = video_dom.videoWidth;
                canvas.height = video_dom.videoHeight;
                // Draw video on canvas
                ctx.drawImage(video_dom, 0, 0, canvas.width, canvas.height);
                // allWindows.map(item => {
                //     item.show();
                // });
                // Remove hidden video tag
                const returnData = canvas.toDataURL(imageFormat);
                video_dom.remove();
                try {
                    // Destroy connect to stream
                    stream.getTracks()[0].stop();
                } catch (e) {
                    console.log('Error@@   ', e);
                    allWindows.map(item => {
                        item.show();
                    });
                    reject(e);
                }
                resolve(returnData);
            };
            video_dom.srcObject = stream;
            document.body.appendChild(video_dom);
        });
        console.log('Start getResouce  ', desktopCapturer.getSources);
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        for(const source of sources) {
            if (source.name === 'Entire Screen') {
                console.log('Source@@   ', sources);
                let stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: source.id
                        }
                    }
                });
                console.log('EntireScreen HandleStream  ', stream);
                return handleStream(stream);
            } else if (source.name === "Screen 1") {
                console.log('Screen 1 HandleStream  ', source);
                let stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: source.id
                        }
                    }
                });
                return handleStream(stream);
            }
        }
    }
    function captureScreen(coordinates) {
        mainWindow = getCurrentWindow();
        mainWindow.hide();
        setTimeout(async () => {
            const base64data = await getScreenShot();
            console.log('ScreenShot@@  ', base64data);
            // add to buffer base64 image instead of saving locally in order to manipulate with Jimp
            const encondedImageBuffer = new Buffer.from(base64data.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64');
            Jimp.read(encondedImageBuffer, (err, image) => {
                if (err) throw err;
                const crop = coordinates ?
                    image.crop(coordinates.x, coordinates.y, parseInt(coordinates.width, 10), parseInt(coordinates.height, 10)) :
                    image.crop(0, 0, screenSize.width, screenSize.height);
                crop.getBase64('image/png', (err, base64data) => {
                    clipboard.writeImage(
                        nativeImage.createFromDataURL(base64data)
                    );
                    // var file = dataURLtoFile(base64data);
                    BrowserWindow.getAllWindows().map(item => {
                        item.webContents.send('imageData', base64data);
                    })
                    setImage(base64data);
                    setSave_controls(true);
                    resizeWindowFor('snip');
                    mainWindow.close();
                });
            });
        }, 200);
    }

    const snip = (state) => {
        console.log('Snip@');
        getMainInstance().map(item => {
            item.webContents.send('snip', state);
        })
        destroyCurrentWindow(null);
    }

    const destroySnipView = () => {
        console.log('Destroy');
        getMainInstance().map(item => {
            item.webContents.send('cancelled');
        })
        destroyCurrentWindow(null);
    }

    const resizeWindowFor = (view) => {
        if (view === 'snip') {
            mainWindow.setSize(400, 500);
            let x = (screenSize.width / 2) - 400;
            let y = (screenSize.height / 2) - 250;
            mainWindow.setPosition(x, y);
        } else if (view === 'main') {
            const width = 400;
            const height = 200;
            mainWindow.setSize(width, height);
            let x = (screenSize.width / 2) - width / 2;
            let y = (screenSize.height / 2) - height / 2;
            mainWindow.setPosition(x, y);
        }
    }

    const discardSnip = () => {
        setImage('');
        setSave_controls(false);
        resizeWindowFor('main');
    }

    const saveToDisk = () => {
        const directory = app.getPath('pictures');
        const filepath = path.join(directory + '/' + uuidv4() + '.png');
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
        fs.writeFile(filepath, image.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64', (err) => {
            if (err) console.log(err);
            shell.showItemInFolder(filepath);
            discardSnip(null);
        });
    }

    return (
        <Fragment>
            {view === 'snip' ? (
                <Cropper
                    snip={snip}
                    destroySnipView={destroySnipView}
                />
            ) :
                <div className="snip-controls text-center"
                    style={{ marginTop: '50px' }}
                >
                    <div>
                        <h2 style={{
                            textAlign: 'center',
                            marginTop: '15px'
                        }}>
                            {covi.getDic('Snipper')}
                        </h2>
                    </div>

                    {!save_controls ?
                        <div style={{ textAlign: 'center' }}>
                            <button style={{
                                width: '130px',
                                marginRight: '5px',
                                marginTop: '10px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'solid 2px #12CFEE',
                                backgroundColor: '#12CFEE',
                                color: 'white'
                            }}
                                className="btn btn-primary mr-1"
                                onClick={() => captureScreen()}>
                                {covi.getDic('Fullscreen')}
                            </button>

                            <button style={{
                                width: '130px',
                                marginRight: '5px',
                                marginTop: '10px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'solid 2px #12CFEE',
                                backgroundColor: '#12CFEE',
                                color: 'white'
                            }}
                                className="btn btn-primary mr-1"
                                onClick={() => initCropper()}>
                                {covi.getDic('CropImage')}
                            </button>
                        </div> :
                        <div style={{ textAlign: 'center' }}>
                            <button style={{
                                width: '130px',
                                marginRight: '5px',
                                marginTop: '10px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'solid 2px #12CFEE',
                                backgroundColor: '#12CFEE',
                                color: 'white'
                            }}
                                className="btn btn-primary mr-1"
                                onClick={saveToDisk}>
                                {covi.getDic('SaveToDisk')}
                            </button>

                            <button style={{
                                width: '130px',
                                marginRight: '5px',
                                marginTop: '10px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'solid 2px #12CFEE',
                                backgroundColor: '#12CFEE',
                                color: 'white'
                            }}
                                className="btn btn-primary mr-1"
                                onClick={discardSnip}>
                                {covi.getDic('Cancel')}
                            </button>

                        </div>
                    }
                </div>
            }
            {image &&
                <div className="snipped-image"
                    style={{
                        margin: '50px auto 50px',
                    }}>
                    <img className="preview" src={image}
                        style={{
                            display: 'block',
                            margin: '0px auto',
                            maxWidth: '500px',
                            maxHeight: '300px'
                        }} />
                </div>
            }
        </Fragment>
    )
}

export default Snipper;
