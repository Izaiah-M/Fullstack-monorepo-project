import CommentIcon from "@mui/icons-material/Comment";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import {
    Box,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography
} from "@mui/material";

const SearchSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" height={40} />
  </Box>
);



export const RenderSearchContent = ({isSearching, showNoResults, hasResults, results, categoriesWithResults, resultCategoryCount}) => {
    if (isSearching) {
      return <SearchSkeleton />;
    }
    
    if (showNoResults) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }} data-testid="no-results-message">
          <Typography color="text.secondary">
            No results found for "{query}"
          </Typography>
        </Box>
      );
    }
    
    if (hasResults) {
      return (
        <List dense>
          {results.projects?.length > 0 && (resultCategoryCount > 1 ? true : categoriesWithResults.hasProjects) && (
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
              
              {/* Only show divider if there are multiple categories */}
              {resultCategoryCount > 1 && <Divider component="li" />}
            </>
          )}
          
          {/* Files section - only show if there are files OR there are results in multiple categories */}
          {results.files?.length > 0 && (resultCategoryCount > 1 ? true : categoriesWithResults.hasFiles) && (
            <>
              <ListItem sx={{ py: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Files
                </Typography>
              </ListItem>
              
              {results.files.map(file => (
                <ListItemButton 
                  key={file._id} 
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
              
              {results.comments?.length > 0 && resultCategoryCount > 1 && <Divider component="li" />}
            </>
          )}
          
          {/* Comments section - only show if there are comments OR there are results in multiple categories */}
          {results.comments?.length > 0 && (resultCategoryCount > 1 ? true : categoriesWithResults.hasComments) && (
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
      );
    }
    
    return null;
  };