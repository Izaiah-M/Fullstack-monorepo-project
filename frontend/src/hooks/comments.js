import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { backendFetch } from "../api/backend";
import { useEffect } from 'react';
import io from 'socket.io-client';
import { setSocketId, getSocketId } from '../api/backend';

export function useComments({ fileId, page = 1, limit = 15 }) {
  return useQuery({
    queryKey: ["comments", fileId, page, limit],
    queryFn: () => backendFetch(`/comments?fileId=${fileId}&page=${page}&limit=${limit}`),
    initialData: { comments: [], pagination: { total: 0, page, limit, pages: 0, hasMore: false } },
    enabled: !!fileId,
  });
}

export function useInfiniteComments({ fileId, limit = 10 }) {
  return useInfiniteQuery({
    queryKey: ["infinite-comments", fileId],
    queryFn: ({ pageParam = 1 }) => 
      backendFetch(`/comments?fileId=${fileId}&page=${pageParam}&limit=${limit}`),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    initialData: {
      pages: [{ comments: [], pagination: { total: 0, page: 1, limit, pages: 0, hasMore: false } }],
      pageParams: [1]
    },
    enabled: !!fileId,
  });
}

export function useCreateComment({ fileId }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, x, y, parentId }) => {
      const requestBody = { fileId, body };
      
      // Add coordinates for new comments
      if (x !== undefined && y !== undefined) {
        requestBody.x = x;
        requestBody.y = y;
      }
      
      // Add parentId for replies
      if (parentId) {
        requestBody.parentId = parentId;
      }
      
      return backendFetch("/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["comments", fileId]);
      queryClient.invalidateQueries(["infinite-comments", fileId]);
    },
  });
}

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
      
      // console.log('Received live comment update:', comment);
      
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
