import type { ApiError } from '../types/api.types';

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    'status' in error
  );
}

export function formatError(error: unknown): string {
  if (isApiError(error)) {
    return `Error ${error.code}: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorMessage = formatError(error);
  const contextInfo = context ? ` | Context: ${context}` : '';
  
  console.error(`[${timestamp}] ${errorMessage}${contextInfo}`);
  
  // You can add additional error reporting here (e.g., Sentry)
}
