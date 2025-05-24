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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const projectsApi = {
  list: () => api.get('/projects'),
  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: Partial<{ name: string; description: string }>) =>
    api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const promptsApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/prompts`),
  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/prompts`, data),
  get: (projectId: string, promptId: string) =>
    api.get(`/projects/${projectId}/prompts/${promptId}`),
  update: (projectId: string, promptId: string, data: any) =>
    api.put(`/projects/${projectId}/prompts/${promptId}`, data),
  delete: (projectId: string, promptId: string) =>
    api.delete(`/projects/${projectId}/prompts/${promptId}`),
};

export default api;