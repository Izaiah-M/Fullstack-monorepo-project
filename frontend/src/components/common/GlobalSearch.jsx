import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  TextField, 
  InputAdornment,
  Popper, 
  Paper, 
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Divider,
  Fade,
  Skeleton
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import CommentIcon from "@mui/icons-material/Comment";
import { useSearch } from "../../hooks/search";

// Loading skeleton for search results
const SearchSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" height={40} />
  </Box>
);

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
    handleSearchFocus,
    handleSearchBlur
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
        open={isOpen && showResults}
        anchorEl={searchRef.current}
        placement="bottom-start"
        transition
        style={{ width: 400, maxWidth: "90vw", zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper elevation={3} sx={{ mt: 0.5, maxHeight: 500, overflow: "auto" }}>
              {isSearching ? (
                <SearchSkeleton />
              ) : !hasResults && showResults ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No results found for "{query}"
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {/* Projects section */}
                  {results.projects?.length > 0 && (
                    <>
                      <ListItem sx={{ py: 0.5 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Projects
                        </Typography>
                      </ListItem>
                      
                      {results.projects.map(project => (
                        <ListItemButton 
                          key={project._id} 
                          onClick={() => handleItemClick("project", project)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FolderIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={project.name}
                            secondary={project.description?.substring(0, 60) || ""}
                          />
                        </ListItemButton>
                      ))}
                      
                      <Divider component="li" />
                    </>
                  )}
                  
                  {/* Files section */}
                  {results.files?.length > 0 && (
                    <>
                      <ListItem sx={{ py: 0.5 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Files
                        </Typography>
                      </ListItem>
                      
                      {results.files.map(file => (
                        <ListItemButton 
                          key={file._id} 
                        //   button
                          onClick={() => handleItemClick("file", file)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <DescriptionIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={file.name}
                            secondary={`Project: ${file.project?.name || "Unknown"}`}
                          />
                        </ListItemButton>
                      ))}
                      
                      <Divider component="li" />
                    </>
                  )}
                  
                  {/* Comments section */}
                  {results.comments?.length > 0 && (
                    <>
                      <ListItem sx={{ py: 0.5 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Comments
                        </Typography>
                      </ListItem>
                      
                      {results.comments.map(comment => (
                        <ListItemButton 
                          key={comment._id} 
                          onClick={() => handleItemClick("comment", comment)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CommentIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={comment.body.substring(0, 60) + (comment.body.length > 60 ? "..." : "")}
                            secondary={`File: ${comment.file?.name || "Unknown"}`}
                          />
                        </ListItemButton>
                      ))}
                    </>
                  )}
                </List>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

export default GlobalSearch;