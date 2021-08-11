import { app } from 'electron';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import logger from './logger';

export const connectRemoteViewer = sessionKey => {
  logger.info(
    `./remote/KoinoViewer.exe -un ${sessionKey} -i 128.1.1.36 -p 7002 -p2 7003 -fr 1572863 -t 30`,
  );
  var spawn = require('child_process').spawn,
    ls = spawn(
      `cd remote && KoinoViewer.exe -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`,
      [],
      { shell: true },
    );
  ls.stdout.once('data', function (data) {
    logger.info('KoinoViewer.exe returned data: ' + data);
  });

  ls.stderr.once('data', function (data) {
    logger.info('KoinoViewer.exe occured error: ' + data);
  });

  ls.once('exit', function (code) {
    logger.info('KoinoViewer.exe has terminated with code: ' + code);
  });
};

export const connectRemoteHost = sessionKey => {
  logger.info(
    `./remote/KoinoHostLauncher.exe -un ${sessionKey} -i 128.1.1.36 -p 7002 -p2 7003 -fr 1572863 -t 30`,
  );
  var path = require('path');
  var p = path.join('./remote', 'KoinoHostLauncher.exe');
  var spawn = require('child_process').spawn,
    ls = spawn(p, [
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
  // var spawn = require('child_process').spawn, ls = spawn(`cd remote && KoinoHostLauncher.exe -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`, [], { shell: true })
  ls.stdout.once('data', function (data) {
    logger.info('KoinoHostLaunch.exe returned data: ' + data);
  });

  ls.stderr.once('data', function (data) {
    logger.info('KoinoHostLaunch.exe occured error: ' + data);
  });

  ls.once('exit', function (code) {
    logger.info('KoinoHostLaunch.exe has terminated with code: ' + code);
  });
};

export const getPath = () => {
  var spawn = require('child_process').spawn,
    ls = spawn(`cd`, [], { shell: true });
  ls.stdout.once('data', function (data) {
    logger.info('Get remote path: ', data);
  });

  ls.stderr.once('data', function (data) {
    console.log('Get remote path stderr: ' + data);
  });

  ls.once('exit', function (code) {
    console.log('Get remote path exit: ' + code);
  });
};

export const createRemoteVNCHost = () => {
  const appPath = dirname(app.getAppPath());
  const filePath = resolve(appPath, 'vncremote', 'winvnc.exe');

  const vncHostProcess = spawn(`${filePath}`, [], { shell: true });

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
    if (code == 0) {
      if (alert) alert();
    }
  });
};

export const createRemoteVNC = (hostAddr, alert) => {
  const appPath = dirname(app.getAppPath());
  const filePath = resolve(appPath, 'vncremote', 'vncviewer.exe');

  const vncProcess = spawn(
    `${filePath} /ip ${hostAddr} /password Covi@2020 /notoolbar /disablesponsor /nostatus /autoreconnect 0`,
    [],
    { shell: true },
  );

  vncProcess.stderr.on('data', data => {
    console.log('vncviewer.exe call stderr =>');
    console.log(data);

    const msg = new TextDecoder('euc-kr').decode(data);

    console.log(msg);
  });

  vncProcess.stdout.on('data', data => {
    console.log('vncviewer.exe call stdout =>');
    console.log(data);
    const msg = new TextDecoder('euc-kr').decode(data);

    console.log(msg);
  });

  vncProcess.on('error', err => {
    console.log(`vncviewer.exe error => `, err);
  });

  vncProcess.once('exit', code => {
    console.log('vncviewer.exe has terminated with code: ' + code);
    if (code == 0) {
      if (alert) alert();
    }
  });
};
