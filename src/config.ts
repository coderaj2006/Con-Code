/**
 * Central API configuration for Kisaan AI.
 * All services must import API_BASE from here — never hardcode ports.
 * To override, set VITE_API_URL in your .env file.
 */
export const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8002';
