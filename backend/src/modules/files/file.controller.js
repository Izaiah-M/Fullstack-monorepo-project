import {
  uploadFile,
  getFiles,
  getFileById,
  getFileContent,
} from "./file.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * File controller factory function
 * 
 * @param {Object} params - Controller dependencies
 * @param {Object} params.session - Session service
 * @returns {Object} Controller methods
 */
export function FileController({ session }) {
  return {
    upload: asyncHandler(async (req, res) => {
      const file = await uploadFile({ session, req });
      res.status(201).json(file);
    }),

    list: asyncHandler(async (req, res) => {
      const files = await getFiles({ session, req });
      res.json(files);
    }),

    getById: asyncHandler(async (req, res) => {
      const file = await getFileById({ session, req });
      res.json(file);
    }),

    getContent: asyncHandler(async (req, res) => {
      const filePath = await getFileContent({ session, req });
      res.sendFile(filePath);
    }),
  };
}