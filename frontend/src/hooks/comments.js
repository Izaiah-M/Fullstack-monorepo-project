import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backendFetch } from "../backend";

export function useComments({ fileId }) {
  return useQuery({
    queryKey: ["comments", fileId],
    queryFn: () => backendFetch(`/comments?fileId=${fileId}`),
    initialData: [],
  });
}

export function useCreateComment({ fileId }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, x, y, parentId }) => {
      // Create the request body based on whether it's a reply or a new comment
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
    onSuccess: (newComment) => {
      // Update the comments query cache with the new comment
      queryClient.setQueryData(["comments", fileId], (existingComments = []) => {
        return [...existingComments, newComment];
      });
    },
  });
}