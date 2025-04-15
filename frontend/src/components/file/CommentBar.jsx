import { useRef, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useInfiniteComments } from "../../hooks/comments";
import CommentThread from "./CommentThread";

/**
 * Sidebar component that shows all comments for a file
 */
const CommentBar = ({ fileId }) => {
  // Reference to the scroll container for intersection observer
  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    isError,
    error
  } = useInfiniteComments({ fileId, limit: 10 });
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    // Skip if we're still loading or there's nothing more to load
    if (isLoading || !hasNextPage || isFetchingNextPage || !loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // If the load more element is visible, fetch the next page
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      }, 
      { root: containerRef.current, threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isLoading, isFetchingNextPage]);
  
  // Process comments from all loaded pages
  const processComments = () => {
    if (!data?.pages) return { topLevelComments: [], repliesMap: {} };
    
    // Merge all comments from all pages
    const allComments = data.pages.flatMap(page => page.comments);
    
    // Organize comments into parent comments and their replies
    const topLevelComments = allComments.filter(comment => 
      comment.x !== undefined && comment.y !== undefined
    );
    
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
      <Box 
        sx={{ p: 2 }}
        data-testid="comments-error"
      >
        <Typography color="error">
          Error loading comments: {error?.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      ref={containerRef}
      data-testid="comment-bar"
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
        <Box 
          sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
          data-testid="comments-loading"
        >
          <CircularProgress size={24} />
        </Box>
      ) : topLevelComments.length === 0 ? (
        <Typography 
          variant="body2" 
          color="text.secondary"
          data-testid="no-comments"
        >
          No comments yet. Click on the image to add a comment.
        </Typography>
      ) : (
        <>
          {/* Comment threads */}
          <Box data-testid="comments-list">
            {topLevelComments.map(comment => (
              <CommentThread 
                key={comment._id} 
                comment={comment} 
                replies={repliesMap[comment._id] || []} 
              />
            ))}
          </Box>
          
          {/* Load more indicator */}
          {hasNextPage && (
            <Box 
              ref={loadMoreRef} 
              sx={{ 
                textAlign: 'center', 
                py: 2 
              }}
              data-testid="load-more-comments"
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

export default CommentBar;