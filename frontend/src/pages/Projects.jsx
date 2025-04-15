import { Box } from "@mui/material";
import { useSelectedProject } from "../hooks/projects";
import TopBar from "../components/common/TopBar";
import Sidebar from "../components/projects/Sidebar";
import ProjectView from "../components/projects/ProjectView";
import NoProjectSelected from "../components/projects/NoProjectSelected";
import ErrorAlert from "../components/common/ErrorAlert";

/**
 * Main Projects page component that displays the sidebar and selected project
 */
const Projects = () => {
  const { data: project, isLoading, isError, error } = useSelectedProject();

  return (
    <Box 
      sx={{ display: "flex", flexDirection: "column", height: "100vh" }}
      data-testid="projects-page"
    >
      <TopBar title="Projects" />
      <Box sx={{ display: "flex", flexDirection: "row", flexGrow: 1, overflow: "hidden" }}>
        <Sidebar />
        {isLoading ? (
          <Box 
            sx={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              flexGrow: 1 
            }}
            data-testid="project-loading"
          >
            Loading project...
          </Box>
        ) : isError ? (
          <Box 
            sx={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              flexGrow: 1 
            }}
            data-testid="project-error"
          >
            <ErrorAlert 
              message="Error loading project"
              error={error}
              actionText="Return to dashboard"
              actionLink="/"
            />
          </Box>
        ) : project ? (
          <ProjectView project={project} />
        ) : (
          <NoProjectSelected />
        )}
      </Box>
    </Box>
  );
};

export default Projects;