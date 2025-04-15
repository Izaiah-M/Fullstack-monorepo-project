import {
    Box,
    Typography,
    AvatarGroup
  } from "@mui/material";
  import { useSession } from "../../hooks/auth";
  import UploadFileButton from "./UploadFileButton";
  import InviteReviewerButton from "./InviteReviewerButton";
  import ProjectFilesList from "./ProjectFilesList";
  import UserAvatar from "../common/UserAvatar";
  
  /**
   * Component that displays project details and files
   */
  const ProjectView = ({ project }) => {
    const { data: { userId } } = useSession();
    const isProjectOwner = project.authorId === userId;
  
    return (
      <Box 
        sx={{ 
          px: 4, 
          py: 2, 
          flexGrow: 1,
          overflowY: 'auto'
        }}
        data-testid="project-view"
      >
        {/* Project Header */}
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center",
            mb: 4
          }}
          data-testid="project-header"
        >
          <Typography 
            variant="h4" 
            component="h1"
            data-testid="project-title"
          >
            {project.name}
          </Typography>
          
          <Box sx={{ flexGrow: 1, px: 4 }}>
            {isProjectOwner && (
              <UploadFileButton projectId={project._id} />
            )}
          </Box>
          
          <Box 
            sx={{ display: "flex", alignItems: "center" }}
            data-testid="reviewers-section"
          >
            <AvatarGroup 
              max={5}
              data-testid="reviewers-avatars"
            >
              {project.reviewers.map((reviewerId) => (
                <UserAvatar 
                  key={reviewerId} 
                  userId={reviewerId} 
                  data-testid={`reviewer-${reviewerId}`}
                />
              ))}
            </AvatarGroup>
            
            {isProjectOwner && (
              <InviteReviewerButton projectId={project._id} />
            )}
          </Box>
        </Box>
  
        {/* Project Files */}
        <Box 
          sx={{ mt: 2 }}
          data-testid="project-files-section"
        >
          <Typography 
            variant="h6" 
            sx={{ mb: 2 }}
            data-testid="files-heading"
          >
            Files
          </Typography>
          <ProjectFilesList projectId={project._id} />
        </Box>
      </Box>
    );
  };
  
  export default ProjectView;