const { transports, format, createLogger } = require('winston');
const appRoot = require('app-root-path');
require('winston-daily-rotate-file');

const transport = new transports.DailyRotateFile({
  filename: `${appRoot}/log/%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info'
});

const transportError = new transports.DailyRotateFile({
  filename: `${appRoot}/log/%DATE%_error.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error'
});

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.splat(),
    format.timestamp(),
    format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    transport,
    transportError,
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
      )
    })
  ]
});

module.exports = logger;
