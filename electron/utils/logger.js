import { app } from 'electron';
import winston, { format } from 'winston';
require('winston-daily-rotate-file');
import path from 'path';
import exportProps from '../config/exportProps';

const { combine, timestamp, printf } = winston.format;

const logPath = path.join(app.getPath('userData'), 'logs');

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`; // log 출력 포맷 정의
});

const options = {
  // log파일
  file: {
    level: 'info',
    filename: `${logPath}/winston.log`, // 로그파일을 남길 경로
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
    format: combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      myFormat, // log 출력 포맷
    ),
  },
  // 개발 시 console에 출력
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false, // 로그형태를 json으로도 뽑을 수 있다.
    colorize: true,
    format: combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      myFormat,
    ),
  },
};

const logger = new winston.createLogger({
  transports: [
    new winston.transports.DailyRotateFile(options.file),
    // new winston.transports.File(), // 중요! 위에서 선언한 option으로 로그 파일 관리 모듈 transport
  ],
  exitOnError: false,
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console(options.console)); // 개발 시 console로도 출력
}

export default logger;
