import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear the token
      localStorage.removeItem('token');
      
      // Only redirect if we're not already on the login or signup page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/signup', { email, password, name }),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  me: () => api.get('users/me'),
};

export const projectsApi = {
  list: () => api.get('/users/projects'),
  create: (data: any) => api.post('/users/projects', data),
  get: (id: string) => api.get(`/users/projects/${id}`),
  update: (id: string, data: any) => api.put(`/users/projects/${id}`, data),
  delete: (id: string) => api.delete(`/users/projects/${id}`),
};

export const promptsApi = {
  list: (projectId: string) => api.get(`/users/projects/${projectId}/prompts`),
  create: (projectId: string, data: any) => api.post(`/users/projects/${projectId}/prompts`, data),
  get: (projectId: string, promptId: string) => api.get(`/users/projects/${projectId}/prompts/${promptId}`),
  update: (projectId: string, promptId: string, data: any) => api.put(`/users/projects/${projectId}/prompts/${promptId}`, data),
  delete: (projectId: string, promptId: string) => api.delete(`/users/projects/${projectId}/prompts/${promptId}`),
  getVersions: (projectId: string, promptId: string) => api.get(`/users/projects/${projectId}/prompts/${promptId}`),
};

export default api;