import { useRef, useEffect, useState, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useInfiniteComments } from "../../hooks/comments";
import CommentThread from "./CommentThread";
import { useSearchParams } from "react-router-dom";
import { useCommentHighlight } from "../../context/commentContext";

/**
 * Sidebar component that shows all comments for a file
 */
const CommentBar = ({ fileId }) => {
  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const [searchParams] = useSearchParams();
  const targetCommentId = searchParams.get("commentId");
  const { highlightComment } = useCommentHighlight();
  
  // Track the searching state and whether regular infinite scroll should be enabled
  const [isSearchingComment, setIsSearchingComment] = useState(false);
  const [commentFound, setCommentFound] = useState(false);
  const [enableInfiniteScroll, setEnableInfiniteScroll] = useState(true);
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    isError,
    error
  } = useInfiniteComments({ fileId, limit: 10 });
  
  const processComments = useCallback(() => {
    if (!data?.pages) return { topLevelComments: [], repliesMap: {}, allComments: [] };
    
    // Merge all comments from all loaded pages
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
    
    return { topLevelComments, repliesMap, allComments };
  }, [data]);
  
  const { topLevelComments, repliesMap, allComments } = processComments();
  
  // Handle comment search when URL has commentId
  useEffect(() => {
    // If there's a target comment ID in the URL, start searching
    if (targetCommentId && !commentFound) {
      setIsSearchingComment(true);
      setEnableInfiniteScroll(false);
    } else if (!targetCommentId) {
      // If URL doesn't have a comment ID, reset search states
      setIsSearchingComment(false);
      setCommentFound(false);
      setEnableInfiniteScroll(true);
    }
  }, [targetCommentId, commentFound]);

  // Check if the target comment exists in the current data
  const findTargetComment = useCallback(() => {
    if (!targetCommentId || !allComments.length) return null;
    
    // Check if target comment is in the current dataset
    const foundComment = allComments.find(comment => comment._id === targetCommentId);
    
    // Also check if it's a reply to any comment
    const foundAsReply = !foundComment && Object.keys(repliesMap).some(parentId => 
      repliesMap[parentId].some(reply => reply._id === targetCommentId)
    );
    
    return foundComment || foundAsReply;
  }, [targetCommentId, allComments, repliesMap]);
  
  // Search for the target comment when loading or fetching new pages
  useEffect(() => {
    if (!isSearchingComment || !targetCommentId || isLoading || isFetchingNextPage || commentFound) {
      return;
    }
    
    const foundTarget = findTargetComment();
    
    if (foundTarget) {
      // Found the target comment, highlight it
      highlightComment(targetCommentId);
      setCommentFound(true);
      setIsSearchingComment(false);
      
      // Re-enable infinite scroll after a short delay to ensure UI updates
      setTimeout(() => {
        setEnableInfiniteScroll(true);
      }, 500);
    } else if (hasNextPage) {
      // If target not found and there are more pages, fetch the next page
      fetchNextPage();
    } else {
      // No more pages but comment not found, stop searching
      setIsSearchingComment(false);
      setEnableInfiniteScroll(true);
    }
  }, [
    targetCommentId, isSearchingComment, isLoading, isFetchingNextPage, 
    hasNextPage, fetchNextPage, highlightComment, findTargetComment, commentFound
  ]);
  
  // Setup normal intersection observer for infinite scrolling - only when enabled
  useEffect(() => {
    // Skip if we're searching for a comment, still loading, or there's nothing more to load
    if (isSearchingComment || !enableInfiniteScroll || isLoading || !hasNextPage || 
        isFetchingNextPage || !loadMoreRef.current) {
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        // If the load more element is visible, fetch the next page
        if (entries[0].isIntersecting && hasNextPage && enableInfiniteScroll) {
          fetchNextPage();
        }
      }, 
      { root: containerRef.current, threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [
    fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, 
    isSearchingComment, enableInfiniteScroll
  ]);

  // Reset search state when fileId changes
  useEffect(() => {
    setIsSearchingComment(!!targetCommentId);
    setCommentFound(false);
    setEnableInfiniteScroll(!targetCommentId);
  }, [fileId, targetCommentId]);
  
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
          
          {/* Show searching indicator if we're actively looking for a comment */}
          {isSearchingComment && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 2 
              }}
              data-testid="finding-comment"
            >
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Searching for comment...
              </Typography>
            </Box>
          )}
          
          {/* Normal load more indicator for infinite scrolling */}
          {hasNextPage && !isSearchingComment && enableInfiniteScroll && (
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