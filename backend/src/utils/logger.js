import { createLogger, transports, format } from "winston";
import fs from "fs";
import path from "path";
import process from "process";

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
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
      filename: path.join(logDir, "combined.log") 
    })
  ]
});
