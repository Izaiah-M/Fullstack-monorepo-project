import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { setSocketId, getSocketId } from '../backend';

// Create a singleton socket instance
let socket;

// Initialize socket once
const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_BACKEND_ORIGIN, {
      withCredentials: true,
    });
    
    // Store socket ID when connected
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      setSocketId(socket.id);
    });
    
    // Clear socket ID when disconnected
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketId(null);
    });
  }
  
  return socket;
};

export function useLiveComments(fileId) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!fileId) return;
    
    // Get or initialize socket
    const socket = getSocket();
    
    // Handle new comments
    const handleNewComment = (data) => {
      // Extract the comment and sender socket ID
      const { comment, senderSocketId } = data;
      
      // Skip if this is our own comment (to avoid duplication)
      if (senderSocketId === getSocketId()) {
        console.log('Ignoring my own comment from socket:', comment._id);
        return;
      }
      
      console.log('Received comment from another user:', comment._id);
      
      // Update the comments query data
      queryClient.setQueryData(['comments', fileId], (oldComments = []) => {
        // Check if the comment already exists
        if (oldComments.some(c => c._id === comment._id)) {
          return oldComments;
        }
        
        // Add the new comment
        return [...oldComments, comment];
      });
    };
    
    // Listen for comments on this file
    console.log(`Listening for comments on file: ${fileId}`);
    socket.on(`comments:${fileId}`, handleNewComment);
    
    // Cleanup when component unmounts
    return () => {
      console.log(`Stopped listening for comments on file: ${fileId}`);
      socket.off(`comments:${fileId}`);
    };
  }, [fileId, queryClient]);
}