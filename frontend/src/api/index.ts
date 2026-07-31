import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

// The base URL can be an environment variable.
// For now, we point it to the local backend.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This ensures httpOnly cookies are sent with every request
});

// No request interceptor attaching a Bearer token: the JWT lives only in the
// httpOnly cookie, which withCredentials above sends automatically. Mirroring it
// into localStorage would make it readable by any injected script and would
// defeat the point of httpOnly.

// We can add interceptors here to globally handle 401s (e.g. redirect to login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // We could dispatch a logout action to our Zustand store if we get a 401
    // but we'll wire that up after creating the store to avoid circular dependencies.
    return Promise.reject(error);
  }
);

