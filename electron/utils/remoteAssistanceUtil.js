import { app } from 'electron';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import logger from './logger';

export const connectRemoteViewer = (sessionKey) => {
  const appPath = dirname(app.getAppPath());
  const remotePath = resolve(appPath, 'remote', 'KoinoViewer.exe');

  logger.info(`Spawn ${remotePath} -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`);
  const remoteProcess = spawn(`${remotePath} -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`, [], { shell: true });

  remoteProcess.once('error', (err) => {
    logger.info('Failed to spawn KoinoViewer : ', err);
  })

  remoteProcess.once('exit', function (code) {
    logger.info('KoinoViewer.exe has terminated with code: ' + code);
  });

  remoteProcess.stdout.once('data', function (data) {
    logger.info('KoinoViewer.exe returned data: ' + data);
  });

  remoteProcess.stderr.once('data', function (data) {
    logger.info('KoinoViewer.exe occured error: ' + data);
  });
}

export const connectRemoteHost = (sessionKey) => {
  const appPath = dirname(app.getAppPath());
  const remotePath = resolve(appPath, 'remote', 'KoinoHostLauncher.exe');

  logger.info(`Spawn ${remotePath} -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`);
  const remoteProcess = spawn(remotePath, [
    '-un', sessionKey,
    '-i', '128.1.1.36',
    '-p', '7002',
    '-p2', '7003',
    '-fr', '1572863',
    '-t', '30'
  ]);

  remoteProcess.once('error', (err) => {
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
}