export class BackendError extends Error {
  constructor(status, body) {
    super(body.message);
    this.name = "Backend Error";
    this.status = body.status;
  }
}

// Socket ID storage (module scope)
let currentSocketId = null;

// Function to set the current socket ID
export function setSocketId(id) {
  currentSocketId = id;
}

// Function to get the current socket ID
export function getSocketId() {
  return currentSocketId;
}

export async function backendFetch(url, options = {}) {
  // Add headers if they don't exist
  if (!options.headers) {
    options.headers = {};
  }
  
  // Add socket ID header if available and this is a POST request
  if (currentSocketId && (options.method === 'POST')) {
    options.headers['X-Socket-ID'] = currentSocketId;
  }
  
  const response = await fetch(`${import.meta.env.VITE_BACKEND_ORIGIN}${url}`, {
    ...options,
    credentials: "include",
  });
  
  let body;
  if (Number(response.headers.get("Content-Length")) > 0) {
    body = await response.json();
  }
  
  if (response.ok) {
    return body;
  } else {
    throw new BackendError(response.status, body);
  }
}

export function retryConfig(failureCount, error) {
  if (error instanceof BackendError) {
    return error.status === 500 && failureCount < 3;
  } else {
    return true;
  }
}

// expose for testing
window.backendFetch = backendFetch;