import React, { Fragment, useState, useEffect } from 'react';
// import {useDispatch} from 'react-redux';
// import './Snipper.scss';
import Cropper from './Cropper';
import Jimp from 'jimp';
import electron, {
    ipcRenderer,
    desktopCapturer,
    screen,
    shell, 
    remote,
    clipboard,
} from 'electron';
// import { openPopup } from '@/lib/common';
// import * as coviFile from '@/lib/fileUpload/coviFile';
// import { changeFiles, clearFiles, deleteFile } from '@/modules/message';

const BrowserWindow = remote.BrowserWindow;
// const dev = process.env.NODE_ENV === 'development';
const path = require('path');
const screenSize = screen.getPrimaryDisplay().size;
const uuidv4 = require('uuid/v4');
const fs = require('fs');
// const {post} = require('axios');
const nativeImage = electron.nativeImage;

let snipWindow = null,
    mainWindow = null,
    allWindows = BrowserWindow.getAllWindows();

const Snipper = ({ props }) => {
    // const dispatch = useDispatch();

    useEffect(() => {
        ipcRenderer.once('windowControl', (event, data) => { 
            console.log('windowControl', data);
        });
    }, []);

    const [ view, setView ] = useState(getContext());
    // const [ view, setView ] = useState(false);
    const [ save_controls, setSave_controls ] = useState(false);
    const [ image, setImage ] = useState(''); 

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

        allWindows.map(item => {
            item.hide();
        })
        
        snipWindow = new BrowserWindow({
            width: screenSize.width,
            height: screenSize.height,
            frame : false,
            transparent : true,
            kiosk: true,
        });
        
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

    const getCurrentWindow = () => {
        return remote.getCurrentWindow();
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

    /////////////////////////////////////////////////

    const getScreenShot = (callback, imageFormat) => {
        // let _this = this;
        // this.callback = callback;
        imageFormat = imageFormat || 'image/png';
        const handleStream = (stream) => {
            // Create hidden video tag
            let video_dom = document.createElement('video');
            video_dom.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
            // Event connected to stream
            video_dom.onloadedmetadata = () => {
                // Set video ORIGINAL height (screenshot)
                video_dom.play();

                video_dom.style.width = video_dom.videoWidth + 'px'; // videoWidth
                video_dom.style.height = video_dom.videoHeight + 'px'; // videoHeight
                // video_dom.style.width = screenSize.width + 'px'; // videoWidth
                // video_dom.style.height = screenSize.height + 'px'; // videoHeight

                // Create canvas
                let canvas = document.createElement('canvas');

                canvas.width = video_dom.videoWidth;
                canvas.height = video_dom.videoHeight;
                // canvas.width = screenSize.width;
                // canvas.height = screenSize.height;
                let ctx = canvas.getContext('2d');
                // Draw video on canvas

                ctx.drawImage(video_dom, 0, 0, canvas.width, canvas.height);

                if (callback) {
                    // Save screenshot to base64
                    callback(canvas.toDataURL(imageFormat));
                    // saveToAADisk(canvas.toDataURL(imageFormat));
                } else {
                    console.log('Need callback!');
                    allWindows.map(item => {
                        item.show();
                    });
                }

                // Remove hidden video tag
                video_dom.remove();
                try {
                    // Destroy connect to stream
                    stream.getTracks()[0].stop();
                } catch (e) {
                    allWindows.map(item => {
                        item.show();
                    });
                }
            };
            video_dom.srcObject = stream;
            document.body.appendChild(video_dom);
        };

        // const handleError = (e) => {
        //     console.log(e);
        // };

        // const handleVStream = (stream) => {
        //     let video_dom = document.createElement('video');
        //     video_dom.onloadedmetadata = () => {
        //         // Set video ORIGINAL height (screenshot)
        //         console.log('video_dom',video_dom)
        //         video_dom.play();

        //         video_dom.style.width = video_dom.videoWidth + 'px'; // videoWidth
        //         video_dom.style.height = video_dom.videoHeight + 'px'; // videoHeight
        //     }
            
        //     //video_dom.src = URL.createObjectURL(stream);
        //     video_dom.srcObject  = stream;
        //     document.body.appendChild(video_dom);
        // }
        desktopCapturer.getSources({types: ['screen']}, async (error, sources) => {
            if (error) throw error;
            for (let i = 0; i < sources.length; ++i) {
                // Filter: main screen
                if (sources[i].name === "Entire screen") {
                    let stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sources[i].id
                            }
                        }
                    });
                   handleStream(stream); //handleError);

                    return;
                }else if (sources[i].name === "Screen 1"){
                    let stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sources[i].id
                            }
                        }
                    });
                   handleStream(stream); //handleError);

                    return;
                }
            }
        });
    }

    const captureScreen = (coordinates) => {
        mainWindow = getCurrentWindow();
        // mainWindow.hide();
        allWindows.map(item => {
            item.hide();
        })
        setTimeout(() => {
            getScreenShot((base64data) => {
                // add to buffer base64 image instead of saving locally in order to manipulate with Jimp
                let encondedImageBuffer = new Buffer.from(base64data.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
                Jimp.read(encondedImageBuffer, (err, image) => {
                    if (err) throw err;
                    let crop = coordinates ?
                                image.crop(coordinates.x, coordinates.y, parseInt(coordinates.width, 10), parseInt(coordinates.height, 10)) :
                                image.crop(0,0, screenSize.width, screenSize.height);
                    crop.getBase64('image/png', (err,base64data) =>{
                        clipboard.writeImage(
                            nativeImage.createFromDataURL(base64data)
                        );
                        // var file = dataURLtoFile(base64data);
                        BrowserWindow.getAllWindows().map(item => {
                            item.webContents.send('imageData', base64data);
                        })
                            setImage(base64data),
                            setSave_controls(true),
                            resizeWindowFor('snip');
                            
                            allWindows.map(item => {
                                item.show();
                            })
                            // openPopup(
                            //     {
                            //         type: 'Alert',
                            //         message: '클립보드에 복사되었습니다. Ctrl + V 를 눌러 붙여넣기 해 주십시오.', //covi.getDic('Msg_GroupInviteError')
                            //         callback: () => { mainWindow.close(); },
                            //     },
                            //     dispatch,
                            //     );
                            mainWindow.close();
                    });
                });
            });
        }, 200);
    }

    const snip = (state) => {
        getMainInstance().map(item => {
            item.webContents.send('snip', state);
        })
            destroyCurrentWindow(null);
    }

    const destroySnipView = () => {
        getMainInstance().map(item => {
            item.webContents.send('cancelled');
        })
        destroyCurrentWindow(null);
    }

    // const dataURLtoFile = (dataurl, fileName) => {
 
    //     var arr = dataurl.split(','),
    //         mime = arr[0].match(/:(.*?);/)[1],
    //         bstr = atob(arr[1]), 
    //         n = bstr.length, 
    //         u8arr = new Uint8Array(n);
            
    //     while(n--){
    //         u8arr[n] = bstr.charCodeAt(n);
    //     }
        
    //     return new File([u8arr], fileName, {type:mime});
    // }

    const resizeWindowFor = (view) => {
        if(view === 'snip'){
            mainWindow.setSize(400, 500);
            let x = (screenSize.width/2) - 400;
            let y= (screenSize.height/2) - 250;
            mainWindow.setPosition(x,y);
        } else if(view === 'main') {
            const width = 400;
            const height = 200;
            mainWindow.setSize(width, height);
            let x = (screenSize.width/2) - width / 2;
            let y= (screenSize.height/2) - height / 2;
            mainWindow.setPosition(x,y);
        }
    }

    const discardSnip = () => {
            setImage(''),
            setSave_controls(false),
        resizeWindowFor('main');
    }

    const saveToDisk = () => {
        const directory = remote.app.getPath('pictures');
        const filepath = path.join(directory + '/' + uuidv4() + '.png');
        if (!fs.existsSync(directory)){
            fs.mkdirSync(directory);
        }
        fs.writeFile(filepath, image.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64', (err) => {
            if(err) console.log(err);
            shell.showItemInFolder(filepath);
            discardSnip(null);
        });
    }

    // const uploadAndGetURL = (image) => {
    //     post('C:/Users/yssong1019/Pictures', {
    //         image : image
    //     })
    //     .then((response) => {
    //         const res = response.data;
    //         if(res.uploaded){
    //             shell.openExternal('C:/Users/yssong1019/Pictures/' + res.filename);
    //             discardSnip(null);
    //         }
    //     })
    //     .catch((error) => {
    //         console.log(error);
    //     });
    // }
    const controlWindow = () => {
        let aaa = BrowserWindow.getAllWindows();
        console.log('aaa',aaa);
        console.log('aaa', aaa[1]);

        console.log('getCurrentWindow()',getCurrentWindow());
        console.log('remote',remote.getCurrentWindow());
        // aaa[1].close();
        // aaa[2].close();
    }


    return (
                <Fragment>
            {view === 'snip' ? (
                <Fragment>
                    <Cropper
                        snip={snip}
                        destroySnipView={destroySnipView}
                    />
                </Fragment>
            ) :
                <div className="snip-controls text-center"
                     style={{marginTop: '50px'}}
                        >
                    {/* <span
                        className="close"
                        title="close"
                        onClick={destroyCurrentWindow}>&times;
                    </span> */}
                    <div>
                        <h2 style={{textAlign: 'center',
                                    marginTop:'15px'
                                }}>
                            {covi.getDic('Snipper')}
                        </h2>
                    </div>

                    {!save_controls ?
                        <div style={{textAlign: 'center'}}>
                            <button style={{width: '130px',
                                            marginRight: '5px',
                                            marginTop: '10px',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: 'solid 2px #12CFEE',
                                            backgroundColor: '#12CFEE',
                                            color: 'white'
                                        }}
                                className="btn btn-primary mr-1"
                                onClick={ () => captureScreen() }>
                                {covi.getDic('Fullscreen')}
                            </button>

                            <button style={{width: '130px',
                                            marginRight: '5px',
                                            marginTop: '10px',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: 'solid 2px #12CFEE',
                                            backgroundColor: '#12CFEE',
                                            color: 'white'
                                        }}
                                className="btn btn-primary mr-1"
                                onClick={ () => initCropper() }>
                                {covi.getDic('CropImage')}
                            </button>
                        </div> :
                        <div style={{textAlign: 'center'}}>
                            <button style={{width: '130px',
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

                            <button style={{width: '130px',
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
                            <img  className="preview" src={image}
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
