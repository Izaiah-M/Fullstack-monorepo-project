import { Box, Typography, CircularProgress } from "@mui/material";
import { useUser } from "../../hooks/users";
import UserAvatar from "../common/UserAvatar";

const CommentContent = ({ comment, isReply = false }) => {
  const { isLoading, isError, data: author, error } = useUser(comment.authorId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography 
        variant="body2" 
        color="error"
        data-testid="comment-author-error"
      >
        Error loading author: {error?.message || 'Unknown error'}
      </Typography>
    );
  }

  return (
    <Box 
      data-testid={`comment-content-${comment._id}`}
      sx={{ 
        py: 1,
        borderLeft: isReply ? "3px solid #e0e0e0" : "none", 
        pl: isReply ? 2 : 0,
        mt: isReply ? 1 : 0,
        mb: isReply ? 1 : 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <UserAvatar 
          userId={author._id} 
          sx={{ width: 32, height: 32, mr: 1 }} 
          data-testid={`comment-avatar-${author._id}`}
        />
        <Box>
          <Typography 
            variant="subtitle2" 
            component="span"
            data-testid={`comment-author-${comment._id}`}
          >
            {author.email}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ ml: 1 }}
            data-testid={`comment-date-${comment._id}`}
          >
            {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>
      <Typography 
        variant="body2"
        data-testid={`comment-body-${comment._id}`}
      >
        {comment.body}
      </Typography>
    </Box>
  );
};

export default CommentContent;