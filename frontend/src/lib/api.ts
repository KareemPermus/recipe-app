import axios from 'axios';

// CRITICAL: Use empty string as default - endpoint calls MUST include /api prefix
// e.g., apiClient.get('/api/recipes') => request to /api/recipes (routed by ingress to backend)
// For local development with separate containers, you can override with NEXT_PUBLIC_API_URL=http://localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
