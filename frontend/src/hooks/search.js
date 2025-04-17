import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendFetch } from "../api/backend";

export function useSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
  
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
      }, 300); 
  
      return () => clearTimeout(timer);
    }, [query]);
  
    const searchFn = useCallback(async () => {
      if (!debouncedQuery) return { projects: [], files: [], comments: [] };
      
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
      staleTime: 1000 * 60 * 5,  
      cacheTime: 1000 * 60 * 30, 
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    });
  
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
    
    useEffect(() => {
      if (query === '') {
        setHasSearched(false);
      }
    }, [query]);
    
    const showNoResults = hasSearched && !isSearching && debouncedQuery.length > 0 && !hasResults;
  
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
      const timer = setTimeout(() => setIsOpen(false), 300);
      return () => clearTimeout(timer);
    }, []);
  
    const clearSearch = useCallback(() => {
      setQuery("");
      setDebouncedQuery("");
      setIsOpen(false);
      setHasSearched(false);
    }, []);
    
    // Calculate which categories have results
    const categoriesWithResults = {
      hasProjects: safeResults.projects.length > 0,
      hasFiles: safeResults.files.length > 0,
      hasComments: safeResults.comments.length > 0
    };
    
    // Count how many categories have results
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
      categoriesWithResults,
      resultCategoryCount
    };
}