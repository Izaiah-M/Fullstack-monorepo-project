import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress
} from "@mui/material";
import ErrorAlert from "../common/ErrorAlert";
import { useInviteReviewer } from "../../hooks/projects";

/**
 * Button and dialog for inviting reviewers to a project
 */
const InviteReviewerButton = ({ projectId }) => {
  const [open, setOpen] = useState(false);
  const inviteReviewer = useInviteReviewer();

  const handleClose = () => {
    if (!inviteReviewer.isLoading) {
      setOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value.trim();
    
    if (!email) return;
    
    inviteReviewer.mutate(
      { projectId, email },
      {
        onSuccess: () => {
          handleClose();
          e.target.reset();
        },
      },
    );
  };

  return (
    <Box 
      sx={{ ml: 2 }}
      data-testid="invite-reviewer-container"
    >
      <Button 
        onClick={() => setOpen(true)} 
        variant="outlined"
        data-testid="invite-reviewer-button"
      >
        Invite Reviewer
      </Button>

      <Dialog 
        open={open} 
        onClose={handleClose}
        data-testid="invite-dialog"
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>Invite Reviewer</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter the reviewer's email address:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="standard"
              name="email"
              required
              data-testid="email-input"
            />
            
            {inviteReviewer.isLoading && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 2 
                }}
                data-testid="invite-loading"
              >
                <CircularProgress size={24} />
              </Box>
            )}
            
            {inviteReviewer.isError && (
              <Box sx={{ mt: 2 }} data-testid="invite-error">
                <ErrorAlert 
                  message="Failed to send invitation"
                  error={inviteReviewer.error}
                  severity="error"
                  variant="outlined"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleClose}
              disabled={inviteReviewer.isLoading}
              data-testid="cancel-invite"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={inviteReviewer.isLoading}
              data-testid="submit-invite"
            >
              {inviteReviewer.isLoading ? "Inviting..." : "Invite"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default InviteReviewerButton;