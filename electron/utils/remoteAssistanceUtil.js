import { app } from 'electron';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import logger from './logger';

export const connectRemoteViewer = sessionKey => {
  const appPath = dirname(app.getAppPath());
  const remotePath = resolve(appPath, 'remote', 'KoinoViewer.exe');

  logger.info(
    `Spawn ${remotePath} -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`,
  );
  const remoteProcess = spawn(
    `${remotePath} -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`,
    [],
    { shell: true },
  );

  remoteProcess.once('error', err => {
    logger.info('Failed to spawn KoinoViewer : ', err);
  });

  remoteProcess.once('exit', function (code) {
    logger.info('KoinoViewer.exe has terminated with code: ' + code);
  });

  remoteProcess.stdout.once('data', function (data) {
    logger.info('KoinoViewer.exe returned data: ' + data);
  });

  remoteProcess.stderr.once('data', function (data) {
    logger.info('KoinoViewer.exe occured error: ' + data);
  });
};

export const connectRemoteHost = sessionKey => {
  const appPath = dirname(app.getAppPath());
  const remotePath = resolve(appPath, 'remote', 'KoinoHostLauncher.exe');

  logger.info(
    `Spawn ${remotePath} -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`,
  );
  const remoteProcess = spawn(remotePath, [
    '-un',
    sessionKey,
    '-i',
    '128.1.1.36',
    '-p',
    '7002',
    '-p2',
    '7003',
    '-fr',
    '1572863',
    '-t',
    '30',
  ]);

  remoteProcess.once('error', err => {
    logger.info('Failed to spawn KoinoHostLauncher : ', err);
  });

  remoteProcess.once('exit', function (code) {
    logger.info('KoinoHostLaunch.exe has terminated with code: ' + code);
  });

  remoteProcess.stdout.once('data', function (data) {
    logger.info('KoinoHostLaunch.exe returned data: ' + data);
  });

  remoteProcess.stderr.once('data', function (data) {
    logger.info('KoinoHostLaunch.exe occured error: ' + data);
  });
};


function matchDigit8(str) {
  const leng = String(str).length;
  let result = String(str);
  if (leng < 8) {
      for (let i = 0; i < 7 - leng; i++) {
          result = '0' + result;
      }
  }
  return  "1" + result;
}

export const createRemoteVNCHost = vncArgs => {
  const appPath = dirname(app.getAppPath());
  const filePath = resolve(appPath, 'vncremote', 'winvnc.exe');

  let vncHostProcess = spawn(`${filePath}`, ['-sc_prompt','-sc_exit',`-id:${matchDigit8(vncArgs)}`,'-connect', 'eum.covision.co.kr:5500','-run' ], { shell: true });
  
  vncHostProcess.stderr.on('data', data => {
    console.log('winvnc.exe call stderr =>');
    console.log(data);

    const msg = new TextDecoder('euc-kr').decode(data);

    console.log(msg);
  });

  vncHostProcess.stdout.on('data', data => {
    console.log('winvnc.exe call stdout =>');
    console.log(data);
    const msg = new TextDecoder('euc-kr').decode(data);

    console.log(msg);
  });

  vncHostProcess.on('error', err => {
    console.log(`winvnc.exe error => `, err);
  });

  vncHostProcess.once('exit', code => {
    console.log('winvnc.exe has terminated with code: ' + code);
  });
};



export const createRemoteVNC = roomId => {
  const appPath = dirname(app.getAppPath());
  const filePath = resolve(appPath, 'vncremote', 'vncviewer.exe');

  const vncProcess = spawn(
    `${filePath}`,
    ['-proxy', 'eum.covision.co.kr:5901', `ID:${matchDigit8(roomId)}`],
    { shell: true },
  );

  vncProcess.stderr.on('data', data => {
    const msg = new TextDecoder('euc-kr').decode(data);
    console.log(msg);
  });

  vncProcess.stdout.on('data', data => {
    const msg = new TextDecoder('euc-kr').decode(data);
    console.log(msg);
  });

  vncProcess.on('error', err => {
    console.log(`vncviewer.exe error => `, err);
  });

  vncProcess.once('exit', code => {
    console.log('vncviewer.exe has terminated with code: ' + code);
    // if (code == 0) {
    //   if (alert) alert();
    // }
  });
};
