/**
 * Error Handler Utility
 * 
 * Helper functions for handling errors in a type-safe way.
 * 
 * @module utils/errorHandler
 */

/**
 * Extracts error message from unknown error type
 * 
 * @param {unknown} error - The error object
 * @returns {string} Error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Extracts error message from Axios error response
 * 
 * @param {unknown} error - The error object (likely Axios error)
 * @returns {string} Error message from API response or generic message
 */
export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as { response?: { data?: { error?: string } } };
  if (axiosError?.response?.data?.error) {
    return axiosError.response.data.error;
  }
  return getErrorMessage(error);
}

