import { createContext, useContext, useState } from 'react';

// Create a context for managing the highlighted comment
const CommentHighlightContext = createContext();

// Provider component to wrap File component
export const CommentHighlightProvider = ({ children }) => {
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  
  const highlightComment = (commentId) => {
    setHighlightedCommentId(commentId);
    // Auto-clear highlight after 10 seconds
    setTimeout(() => {
      setHighlightedCommentId(null);
    }, 10000);
  };
  
  return (
    <CommentHighlightContext.Provider value={{ highlightedCommentId, highlightComment }}>
      {children}
    </CommentHighlightContext.Provider>
  );
};

export const useCommentHighlight = () => useContext(CommentHighlightContext);