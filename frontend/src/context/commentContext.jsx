import { createContext, useContext, useState, useRef, useEffect } from 'react';

// Create a context for managing the highlighted comment
const CommentHighlightContext = createContext();

export const CommentHighlightProvider = ({ children }) => {
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const highlightTimeoutRef = useRef(null);
  
  // Clear existing timeout when component unmounts
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);
  
  const highlightComment = (commentId) => {
    // Clear any existing timeout to prevent race conditions
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    // Set the new highlighted comment
    setHighlightedCommentId(commentId);
    
    // Set a new timeout to clear the highlight after 10 seconds
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedCommentId(null);
      highlightTimeoutRef.current = null;
    }, 10000);
  };
  
  return (
    <CommentHighlightContext.Provider value={{ highlightedCommentId, highlightComment }}>
      {children}
    </CommentHighlightContext.Provider>
  );
};

export const useCommentHighlight = () => useContext(CommentHighlightContext);