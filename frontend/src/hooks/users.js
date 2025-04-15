import { useQuery } from "@tanstack/react-query";
import { backendFetch } from "../api/backend";

export function useUser(userId) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => backendFetch(`/users/${userId}`),
  });
}
