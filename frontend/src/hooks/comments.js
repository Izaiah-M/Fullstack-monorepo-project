import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { backendFetch } from "../backend";

// Simple paginated query - returns only the page requested
export function useComments({ fileId, page = 1, limit = 15 }) {
  return useQuery({
    queryKey: ["comments", fileId, page, limit],
    queryFn: () => backendFetch(`/comments?fileId=${fileId}&page=${page}&limit=${limit}`),
    initialData: { comments: [], pagination: { total: 0, page, limit, pages: 0, hasMore: false } },
    enabled: !!fileId,
  });
}

// Infinite query - loads and combines multiple pages
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
      // Create the request body
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