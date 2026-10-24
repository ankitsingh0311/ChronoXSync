// =============================================================================
// EduTrack 3D — API Service Layer (api.js)
// =============================================================================
// SUBJECT 2 (System Design): Centralized Axios instance with JWT interceptor.
// All API calls route through this service for consistent auth/error handling.
// =============================================================================

import axios from 'axios';

// Base URL for FastAPI backend (respects VITE_API_URL for separate backend deployments, or relative path for unified/proxy domains)
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- JWT Token Interceptor (Subject 4: Cloud Security) ---
// Automatically attach Bearer token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edutrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function resolveMediaPaths(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const backendBase = import.meta.env.VITE_API_URL || 'https://chronoxsync.onrender.com';
  const cleanBase = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;

  if (Array.isArray(obj)) {
    return obj.map(resolveMediaPaths);
  }

  const res = { ...obj };
  for (const k of Object.keys(res)) {
    if (typeof res[k] === 'string' && res[k].startsWith('/uploads/')) {
      res[k] = `${cleanBase}${res[k]}`;
    } else if (typeof res[k] === 'object' && res[k] !== null) {
      res[k] = resolveMediaPaths(res[k]);
    }
  }
  return res;
}

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = resolveMediaPaths(response.data);
    }
    return response;
  },
  (error) => {
    const isAuthRoute =
      error.config?.url?.includes('/api/auth/login') ||
      error.config?.url?.includes('/api/auth/register') ||
      error.config?.url?.includes('/api/auth/forgot-password') ||
      error.config?.url?.includes('/api/auth/reset-password');

    // Only redirect to /login on 401 if it's NOT a login/register attempt
    // and if the browser is not already on /login (prevent reload loop)
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('edutrack_token');
      localStorage.removeItem('edutrack_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// API Service Functions
// =============================================================================

// --- Authentication ---
export const authAPI = {
  // Sends { full_name, email, password, selected_role } for strict role verification
  login: (payload) =>
    api.post('/api/auth/login', payload),
  // Sends { full_name, email, password, selected_role } for Directory cross-check
  register: (data) =>
    api.post('/api/auth/register', data),
  forgotPassword: (email) =>
    api.post('/api/auth/forgot-password', { email }),
  resetPassword: (payload) =>
    api.post('/api/auth/reset-password', payload),
  getMe: () =>
    api.get('/api/auth/me'),
  getRoster: () =>
    api.get('/api/auth/roster'),
  deleteUser: (userId) =>
    api.delete(`/api/auth/roster/${userId}`),
  deleteMyAccount: () =>
    api.delete('/api/user/account'),
};

// --- User Profile & Permanent Certificates ---
export const profileAPI = {
  getProfile: () =>
    api.get('/api/user/profile'),
  updateProfile: (data) =>
    api.put('/api/user/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAvatar: () =>
    api.delete('/api/user/avatar'),
  addCertificate: (formData) => {
    if (formData instanceof FormData) {
      return api.post('/api/user/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        form.append(key, formData[key]);
      }
    });
    return api.post('/api/user/certificates', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteCertificate: (certificateId) =>
    api.delete(`/api/user/certificates/${certificateId}`),
};


// --- Deadlines (Feature F1) ---
export const deadlineAPI = {
  getAll: (params = {}) =>
    api.get('/api/deadlines', { params }),
  create: (data) =>
    api.post('/api/deadlines', data),
  delete: (id, params = {}) =>
    api.delete(`/api/deadlines/${id}`, { params }),
  toggle: (deadline_id, status) =>
    api.post('/api/submissions/toggle', { deadline_id, status }),
};

// --- Submissions & Cryptographic Proof of Submission (SHA-256 Tamper-Proof Engine) ---
export const submissionAPI = {
  toggle: (deadline_id, status) =>
    api.post('/api/submissions/toggle', { deadline_id, status }),
  submitTask: (deadline_id, file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append('deadline_id', deadline_id);
      formData.append('file', file);
      return api.post('/api/student/submit-task', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/api/student/submit-task', { deadline_id });
  },
  getReceipt: (deadline_id) =>
    api.get(`/api/student/receipt/${deadline_id}`),
  verifyReceipt: (receipt_hash) =>
    api.post('/api/security/verify-receipt', { receipt_hash }),
  getRecentSubmissions: (limit = 15) =>
    api.get('/api/security/recent-submissions', { params: { limit } }),
};

export const cryptoAPI = {
  verifyReceipt: (receipt_hash) =>
    api.post('/api/security/verify-receipt', { receipt_hash }),
  getStudentReceipt: (deadline_id) =>
    api.get(`/api/student/receipt/${deadline_id}`),
  getRecentSubmissions: (limit = 15) =>
    api.get('/api/security/recent-submissions', { params: { limit } }),
  submitTask: (deadline_id, file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append('deadline_id', deadline_id);
      formData.append('file', file);
      return api.post('/api/student/submit-task', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/api/student/submit-task', { deadline_id });
  },
};

// --- Automated 24h Deadline Reminders (Feature F3 Cron Alerts) ---
export const reminderAPI = {
  getAll: () => api.get('/api/reminders'),
  scan: () => api.post('/api/reminders/scan'),
  markRead: (id) => api.put(`/api/reminders/${id}/read`),
  markAllRead: () => api.put('/api/reminders/read-all'),
};

// --- Exams ---
export const examAPI = {
  getAll: (params = {}) => api.get('/api/exams', { params }),
  create: (data) => api.post('/api/exams', data),
  delete: (examId) => api.delete(`/api/exams/${examId}`),
};

// --- Panic Button (Feature F5) ---
export const panicAPI = {
  submit: (data) => {
    const payload = typeof data === 'string' ? { message: data } : data;
    return api.post('/api/panic', payload);
  },
  getHodDirectory: (params = {}) =>
    api.get('/api/panic/hod-directory', { params }),
  getMyGrievances: () =>
    api.get('/api/panic/my-grievances'),
  uploadProof: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/panic/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getLogs: (params = {}) =>
    api.get('/api/panic/logs', { params }),
  resolve: (id, notes) =>
    api.put(`/api/panic/${id}/resolve`, { notes }),
  unresolve: (id) =>
    api.put(`/api/panic/${id}/unresolve`),
  delete: (id) =>
    api.delete(`/api/panic/${id}`),
  updateStatus: (id, status, notes) =>
    api.put(`/api/panic/${id}/status`, { status, notes }),
};

// --- Department Notices (HOD Broadcast Bulletins) ---
export const noticeAPI = {
  getAll: (params = {}) => api.get('/api/notices', { params }),
  create: (data) => api.post('/api/notices', data),
  delete: (id) => api.delete(`/api/notices/${id}`),
};

// --- Faculty to CR Coursework Delegation System (Feature F9) ---
export const delegationAPI = {
  getCRs: (params = {}) => api.get('/api/delegations/crs', { params }),
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/delegations/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (data) => api.post('/api/delegations', data),
  getFacultyDelegations: () => api.get('/api/delegations/faculty'),
  getCRDelegations: () => api.get('/api/delegations/cr'),
  publishToStudents: (id) => api.post(`/api/delegations/${id}/publish`),
  delete: (id) => api.delete(`/api/delegations/${id}`),
};

// --- History & Task Progress Audit Trail ---
export const historyAPI = {
  getHistory: () => api.get('/api/history'),
  getDeadlineStudents: (deadlineId) => api.get(`/api/history/deadline/${deadlineId}/students`),
};

// --- Admin System Controls ---
export const adminAPI = {
  resetDb: (mode = 'clean_slate') => api.post('/api/admin/reset-db', { mode }),
};

// --- OCR (Feature F6) ---
export const ocrAPI = {
  extract: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/ocr/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// --- Study Estimator (Feature F7) ---
export const estimateAPI = {
  getEstimate: (title, description, urgency) =>
    api.post('/api/estimate', { title, description, urgency }),
};

// --- Analytics (Feature F4) ---
export const analyticsAPI = {
  getHeatmap: (params = {}) => api.get('/api/analytics/heatmap', { params }),
  getPowerBIDataset: (params = {}) => api.get('/api/analytics/powerbi-dataset', { params }),
};

// --- Dashboard ---
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
};

// --- Users ---
export const userAPI = {
  getAll: () => api.get('/api/users'),
  getFacultyStudents: () => api.get('/api/faculty/students'),
  promote: (user_id, role_id) =>
    api.put('/api/users/promote', { user_id, role_id }),
};

// --- Courses ---
export const courseAPI = {
  getAll: () => api.get('/api/courses'),
};

// --- Faculty Multi-Department & Multi-Program Syllabus (Feature F10) ---
export const syllabusAPI = {
  getAll: (params = {}) => api.get('/api/syllabus', { params }),
  create: (data) => api.post('/api/syllabus', data),
  update: (id, data) => api.put(`/api/syllabus/${id}`, data),
  delete: (id) => api.delete(`/api/syllabus/${id}`),
  addUnit: (syllabusId, data) => api.post(`/api/syllabus/${syllabusId}/units`, data),
  toggleUnit: (unitId, completed) => api.put(`/api/syllabus/units/${unitId}/toggle`, { completed }),
  deleteUnit: (unitId) => api.delete(`/api/syllabus/units/${unitId}`),
};

// --- AI Chatbot & Report Analyst (Feature F8: NVIDIA Nemotron 3.5 Super-VL 120B) ---
export const aiAPI = {
  getStatus: () => api.get('/api/ai/status'),
  setApiKey: (api_key) => api.post('/api/ai/set-key', { api_key }),
  getAcademicReport: () => api.get('/api/ai/academic-report'),
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/ai/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  chat: (payload) => api.post('/api/ai/chat', payload),
  quickCreateDeadline: (payload) => api.post('/api/ai/quick-create-deadline', payload),
  // Streaming chat using fetch with SSE reader
  streamChat: async (payload, onChunk, onDone, onError) => {
    try {
      const token = localStorage.getItem('edutrack_token');
      const response = await fetch(`${API_BASE}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'done') {
                if (onDone) onDone(data);
              } else {
                if (onChunk) onChunk(data);
              }
            } catch (e) {
              console.error('Error parsing SSE event:', e);
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  },
};

// --- Dynamic Calendar Feed & Token Management (RFC-5545) ---
export const calendarAPI = {
  getToken: () =>
    api.get('/api/v1/calendar/token'),
  rotateToken: () =>
    api.post('/api/v1/calendar/rotate-token'),
  downloadSnapshot: (token) => {
    // Direct link to download .ics snapshot for local file import
    const base = import.meta.env.VITE_API_URL || '';
    const url = `${base}/api/v1/calendar/feed/${token}.ics`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'chronosync_academic_feed.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default api;

