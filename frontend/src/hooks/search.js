import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendFetch } from "../api/backend";

export function useSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState("");
  
    // Use useCallback to memoize the search function
    const searchFn = useCallback(async () => {
      if (!debouncedQuery) return { projects: [], files: [], comments: [] };
      return backendFetch(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    }, [debouncedQuery]);
  
    // Handle debounce in a separate effect
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
      }, 150);
  
      return () => clearTimeout(timer);
    }, [query]);
  
    const {
      data: results = { projects: [], files: [], comments: [] },
      isLoading,
      isFetching,
    } = useQuery({
      queryKey: ["search", debouncedQuery],
      queryFn: searchFn,
      enabled: debouncedQuery.length > 0,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    });
  
    const hasResults = 
      results.projects?.length > 0 || 
      results.files?.length > 0 || 
      results.comments?.length > 0;
  
    const showResults = query.length > 0;
    const isSearching = isLoading || isFetching;
  
    // Manage dropdown visibility
    useEffect(() => {
      if (showResults) {
        setIsOpen(true);
      }
    }, [showResults, results]);
  
    const handleSearchFocus = useCallback(() => {
      if (showResults) {
        setIsOpen(true);
      }
    }, [showResults]);
  
    const handleSearchBlur = useCallback(() => {
      const timer = setTimeout(() => setIsOpen(false), 200);
      return () => clearTimeout(timer);
    }, []);
  
    const clearSearch = useCallback(() => {
      setQuery("");
      setDebouncedQuery("");
      setIsOpen(false);
    }, []);
  
    return {
      query,
      setQuery,
      results,
      isSearching,
      isOpen,
      setIsOpen,
      hasResults,
      showResults,
      handleSearchFocus,
      handleSearchBlur,
      clearSearch
    };
  }