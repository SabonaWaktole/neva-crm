import axios from 'axios';

// The base URL can be an environment variable. 
// For now, we point it to the local backend.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // This ensures httpOnly cookies are sent with every request
});

// We can add interceptors here to globally handle 401s (e.g. redirect to login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // We could dispatch a logout action to our Zustand store if we get a 401
    // but we'll wire that up after creating the store to avoid circular dependencies.
    return Promise.reject(error);
  }
);
