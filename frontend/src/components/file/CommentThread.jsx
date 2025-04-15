import { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Card, 
  CardActions, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Typography 
} from "@mui/material";
import { useCreateComment } from "../../hooks/comments";
import { useCommentHighlight } from "../../context/commentContext";
import CommentContent from "./CommentContent";

/**
 * Represents a comment thread with parent comment and its replies
 */
const CommentThread = ({ comment, replies = [] }) => {
  const [open, setOpen] = useState(false);
  const createComment = useCreateComment({ fileId: comment.fileId });
  const { highlightedCommentId } = useCommentHighlight();
  
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
    const replyBody = e.target.elements.body.value.trim();
    
    if (!replyBody) return;
    
    createComment.mutate(
      {
        fileId: comment.fileId,
        body: replyBody,
        parentId: comment._id,
      },
      { 
        onSuccess: () => setOpen(false),
        onError: (error) => console.error("Failed to create reply:", error)
      },
    );
  };

  return (
    <Card 
      ref={commentRef}
      data-testid={`comment-thread-${comment._id}`}
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
        <Box 
          sx={{ pl: 2, pr: 2, pb: replies.length ? 1 : 0 }}
          data-testid={`replies-container-${comment._id}`}
        >
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
        <Button 
          size="small" 
          onClick={() => setOpen(true)}
          data-testid={`reply-button-${comment._id}`}
        >
          Reply
        </Button>
      </CardActions>
      
      {/* Reply dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        data-testid={`reply-dialog-${comment._id}`}
      >
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
              data-testid="reply-input"
            />
            {createComment.isError && (
              <Typography 
                color="error"
                data-testid="reply-error"
              >
                {createComment.error?.message || 'Failed to create reply'}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpen(false)}
              data-testid="cancel-reply"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={createComment.isLoading}
              data-testid="submit-reply"
            >
              {createComment.isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Card>
  );
};

export default CommentThread;