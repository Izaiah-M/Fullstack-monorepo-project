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
  CircularProgress
} from "@mui/material";
import { useSelectedFile } from "../hooks/files";
import { useTheme } from "@mui/material/styles";
import { useComments, useCreateComment, useInfiniteComments } from "../hooks/comments";
import { useSearchParams } from "react-router-dom";
import { useUser } from "../hooks/users";
import UserAvatar from "../components/UserAvatar";
import Loading from "../pages/Loading";
import { useLiveComments } from "../hooks/useLiveComments";
import { CommentHighlightProvider, useCommentHighlight } from "../hooks/commentContext";

// Renamed from CommentCard to CommentThread, more accurate depiction of what is trying to be achieved.
const CommentThread = ({ comment, replies = [] }) => {
  const [open, setOpen] = useState(false);
  const createComment = useCreateComment({ fileId: comment.fileId });
  const { highlightedCommentId } = useCommentHighlight();
  
  // Reference to this comment card
  const commentRef = useRef(null);

   // Scroll into view when highlighted
   useEffect(() => {
    if (highlightedCommentId === comment._id && commentRef.current) {
      commentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
    }
  }, [highlightedCommentId, comment._id]);

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
    <Card 
      ref={commentRef}
      variant="outlined" 
      sx={{ 
        mb: 2, 
        p: 2,
        transition: 'background-color 0.3s ease',
        bgcolor: highlightedCommentId === comment._id ? 'rgba(0, 0, 0, 0.08)' : 'background.paper',
      }}
    >
      {/* Parent comment */}
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

// Updated it to use infinite comments
const CommentBar = ({ fileId }) => {
  // Reference to the scroll container for intersection observer
  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
  // Use the infinite comments hook
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    isError
  } = useInfiniteComments({ fileId, limit: 10 });
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    // Skip if we're still loading or there's nothing more to load
    if (isLoading || !hasNextPage || isFetchingNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // If the load more element is visible, fetch the next page
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      }, 
      { root: containerRef.current, threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isLoading, isFetchingNextPage]);
  
  // Process comments from all loaded pages
// Process comments from all loaded pages
const processComments = () => {
  if (!data?.pages) return { topLevelComments: [], repliesMap: {} };
  
  // Merge all comments from all pages
  const allComments = data.pages.flatMap(page => page.comments);

  // console.log("All comments: ", allComments);
  
  // Organize comments into parent comments and their replies
  const topLevelComments = allComments.filter(comment => 
    comment.x !== undefined && comment.y !== undefined
  );
  
  // console.log("Top-level comments (using coordinates): ", topLevelComments);
  
  // Group all replies by their parent comment ID
  const repliesMap = {};
  
  allComments.forEach(comment => {
    if (comment.parentId) {
      if (!repliesMap[comment.parentId]) {
        repliesMap[comment.parentId] = [];
      }
      repliesMap[comment.parentId].push(comment);
    }
  });
  
  // console.log("Reply map: ", repliesMap);
  
  // Sort replies by creation date for each parent
  Object.keys(repliesMap).forEach(parentId => {
    repliesMap[parentId].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  });
  
  return { topLevelComments, repliesMap };
};
  
  const { topLevelComments, repliesMap } = processComments();

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error loading comments</Typography>
      </Box>
    );
  }

  // console.log("Top level comments: ", topLevelComments);
  
  return (
    <Box
      ref={containerRef}
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
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : topLevelComments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No comments yet. Click on the image to add a comment.
        </Typography>
      ) : (
        <>
          {/* Comment threads */}
          {topLevelComments.map(comment => (
            <CommentThread 
              key={comment._id} 
              comment={comment} 
              replies={repliesMap[comment._id] || []} 
            />
          ))}
          
          {/* Load more indicator */}
          {hasNextPage && (
            <Box 
              ref={loadMoreRef} 
              sx={{ 
                textAlign: 'center', 
                py: 2 
              }}
            >
              {isFetchingNextPage ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Scroll for more comments
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// Had to update it to use the new comments structure
const ImageViewer = ({ file }) => {
  const theme = useTheme();
  // Use standard comments hook with the new format
  const { data, isLoading } = useComments({ fileId: file._id, limit: 50 });
  const createComment = useCreateComment({ fileId: file._id });
  const imageRef = useRef(null);
  const markerContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState({ x: 0, y: 0 });
  const [, setSearchParams] = useSearchParams();
  const { highlightComment } = useCommentHighlight();

  const selectComment = (commentId) => {
    setSearchParams({ commentId }, { replace: true });
    highlightComment(commentId);
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

  // Filter to only include top-level comments with coordinates
  const commentMarkers = !isLoading && data?.comments
    ? data.comments.filter(comment => comment.x !== undefined && comment.y !== undefined)
    : [];

    // console.log("commentMarker: ", commentMarkers)
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
        {commentMarkers.map((comment) => (
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
  useLiveComments(file?._id);
  const theme = useTheme();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Typography variant="h4">File not found</Typography>;
  }

  return (
    <CommentHighlightProvider>
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
    </CommentHighlightProvider>
  );
};

export default File;
