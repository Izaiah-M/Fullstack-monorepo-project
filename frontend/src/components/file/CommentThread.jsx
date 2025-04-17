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
  TextField
} from "@mui/material";
import { useCreateComment } from "../../hooks/comments";
import { useCommentHighlight } from "../../context/commentContext";
import CommentContent from "./CommentContent";

/**
 * Represents a comment thread with parent comment and its replies
 */
const CommentThread = ({ comment, replies = [] }) => {
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const createComment = useCreateComment({ fileId: comment.fileId });
  const { highlightedCommentId } = useCommentHighlight();
  
  const commentRef = useRef(null);
  
  // Determine if this comment or any of its replies should be highlighted
  const isHighlighted = highlightedCommentId === comment._id;
  const highlightedReply = replies.find(reply => highlightedCommentId === reply._id);
  const hasHighlightedReply = !!highlightedReply;

  // Scroll into view when highlighted
  useEffect(() => {
    if (isHighlighted && commentRef.current) {
      commentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
    } else if (hasHighlightedReply && commentRef.current) {
      commentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [isHighlighted, hasHighlightedReply]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedReply = replyText.trim();
    
    if (!trimmedReply) return;
    
    createComment.mutate(
      {
        fileId: comment.fileId,
        body: trimmedReply,
        parentId: comment._id,
      },
      { 
        onSuccess: () => {
          setReplyText(""); 
          setOpen(false);
        },
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
        bgcolor: isHighlighted ? 'rgba(255, 236, 179, 0.5)' : 'background.paper',
        boxShadow: isHighlighted ? '0 0 8px rgba(251, 192, 45, 0.8)' : 'none',
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
              isHighlighted={reply._id === highlightedCommentId}
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
        onClose={() => {
          setReplyText("");
          setOpen(false);
        }}
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
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              error={createComment.isError || (replyText !== "" && replyText.trim() === "")}
              helperText={
                createComment.isError 
                  ? createComment.error?.message || 'Failed to create reply' 
                  : replyText !== "" && replyText.trim() === "" 
                  ? "Comment cannot be empty" 
                  : ""
              }
              data-testid="reply-input"
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setReplyText("");
                setOpen(false);
              }}
              data-testid="cancel-reply"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={createComment.isLoading || !replyText.trim()}
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