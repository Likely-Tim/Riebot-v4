import * as winston from 'winston';
import 'winston-daily-rotate-file';

const generalTransport = new winston.transports.DailyRotateFile({
  filename: '%DATE%.log',
  datePattern: 'MM-DD-YYYY',
  maxFiles: '14',
  dirname: './logs/runtime',
});

const generalLogConfiguration = {
  transports: [new winston.transports.Console(), generalTransport],
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({
      format: 'MM-DD-YYYY HH:mm:ss',
    }),
    winston.format.printf((info) => `${[info.timestamp]}: ${info.level}: ${info.message}`)
  ),
};

const logger = winston.createLogger(generalLogConfiguration);

export default logger;
