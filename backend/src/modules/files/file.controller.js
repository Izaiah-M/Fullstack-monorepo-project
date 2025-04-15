import {
  uploadFile,
  getFiles,
  getFileById,
  getFileContent,
} from "./file.service.js";

export function FileController({ session }) {
  return {
    upload: async (req, res) => {
      const file = await uploadFile({ session, req });
      res.status(201).json(file);
    },

    list: async (req, res) => {
      const files = await getFiles({ session, req });
      res.json(files);
    },

    getById: async (req, res) => {
      const file = await getFileById({ session, req });
      res.json(file);
    },

    getContent: async (req, res) => {
      const filePath = await getFileContent({ session, req });
      res.sendFile(filePath);
    },
  };
}