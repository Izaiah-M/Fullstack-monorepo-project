import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  CircularProgress,
  Fade,
  InputAdornment,
  Paper,
  Popper,
  TextField
} from "@mui/material";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/search";
import { RenderSearchContent } from "./renderSearch";


const GlobalSearch = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  
  const { 
    query, 
    setQuery, 
    results, 
    isSearching,
    isOpen, 
    setIsOpen,
    hasResults,
    showResults,
    showNoResults,
    handleSearchFocus,
    handleSearchBlur,
    categoriesWithResults,
    resultCategoryCount
  } = useSearch();
  
  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };
  
  const handleItemClick = (type, item) => {
    setIsOpen(false);
    
    switch (type) {
      case "project":
        navigate(`/projects/${item._id}`);
        break;
      case "file":
        navigate(`/files/${item._id}`);
        break;
      case "comment":
        navigate(`/files/${item.fileId}?commentId=${item._id}`);
        break;
      default:
        break;
    }
  };
 
  return (
    <Box sx={{ position: "relative", width: 300 }}>
      <TextField
        ref={searchRef}
        value={query}
        onChange={handleSearchChange}
        placeholder="Search projects, files & comments..."
        variant="outlined"
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color={isSearching ? "primary" : "inherit"} />
            </InputAdornment>
          ),
          endAdornment: isSearching && (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          )
        }}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
      />
      
      <Popper
        open={isOpen && (showResults || showNoResults)}
        anchorEl={searchRef.current}
        placement="bottom-start"
        transition
        style={{ width: 400, maxWidth: "90vw", zIndex: 1300 }}
      >
        {({ TransitionProps }) => {
          return (
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                elevation={3}
                sx={{ mt: 0.5, maxHeight: 500, overflow: "auto" }}
                data-testid="search-results-dropdown"
              >
                <RenderSearchContent
                  isSearching={isSearching}
                  showNoResults={showNoResults}
                  hasResults={hasResults}
                  results={results}
                  categoriesWithResults={categoriesWithResults}
                  resultCategoryCount={resultCategoryCount} />
              </Paper>
            </Fade>
          );
        }}
      </Popper>
    </Box>
  );
};

export default GlobalSearch;