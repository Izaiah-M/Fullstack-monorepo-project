import { Button, Box, Typography, Paper } from "@mui/material";

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const handleReset = () => {
    resetErrorBoundary();
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  const handleBack = () => {
    window.history.back();
  };
  
  return (
    <Box 
      sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100%",
        p: 3
      }}
    >
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          maxWidth: 500, 
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Looks like Something went wrong :{"("}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {error.message || "An unexpected error occurred"}
        </Typography>
        
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleReset}
          >
            Try again
          </Button>
          
          <Button 
            variant="outlined"
            onClick={handleRefresh}
          >
            Refresh page
          </Button>
          
          <Button 
            variant="outlined"
            onClick={handleBack}
          >
            Go back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ErrorFallback;