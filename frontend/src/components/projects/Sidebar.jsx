import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  List,
  ListSubheader,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Typography
} from "@mui/material";
import ErrorAlert from "../common/ErrorAlert";
import { useProjects, useSelectedProject, useCreateProject } from "../../hooks/projects";
import { useSession } from "../../hooks/auth";

/**
 * Sidebar component that displays project lists and create project button
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading, isError, error } = useProjects();
  const { data: selectedProject } = useSelectedProject();
  const createProject = useCreateProject();
  const { data: { userId } } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Organize projects into "My Projects" and "Shared with me"
  const categorizeProjects = () => {
    if (!projects || !Array.isArray(projects)) return [[], []];
    
    return projects.reduce(
      (result, project) => {
        if (project.authorId === userId) {
          result[0].push(project);
        } else {
          result[1].push(project);
        }
        return result;
      },
      [[], []],
    );
  };

  const [myProjects, sharedWithMe] = categorizeProjects();

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          minWidth: 240, 
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        data-testid="sidebar-loading"
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box 
        sx={{ minWidth: 240, p: 2 }}
        data-testid="sidebar-error"
      >
        <ErrorAlert 
          message="Error loading projects"
          error={error}
          actionText="Retry"
          actionHandler={() => window.location.reload()}
        />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minWidth: 240, 
        p: 2,
        overflowY: 'auto',
        borderRight: '1px solid #e0e0e0'
      }}
      data-testid="project-sidebar"
    >
      <Button
        fullWidth
        variant="contained"
        onClick={() => setDialogOpen(true)}
        data-testid="create-project-button"
      >
        Create Project
      </Button>

      {/* Create Project Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        data-testid="create-project-dialog"
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
              data-testid="project-name-input"
            />
            {createProject.isError && (
              <Typography 
                color="error" 
                sx={{ mt: 2 }}
                data-testid="create-project-error"
              >
                {createProject.error?.message || 'Failed to create project'}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleDialogClose}
              data-testid="cancel-create-project"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={createProject.isLoading}
              data-testid="submit-create-project"
            >
              {createProject.isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* My Projects List */}
      {myProjects.length > 0 && (
        <List 
          subheader={
            <ListSubheader data-testid="my-projects-header">
              My Projects
            </ListSubheader>
          }
          data-testid="my-projects-list"
        >
          {myProjects.map((project) => (
            <ListItemButton
              selected={project._id === selectedProject?._id}
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              data-testid={`project-item-${project._id}`}
            >
              <ListItemText primary={project.name} />
            </ListItemButton>
          ))}
        </List>
      )}

      {/* Shared Projects List */}
      {sharedWithMe.length > 0 && (
        <List 
          subheader={
            <ListSubheader data-testid="shared-projects-header">
              Shared with me
            </ListSubheader>
          }
          data-testid="shared-projects-list"
        >
          {sharedWithMe.map((project) => (
            <ListItemButton
              selected={project._id === selectedProject?._id}
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              data-testid={`shared-project-item-${project._id}`}
            >
              <ListItemText primary={project.name} />
            </ListItemButton>
          ))}
        </List>
      )}

      {/* Display when no projects exist */}
      {myProjects.length === 0 && sharedWithMe.length === 0 && (
        <Typography 
          sx={{ mt: 4, textAlign: 'center' }}
          color="text.secondary"
          data-testid="no-projects"
        >
          No projects yet. Click "Create Project" to get started.
        </Typography>
      )}
    </Box>
  );
};

export default Sidebar;