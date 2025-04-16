import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendFetch } from "../api/backend";

export function useSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState("");
    // Track if we've made at least one search request
    const [hasSearched, setHasSearched] = useState(false);
  
    // Handle debounce in a separate effect
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
      }, 300); // Increased debounce time for stability
  
      return () => clearTimeout(timer);
    }, [query]);
  
    // Use useCallback to memoize the search function
    const searchFn = useCallback(async () => {
      if (!debouncedQuery) return { projects: [], files: [], comments: [] };
      
      // Mark that we've made a search request
      setHasSearched(true);
      
      try {
        const results = await backendFetch(`/search?q=${encodeURIComponent(debouncedQuery)}`);

        console.log(results || { projects: [], files: [], comments: [] });
        
        return results || { projects: [], files: [], comments: [] };
      } catch (error) {
        console.error("Search error:", error);
        return { projects: [], files: [], comments: [] };
      }
    }, [debouncedQuery]);
  
    const {
      data: results = { projects: [], files: [], comments: [] },
      isLoading,
      isFetching,
      isError,
    } = useQuery({
      queryKey: ["search", debouncedQuery],
      queryFn: searchFn,
      enabled: debouncedQuery.length > 0,
      staleTime: 1000 * 60 * 5,  // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    });
  
    // Ensure that the results are always properly initialized arrays
    const safeResults = {
      projects: Array.isArray(results.projects) ? results.projects : [],
      files: Array.isArray(results.files) ? results.files : [],
      comments: Array.isArray(results.comments) ? results.comments : [],
    };
  
    const hasResults = 
      safeResults.projects.length > 0 || 
      safeResults.files.length > 0 || 
      safeResults.comments.length > 0;
  
    const showResults = query.length > 0;
    const isSearching = isLoading || isFetching;
    
    // Fix: We only want to reset hasSearched when the query completely changes, not just on typing
    // This ensures the "no results" message stays visible
    useEffect(() => {
      if (query === '') {
        setHasSearched(false);
      }
    }, [query]);
    
    // Need to have searched, not be searching, have a query, and have no results
    const showNoResults = hasSearched && !isSearching && debouncedQuery.length > 0 && !hasResults;
  
    // Manage dropdown visibility
    useEffect(() => {
      if (showResults) {
        setIsOpen(true);
      }
    }, [showResults]);
  
    const handleSearchFocus = useCallback(() => {
      if (showResults) {
        setIsOpen(true);
      }
    }, [showResults]);
  
    const handleSearchBlur = useCallback(() => {
      // Fix: Increase the timeout slightly to prevent flickering
      const timer = setTimeout(() => setIsOpen(false), 300);
      return () => clearTimeout(timer);
    }, []);
  
    const clearSearch = useCallback(() => {
      setQuery("");
      setDebouncedQuery("");
      setIsOpen(false);
      setHasSearched(false);
    }, []);
    
    // New: Calculate which categories have results
    const categoriesWithResults = {
      hasProjects: safeResults.projects.length > 0,
      hasFiles: safeResults.files.length > 0,
      hasComments: safeResults.comments.length > 0
    };
    
    // New: Count how many categories have results
    const resultCategoryCount = Object.values(categoriesWithResults)
      .filter(Boolean).length;
  
    return {
      query,
      setQuery,
      results: safeResults,
      isSearching,
      isOpen,
      setIsOpen,
      hasResults,
      showResults,
      showNoResults,
      isError,
      handleSearchFocus,
      handleSearchBlur,
      clearSearch,
      // Export new properties
      categoriesWithResults,
      resultCategoryCount
    };
}