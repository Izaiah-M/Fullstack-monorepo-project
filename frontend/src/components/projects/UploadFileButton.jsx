import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography
} from "@mui/material";
import ErrorAlert from "../common/ErrorAlert";
import { useUploadFile } from "../../hooks/files";

/**
 * Button and dialog for uploading files to a project
 */
const UploadFileButton = ({ projectId }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const uploadFile = useUploadFile();

  const handleClose = () => {
    if (!uploadFile.isLoading) {
      setOpen(false);
      setFile(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!file) return;
    
    uploadFile.mutate(
      { projectId, file },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  return (
    <Box data-testid="upload-file-container">
      <Button 
        onClick={() => setOpen(true)}
        variant="outlined"
        data-testid="upload-file-button"
      >
        Upload File
      </Button>

      <Dialog 
        open={open} 
        onClose={handleClose}
        data-testid="upload-file-dialog"
      >
        <DialogTitle>Upload Image File</DialogTitle>
        <Box sx={{ minWidth: 300 }} component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Button
              fullWidth
              variant={!file ? "contained" : "text"}
              component="label"
              data-testid="select-file-button"
            >
              Select File
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                required
                data-testid="file-input"
              />
            </Button>
            
            {file && (
              <Typography 
                variant="body2"
                sx={{ mt: 2 }}
                data-testid="selected-filename"
              >
                Selected file: {file.name}
              </Typography>
            )}

            {uploadFile.isLoading && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 2 
                }}
                data-testid="upload-loading"
              >
                <CircularProgress size={24} />
              </Box>
            )}

            {uploadFile.isError && (
              <Box sx={{ mt: 2 }} data-testid="upload-error">
                <ErrorAlert 
                  message="Failed to upload file"
                  error={uploadFile.error}
                  severity="error"
                  variant="outlined"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleClose}
              disabled={uploadFile.isLoading}
              data-testid="cancel-upload"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant={file ? "contained" : "text"}
              disabled={!file || uploadFile.isLoading}
              data-testid="submit-upload"
            >
              {uploadFile.isLoading ? "Uploading..." : "Upload"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default UploadFileButton;