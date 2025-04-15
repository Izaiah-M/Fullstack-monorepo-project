import { Box, Typography, Button, Alert, AlertTitle } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Reusable error component with flexible styling and actions
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Main error message
 * @param {Object} props.error - Error object containing detailed information
 * @param {string} props.actionText - Text for the action button
 * @param {string} props.actionLink - URL to navigate to when action button is clicked
 * @param {Function} props.actionHandler - Function to call when action button is clicked
 * @param {string} props.severity - Alert severity (error, warning, info, success)
 * @param {string} props.variant - Alert variant (standard, outlined, filled)
 */
const ErrorAlert = ({ 
  message = "An error occurred", 
  error,
  actionText, 
  actionLink,
  actionHandler,
  severity = "error",
  variant = "standard",
  ...props 
}) => {
  // Handle the action - either navigate to a link or call a handler function
  const handleAction = () => {
    if (actionHandler && typeof actionHandler === 'function') {
      actionHandler();
    }
  };

  // Determine if we should use a Link or a regular Button
  const ButtonComponent = actionLink ? Link : Button;
  const buttonProps = actionLink ? { to: actionLink } : { onClick: handleAction };
  
  return (
    <Box 
      sx={{ 
        width: '100%',
        maxWidth: variant === 'standard' ? 600 : 'auto',
      }}
      {...props}
    >
      <Alert 
        severity={severity} 
        variant={variant}
        sx={{ 
          width: '100%'
        }}
      >
        <AlertTitle>{message}</AlertTitle>
        {error && (
          <Typography 
            variant="body2" 
            sx={{ mb: actionText ? 2 : 0 }}
            data-testid="error-details"
          >
            {error.message || 'Unknown error occurred'}
          </Typography>
        )}
        {actionText && (
          <ButtonComponent 
            {...buttonProps}
            variant="outlined" 
            color={severity}
            size="small"
            data-testid="error-action-button"
          >
            {actionText}
          </ButtonComponent>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;