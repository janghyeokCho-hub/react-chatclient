import logger from './logger';

export const connectRemoteViewer = (sessionKey) => {
    logger.info(`./remote/KoinoViewer.exe -un ${sessionKey} -i 128.1.1.36 -p 7002 -p2 7003 -fr 1572863 -t 30`);
    var spawn = require('child_process').spawn, ls = spawn(`cd remote && KoinoViewer.exe -un ${sessionKey} -i 128.1.1.36 -p 7002 –p2 7003 -fr 1572863 -t 3000`, [], { shell: true })
    ls.stdout.once('data', function (data) {
        logger.info('KoinoViewer.exe returned data: ' + data);
    });

    ls.stderr.once('data', function (data) {
        logger.info('KoinoViewer.exe occured error: ' + data);
    });

    ls.once('exit', function (code) {
        logger.info('KoinoViewer.exe has terminated with code: ' + code);
    });
}

export const connectRemoteHost = (sessionKey) => {
    logger.info(`./remote/KoinoHostLauncher.exe -un ${sessionKey} -i 128.1.1.36 -p 7002 -p2 7003 -fr 1572863 -t 30`);
    var path = require('path');
    var p = path.join('./remote','KoinoHostLauncher.exe');
    var spawn = require('child_process').spawn, ls = spawn(p,[
        '-un', sessionKey,
        '-i', '128.1.1.36',
        '-p', '7002',
        '-p2', '7003',
        '-fr', '1572863',
        '-t', '30'
    ])
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
}

export const getPath = () => {
    var spawn = require('child_process').spawn, ls = spawn(`cd`, [], { shell: true })
    ls.stdout.once('data', function (data) {
        logger.info('Get remote path: ', data);
    });

    ls.stderr.once('data', function (data) {
        console.log('Get remote path stderr: ' + data);
    });

    ls.once('exit', function (code) {
        console.log('Get remote path exit: ' + code);
    });
}

