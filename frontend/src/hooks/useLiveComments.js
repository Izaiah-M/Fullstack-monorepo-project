import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import io from 'socket.io-client';
import { setSocketId, getSocketId } from '../backend';

export function useLiveComments(fileId) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!fileId) return;
    
    // Connect to the socket server
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
    
    // Cleanup on unmount
    return () => {
      socket.off(`comments:${fileId}`);
      socket.disconnect();
    };
  }, [fileId, queryClient]);
}







// import { useEffect } from 'react';
// import { io } from 'socket.io-client';
// import { useQueryClient } from '@tanstack/react-query';
// import { setSocketId, getSocketId } from '../backend';

// // Create a singleton socket instance
// let socket;

// // Initialize socket once
// const getSocket = () => {
//   if (!socket) {
//     socket = io(import.meta.env.VITE_BACKEND_ORIGIN, {
//       withCredentials: true,
//     });
    
//     // Store socket ID when connected
//     socket.on('connect', () => {
//       console.log('Socket connected with ID:', socket.id);
//       setSocketId(socket.id);
//     });
    
//     // Clear socket ID when disconnected
//     socket.on('disconnect', () => {
//       console.log('Socket disconnected');
//       setSocketId(null);
//     });
//   }
  
//   return socket;
// };

// export function useLiveComments(fileId) {
//     const queryClient = useQueryClient();
    
//     useEffect(() => {
//       if (!fileId) return;
      
//       // Connect to the socket server
//       const socket = io(import.meta.env.VITE_BACKEND_ORIGIN, {
//         withCredentials: true
//       });
      
//       // Store the socket ID for excluding the sender from updates
//       socket.on('connect', () => {
//         console.log('Socket connected with ID:', socket.id);
//         setSocketId(socket.id);
//       });
      
//       // Listen for new comments
//       socket.on(`comments:${fileId}`, ({ comment, senderSocketId }) => {
//         // Skip processing if this client is the sender
//         if (senderSocketId === getSocketId()) {
//           console.log('Ignoring our own comment update');
//           return;
//         }
        
//         console.log('Received live comment update:', comment);
        
//         // Update infinite query data by updating all pages
//         queryClient.setQueryData(
//           ['infinite-comments', fileId], 
//           (oldData) => {
//             // If we don't have any data yet, don't try to update
//             if (!oldData) return oldData;
            
//             // Clone the old data to avoid mutation
//             const newData = JSON.parse(JSON.stringify(oldData));
            
//             // If this is a reply, we need to add it to the correct page
//             if (comment.parentId) {
//               // Find which page contains the parent comment
//               const pageWithParent = newData.pages.findIndex(page => 
//                 page.comments.some(c => c._id === comment.parentId)
//               );
              
//               if (pageWithParent !== -1) {
//                 // Add reply to the page with the parent
//                 newData.pages[pageWithParent].comments.push(comment);
//                 // Update pagination info
//                 newData.pages[pageWithParent].pagination.total += 1;
//               } else {
//                 // If parent not found, add to first page as fallback
//                 if (newData.pages.length > 0) {
//                   newData.pages[0].comments.push(comment);
//                   newData.pages[0].pagination.total += 1;
//                 }
//               }
//             } else {
//               // For a new top-level comment, add to the first page
//               if (newData.pages.length > 0) {
//                 newData.pages[0].comments.push(comment);
//                 newData.pages[0].pagination.total += 1;
//               }
//             }
            
//             return newData;
//           }
//         );
        
//         // Also update any standard comments queries
//         queryClient.setQueryData(
//           ['comments', fileId],
//           (oldComments = []) => [...oldComments, comment]
//         );
//       });
      
//       // Cleanup on unmount
//       return () => {
//         socket.off(`comments:${fileId}`);
//         socket.disconnect();
//       };
//     }, [fileId, queryClient]);
//   }