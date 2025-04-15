import { Box, Typography, Button, Alert, AlertTitle } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Reusable error component with action button
 */
const ErrorAlert = ({ 
  message = "An error occurred", 
  error, 
  actionText, 
  actionLink,
  ...props 
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        p: 3 
      }}
      {...props}
    >
      <Alert 
        severity="error" 
        sx={{ 
          maxWidth: 600,
          width: '100%'
        }}
      >
        <AlertTitle>{message}</AlertTitle>
        {error && (
          <Typography sx={{ mb: 2 }}>
            {error.message || 'Unknown error occurred'}
          </Typography>
        )}
        {actionText && actionLink && (
          <Button 
            component={Link} 
            to={actionLink} 
            variant="outlined" 
            color="error" 
            size="small"
            data-testid="error-action"
          >
            {actionText}
          </Button>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;