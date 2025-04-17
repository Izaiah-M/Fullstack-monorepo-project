import { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "react-router-dom";
import { useComments, useCreateComment } from "../../hooks/comments";
import { useCommentHighlight } from "../../context/commentContext";

const ImageViewer = ({ file }) => {
  const theme = useTheme();
  const { data, isLoading, isError, error } = useComments({ fileId: file._id, limit: 50 });
  const createComment = useCreateComment({ fileId: file._id });
  const imageRef = useRef(null);
  const markerContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState("");
  const [, setSearchParams] = useSearchParams();
  const { highlightComment } = useCommentHighlight();

  const selectComment = (commentId) => {
    setSearchParams({ commentId }, { replace: true });
    highlightComment(commentId);
  };

  const handleImageClick = (e) => {
    if (!imageRef.current) return;
    
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
    const trimmedComment = commentText.trim();
    
    if (!trimmedComment) return;
    
    createComment.mutate(
      {
        fileId: file._id,
        body: trimmedComment,
        x: clickCoords.x,
        y: clickCoords.y,
      },
      { 
        onSuccess: () => {
          setCommentText("");
          setOpen(false);
        },
        onError: (error) => console.error("Failed to create comment:", error) 
      },
    );
  };
  
  const handleClose = () => {
    setCommentText("");
    setOpen(false);
  };

  // Match marker layer size to image
  useEffect(() => {
    if (!imageRef.current || !markerContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      markerContainerRef.current.style.width = `${imageRef.current.width}px`;
      markerContainerRef.current.style.height = `${imageRef.current.height}px`;
    });
    
    resizeObserver.observe(imageRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Filter to only include top-level comments with coordinates
  const commentMarkers = (!isLoading && !isError && data?.comments)
    ? data.comments.filter(comment => comment.x !== undefined && comment.y !== undefined)
    : [];

  if (isError) {
    return (
      <Box 
        data-testid="image-viewer-error" 
        sx={{ p: 3, textAlign: 'center' }}
      >
        <Typography color="error">
          Error loading comments: {error?.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      data-testid="image-viewer"
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
          data-testid="file-image"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            cursor: "pointer",
          }}
        />
      </Tooltip>
      
      {/* Comment markers overlay */}
      <Box
        data-testid="markers-container"
        ref={markerContainerRef}
        sx={{
          position: "absolute",
          mx: "auto",
          width: imageRef.current?.width ?? "100%",
          height: imageRef.current?.height ?? "100%",
          pointerEvents: "none",
        }}
      >
        {commentMarkers.map((comment) => (
          <Box
            key={comment._id}
            data-testid={`comment-marker-${comment._id}`}
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
      
      {/* Add comment dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        data-testid="add-comment-dialog"
      >
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
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              error={createComment.isError || (commentText !== "" && commentText.trim() === "")}
              helperText={
                createComment.isError 
                  ? createComment.error?.message || 'Failed to create comment' 
                  : commentText !== "" && commentText.trim() === "" 
                  ? "Comment cannot be empty" 
                  : ""
              }
              data-testid="comment-input"
            />
          </DialogContent>
          <DialogActions>
            <Button 
              data-testid="cancel-comment"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              data-testid="submit-comment"
              disabled={createComment.isLoading || !commentText.trim()}
            >
              {createComment.isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ImageViewer;