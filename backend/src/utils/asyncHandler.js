/**
 * Wraps controller methods with try/catch to forward errors to error middleware
 * 
 * @param {Function} fn - Async controller method
 * @returns {Function} Wrapped function with error handling
 */
export const asyncHandler = (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  };