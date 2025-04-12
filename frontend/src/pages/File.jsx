import { useState, useRef, useEffect } from "react";
import TopBar from "../components/TopBar";
import {
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Card,
  Typography,
  CardActions,
} from "@mui/material";
import { useSelectedFile } from "../hooks/files";
import { useTheme } from "@mui/material/styles";
import { useComments, useCreateComment } from "../hooks/comments";
import { useSearchParams } from "react-router-dom";
import { useUser } from "../hooks/users";
import UserAvatar from "../components/UserAvatar";
import Loading from "../pages/Loading";

// Renamed from CommentCard to CommentThread, more accurate depiction of what is trying to be achieved.
const CommentThread = ({ comment, replies = [] }) => {
  const [open, setOpen] = useState(false);
  const createComment = useCreateComment({ fileId: comment.fileId });

  const handleSubmit = (e) => {
    e.preventDefault();
    createComment.mutate(
      {
        fileId: comment.fileId,
        body: e.target.elements.body.value,
        parentId: comment._id,
      },
      { 
        onSuccess: () => setOpen(false) 
      },
    );
  };

  return (
    <Card variant="outlined" sx={{ mb: 2, p: 2, }}>
      {/* Original comment */}
      <CommentContent comment={comment} />
            
      {/* Replies section */}
      {replies.length > 0 && (
        <Box sx={{ pl: 2, pr: 2, pb: replies.length ? 1 : 0 }}>
          {replies.map((reply) => (
            <CommentContent 
              key={reply._id} 
              comment={reply} 
              isReply={true} 
            />
          ))}
        </Box>
      )}
      
      {/* Reply button for the whole thread */}
      <CardActions>
        <Button size="small" onClick={() => setOpen(true)}>Reply</Button>
      </CardActions>
      
      {/* Reply dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>Add a Reply</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Comment"
              name="body"
              fullWidth
              multiline
              rows={3}
              required
            />
            {createComment.isError && (
              <Typography color="error">
                {createComment.error.message}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Submit
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Card>
  );
};

// Individual comment content component
const CommentContent = ({ comment, isReply = false }) => {
  const { isLoading, data: author } = useUser(comment.authorId);

  if (isLoading) {
    return null;
  }

  return (
    <Box sx={{ 
      py: 1,
      borderLeft: isReply ? "3px solid #e0e0e0" : "none", 
      pl: isReply ? 2 : 0,
      mt: isReply ? 1 : 0,
      mb: isReply ? 1 : 0,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <UserAvatar userId={author._id} sx={{ width: 32, height: 32, mr: 1 }} />
        <Box>
          <Typography variant="subtitle2" component="span">
            {author.email}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ ml: isReply ? 0 : 0 }}>
        {comment.body}
      </Typography>
    </Box>
  );
};
const CommentBar = ({ fileId }) => {
  const { data: comments = [] } = useComments({ fileId });
  
  // Organize comments into parent comments and their replies
  const organizeComments = (comments) => {
    // Start with top-level comments (no parentId)
    const topLevelComments = comments.filter(comment => !comment.parentId);
    
    // Group all replies by their parent comment ID
    const repliesMap = {};
    
    comments.forEach(comment => {
      if (comment.parentId) {
        if (!repliesMap[comment.parentId]) {
          repliesMap[comment.parentId] = [];
        }
        repliesMap[comment.parentId].push(comment);
      }
    });
    
    // Sort replies by creation date for each parent
    Object.keys(repliesMap).forEach(parentId => {
      repliesMap[parentId].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    });
    
    return { topLevelComments, repliesMap };
  };
  
  const { topLevelComments, repliesMap } = organizeComments(comments);

  return (
    <Box
      sx={{
        width: 400,
        height: "100%",
        overflowY: "auto",
        p: 2,
        bgcolor: "background.paper",
        borderLeft: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comments
      </Typography>
      
      {topLevelComments.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No comments yet. Click on the image to add a comment.
        </Typography>
      )}
      
      {topLevelComments.map(comment => (
        <CommentThread 
          key={comment._id} 
          comment={comment} 
          replies={repliesMap[comment._id] || []} 
        />
      ))}
    </Box>
  );
};


const ImageViewer = ({ file }) => {
  const theme = useTheme();
  const { data: comments } = useComments({ fileId: file._id });
  const createComment = useCreateComment({ fileId: file._id });
  const imageRef = useRef(null);
  const markerContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState({ x: 0, y: 0 });
  const [, setSearchParams] = useSearchParams();

  const selectComment = (commentId) => {
    setSearchParams({ commentId }, { replace: true });
  };

  const handleImageClick = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    setClickCoords({ x: xPercent, y: yPercent });
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createComment.mutate(
      {
        fileId: file._id,
        body: e.target.elements.body.value,
        x: clickCoords.x,
        y: clickCoords.y,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  useEffect(function matchMarkerLayerSizeToImage() {
    const resizeObserver = new ResizeObserver(() => {
      markerContainerRef.current.style.width = `${imageRef.current.width}px`;
      markerContainerRef.current.style.height = `${imageRef.current.height}px`;
    });
    resizeObserver.observe(imageRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Tooltip title="Click to leave a comment" arrow>
        <img
          ref={imageRef}
          src={`${import.meta.env.VITE_BACKEND_ORIGIN}/files/${file._id}/content`}
          alt={file.name}
          onClick={handleImageClick}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            cursor: "pointer",
          }}
        />
      </Tooltip>
      <Box
        id="markers-container"
        ref={markerContainerRef}
        sx={{
          position: "absolute",
          mx: "auto",
          width: imageRef.current?.width ?? "100%",
          height: imageRef.current?.height ?? "100%",
          pointerEvents: "none",
        }}
      >
        {comments.map((comment) => (
          <Box
            key={comment._id}
            sx={{
              position: "absolute",
              left: `${comment.x}%`,
              top: `${comment.y}%`,
              transform: "translate(-50%, -50%)",
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.light,
              border: "2px solid white",
              cursor: "pointer",
              pointerEvents: "auto",
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
              },
            }}
            onClick={() => selectComment(comment._id)}
          />
        ))}
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>Add a Comment</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Comment"
              name="body"
              fullWidth
              multiline
              rows={3}
              required
            />
            {createComment.isError && (
              <Typography color="error">
                {createComment.error.message}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button color="main" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Submit
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

const File = () => {
  const { data: file, isLoading, isError } = useSelectedFile();
  const theme = useTheme();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Typography variant="h4">File not found</Typography>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <TopBar title={file.name} back={`/projects/${file.projectId}`} />
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
  );
};

export default File;
