// API utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('nysc_token');
  
  const defaultHeaders: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  return fetch(getApiUrl(endpoint), mergedOptions);
};

export default { getApiUrl, apiRequest };