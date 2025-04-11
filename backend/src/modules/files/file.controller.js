import {
    uploadFile,
    getFiles,
    getFileById,
    getFileContent,
  } from "./file.service.js";
  
  export function FileController({ db, session }) {
    return {
      upload: async (req, res) => {
        const file = await uploadFile({ db, session, req });
        res.status(201).json(file);
      },
  
      list: async (req, res) => {
        const files = await getFiles({ db, session, req });
        res.json(files);
      },
  
      getById: async (req, res) => {
        const file = await getFileById({ db, session, req });
        res.json(file);
      },
  
      getContent: async (req, res) => {
        const filePath = await getFileContent({ db, session, req });
        res.sendFile(filePath);
      },
    };
  }
  