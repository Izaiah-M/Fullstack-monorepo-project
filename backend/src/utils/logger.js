import { createLogger, transports, format } from "winston";
import 'winston-daily-rotate-file';
import fs from "fs";
import path from "path";
import process from "process";

const cwd = process.cwd();
const logDir = path.join(cwd, "logs");

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  } else {
    console.log("Log directory already exists");
  }
} catch (error) {
  console.error(`Error creating log directory: ${error.message}`);
}

const errorRotateTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '7d', // Keep logs for 7 days
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  )
});

const combinedRotateTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '7d', // Keep logs for 7 days
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  )
});

export const logger = createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    errorRotateTransport,
    combinedRotateTransport
  ]
});

// Event listeners for rotate events
errorRotateTransport.on('rotate', function(oldFilename, newFilename) {
  logger.info(`Error log rotated from ${oldFilename} to ${newFilename}`);
});

combinedRotateTransport.on('rotate', function(oldFilename, newFilename) {
  logger.info(`Combined log rotated from ${oldFilename} to ${newFilename}`);
});

// NOTE: Logs are now saved on the host machine with automatic rotation at midnight
// and archived logs are kept for 7 days but can be changed to log in docker container