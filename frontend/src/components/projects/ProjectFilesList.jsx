import { useNavigate } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress
} from "@mui/material";
import ErrorAlert from "../common/ErrorAlert";
import { useFiles } from "../../hooks/files";
import CopyFileLinkButton from "./CopyFileLinkButton";

/**
 * Component that displays a list of files for a project
 */
const ProjectFilesList = ({ projectId }) => {
  const navigate = useNavigate();
  const { data: files, isLoading, isError, error } = useFiles(projectId);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          py: 4 
        }}
        data-testid="files-loading"
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 2 }} data-testid="files-error">
        <ErrorAlert 
          message="Error loading files"
          error={error}
          actionText="Retry"
          actionHandler={() => window.location.reload()}
        />
      </Box>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Typography 
        variant="h6" 
        sx={{ py: 4 }}
        color="text.secondary"
        data-testid="no-files"
      >
        No files yet
      </Typography>
    );
  }

  return (
    <List 
      sx={{ width: "100%", maxWidth: "600px" }}
      data-testid="files-list"
    >
      {files.map((file) => (
        <ListItem
          key={file._id}
          secondaryAction={
            <CopyFileLinkButton 
              fileId={file._id} 
              data-testid={`copy-link-${file._id}`}
            />
          }
          data-testid={`file-item-${file._id}`}
        >
          <ListItemButton 
            onClick={() => navigate(`/files/${file._id}`)}
            data-testid={`file-link-${file._id}`}
          >
            <ListItemAvatar>
              <Avatar
                variant="square"
                alt={file.name}
                src={`${import.meta.env.VITE_BACKEND_ORIGIN}/files/${file._id}/content`}
                sx={{ width: 56, height: 56, mr: 2 }}
                imgProps={{ 
                  loading: "lazy", 
                  "data-testid": `file-thumbnail-${file._id}` 
                }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={file.name}
              sx={{ maxWidth: "30em" }}
              slotProps={{
                primary: {
                  sx: {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  "data-testid": `file-name-${file._id}`
                },
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default ProjectFilesList;