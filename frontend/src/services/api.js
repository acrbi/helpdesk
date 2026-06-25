import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// ── Axios instance ────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject token ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: token refresh ──────────────────────
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { accessToken } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem('access_token', accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err?.response?.data || err);
  }
);

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
export const authApi = {
  login:   (data) => api.post('/auth/login', data),
  logout:  ()     => api.post('/auth/logout'),
  me:      ()     => api.get('/auth/me'),
  refresh: (t)    => api.post('/auth/refresh', { refreshToken: t }),
};

// ═══════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════
export const ticketApi = {
  getAll:      (params = {}) => api.get('/tickets', { params }),
  getOne:      (id)          => api.get(`/tickets/${id}`),
  create:      (data)        => api.post('/tickets', data),
  update:      (id, data)    => api.put(`/tickets/${id}`, data),
  remove:      (id)          => api.delete(`/tickets/${id}`),
  addComment:  (id, data)    => api.post(`/tickets/${id}/comments`, data),
  aiAnalyze:   (data)        => api.post('/tickets/ai/analyze', data),
};

// ═══════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════
export const clientApi = {
  getAll:  (params = {}) => api.get('/clients', { params }),
  getOne:  (id)          => api.get(`/clients/${id}`),
  create:  (data)        => api.post('/clients', data),
  update:  (id, data)    => api.put(`/clients/${id}`, data),
  remove:  (id)          => api.delete(`/clients/${id}`),
};

// ═══════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════
export const projectApi = {
  getAll:  (params = {}) => api.get('/projects', { params }),
  getOne:  (id)          => api.get(`/projects/${id}`),
  create:  (data)        => api.post('/projects', data),
  update:  (id, data)    => api.put(`/projects/${id}`, data),
};

// ═══════════════════════════════════════
// TECHNICIANS
// ═══════════════════════════════════════
export const techApi = {
  getAll:  () => api.get('/technicians'),
  getOne:  (id)       => api.get(`/technicians/${id}`),
  update:  (id, data) => api.put(`/technicians/${id}`, data),
};

// ═══════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════
export const reportApi = {
  summary:     () => api.get('/reports/summary'),
  techPerf:    () => api.get('/reports/technician-performance'),
};

// ═══════════════════════════════════════
// AI
// ═══════════════════════════════════════
export const aiApi = {
  analyze:        (data) => api.post('/ai/analyze', data),
  detectCategory: (data) => api.post('/ai/detect-category', data),
};
