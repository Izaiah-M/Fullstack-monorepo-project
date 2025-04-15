import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import io from 'socket.io-client';
import { setSocketId, getSocketId } from '../backend';

export function useLiveComments(fileId) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!fileId) return;
    
    const socket = io(import.meta.env.VITE_BACKEND_ORIGIN, {
      withCredentials: true
    });
    
    // Store the socket ID for excluding the sender from updates
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      setSocketId(socket.id);
    });
    
    // Listen for new comments
    socket.on(`comments:${fileId}`, ({ comment, senderSocketId }) => {
      // Skip processing if this client is the sender
      if (senderSocketId === getSocketId()) {
        console.log('Ignoring our own comment update');
        return;
      }
      
      console.log('Received live comment update:', comment);
      
      // Update infinite query data
      queryClient.setQueryData(
        ['infinite-comments', fileId], 
        (oldData) => {
          // If we don't have any data yet, don't try to update
          if (!oldData) return oldData;
          
          // Clone the old data to avoid mutation
          const newData = JSON.parse(JSON.stringify(oldData));
          
          // For a new comment (either top-level or reply), add to the first page
          if (newData.pages.length > 0) {
            newData.pages[0].comments.push(comment);
            newData.pages[0].pagination.total += 1;
          }
          
          return newData;
        }
      );
      
      // Also invalidate standard comments queries to ensure they refresh
      queryClient.invalidateQueries(['comments', fileId]);
    });
    
    return () => {
      socket.off(`comments:${fileId}`);
      socket.disconnect();
    };
  }, [fileId, queryClient]);
}
