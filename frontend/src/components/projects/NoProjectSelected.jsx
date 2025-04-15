import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";
import { useCreateProject } from "../../hooks/projects";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

/**
 * Component displayed when no project is selected
 */
const NoProjectSelected = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const createProject = useCreateProject();

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    const projectName = e.target.elements.name.value.trim();
    
    if (!projectName) return;
    
    createProject.mutate(
      { name: projectName },
      {
        onSuccess: () => {
          handleDialogClose();
        },
      },
    );
  };

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        flexGrow: 1,
        p: 4
      }}
      data-testid="no-project-selected"
    >
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        data-testid="no-project-heading"
      >
        No project selected
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        align="center" 
        sx={{ mb: 4, maxWidth: 500 }}
        data-testid="no-project-description"
      >
        Select a project from the sidebar or create a new project to get started.
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={() => setDialogOpen(true)}
        data-testid="create-project-button-main"
      >
        Create New Project
      </Button>

      {/* Create Project Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        data-testid="create-project-dialog-main"
      >
        <Box component="form" onSubmit={handleCreateProject}>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter the project name:
            </DialogContentText>
            <TextField
              autoFocus
              name="name"
              margin="dense"
              label="Project Name"
              type="text"
              fullWidth
              variant="standard"
              required
              data-testid="project-name-input-main"
            />
            {createProject.isError && (
              <Typography 
                color="error"
                sx={{ mt: 2 }}
                data-testid="create-project-error-main"
              >
                {createProject.error?.message || 'Failed to create project'}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleDialogClose}
              data-testid="cancel-create-project-main"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={createProject.isLoading}
              data-testid="submit-create-project-main"
            >
              {createProject.isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default NoProjectSelected;