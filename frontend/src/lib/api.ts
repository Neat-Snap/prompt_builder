import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
        window.location.href = '/signup';
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
  sendVerificationEmail: (email: string) =>
    api.post('/auth/send_email', { email }),
  verifyEmailCode: (code: string) =>
    api.post('/auth/verify_code', { code }),
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

export const llmApi = {
  request: (system_prompt: string, user_prompt: string, model: string) =>
    api.post('/llm/request', { system_prompt, user_prompt, model }),
  searchModels: (q: string) => api.get(`/llm/search?q=${encodeURIComponent(q)}`),
};

export const testsetsApi = {
  list: (projectId: string | number) => api.get(`/tests/testsets/${projectId}`),
  create: (projectId: string | number, data: { name: string }) => api.post(`/tests/testsets/${projectId}`, data),
  addTest: (testsetId: string | number, prompt: string) => api.post(`/tests/testsets/${testsetId}/tests`, { prompt }),
  deleteTest: (testsetId: string | number, testId: string | number) => api.delete(`/tests/testsets/${testsetId}/tests/${testId}`),
  deleteTestset: (testsetId: string | number) => api.delete(`/tests/testsets/${testsetId}`),
  run: (projectId: string | number, data: { testset_id: number, prompt_id: string, model: string }) => api.post(`/tests/run_testset/${projectId}`, data),
  checkRun: (promptVersionId: string | number) => api.get(`/tests/check_run/${promptVersionId}`),
};

export default api;