import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ErrorAlert from "../components/common/ErrorAlert";
import CommentBar from "../components/file/CommentBar";
import ImageViewer from "../components/file/ImageViewer";
import TopBar from "../components/common/TopBar";
import { CommentHighlightProvider } from "../context/commentContext";
import { useSelectedFile } from "../hooks/files";
import { useLiveComments } from "../hooks/useLiveComments";
import Loading from "../pages/Loading";

const File = () => {
  const { data: file, isLoading, isError, error } = useSelectedFile();
  const theme = useTheme();
  
  // Setup live comments subscription if file is loaded
  useLiveComments(file?._id);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <ErrorAlert 
        data-testid="file-error"
        message="Failed to load file" 
        error={error} 
        actionText="Return to projects"
        actionLink="/projects"
      />
    );
  }

  return (
    <CommentHighlightProvider>
      <Box
        data-testid="file-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <TopBar 
          title={file.name} 
          back={`/projects/${file.projectId}`} 
        />
        <Box
          sx={{
            height: "100%",
            display: "flex",
            backgroundColor: theme.palette.grey[200],
          }}
        >
          <ImageViewer file={file} />
          <CommentBar fileId={file._id} />
        </Box>
      </Box>
    </CommentHighlightProvider>
  );
};

export default File;