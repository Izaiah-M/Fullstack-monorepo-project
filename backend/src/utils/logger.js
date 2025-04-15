import { createLogger, transports, format } from "winston";
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

export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: path.join(logDir, "error.log"), 
      level: "error" 
    }),
    new transports.File({ 
      filename: path.join(logDir, "combined.log"), 
      level: "info"
    })
  ]
});

// NOTE: I Changed it from logging the files to the docker container, to logging on host machine for easier debugging