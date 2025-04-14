import { createContext, useContext, useState } from 'react';

// Create a context for managing the highlighted comment
const CommentHighlightContext = createContext();

// Provider component to wrap File component
export const CommentHighlightProvider = ({ children }) => {
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  
  const highlightComment = (commentId) => {
    setHighlightedCommentId(commentId);
    // Auto-clear highlight after 2 seconds
    setTimeout(() => {
      setHighlightedCommentId(null);
    }, 4000);
  };
  
  return (
    <CommentHighlightContext.Provider value={{ highlightedCommentId, highlightComment }}>
      {children}
    </CommentHighlightContext.Provider>
  );
};

// Hook to access the highlight context
export const useCommentHighlight = () => useContext(CommentHighlightContext);