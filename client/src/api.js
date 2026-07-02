const BASE = '/api';

function getToken() {
  return localStorage.getItem('snj_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  sendOtp: (type, value) => request('/auth/send-otp', { method: 'POST', body: { type, value }, auth: false }),
  verifyOtp: (type, value, otp) => request('/auth/verify-otp', { method: 'POST', body: { type, value, otp }, auth: false }),
  me: () => request('/users/me'),
  updateMe: (payload) => request('/users/me', { method: 'PUT', body: payload }),
  candidates: () => request('/users/candidates'),
  usersByRole: (role) => request(`/users/by-role/${role}`),
  userStats: () => request('/users/stats'),
  auditLogs: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request('/users/audit-logs' + (qs ? `?${qs}` : '')); },
  allUsers: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request('/users/all' + (qs ? `?${qs}` : '')); },
  setUserStatus: (id, is_active) => request(`/users/${id}/status`, { method: 'PUT', body: { is_active } }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  importUsers: (role, records) => request('/import/users', { method: 'POST', body: { role, records } }),
  importJobs: (records) => request('/import/jobs', { method: 'POST', body: { records } }),
  importCourses: (records) => request('/import/courses', { method: 'POST', body: { records } }),

  jobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('/jobs' + (qs ? `?${qs}` : ''));
  },
  job: (id) => request(`/jobs/${id}`),
  myJobs: () => request('/jobs/mine/list'),
  createJob: (payload) => request('/jobs', { method: 'POST', body: payload }),
  updateJob: (id, payload) => request(`/jobs/${id}`, { method: 'PUT', body: payload }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),

  apply: (job_id) => request('/applications', { method: 'POST', body: { job_id } }),
  myApplications: () => request('/applications/mine'),
  allApplications: () => request('/applications/all'),
  jobApplicants: (jobId) => request(`/applications/job/${jobId}`),
  updateApplicationStatus: (id, status) => request(`/applications/${id}/status`, { method: 'PUT', body: { status } }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),

  courses: () => request('/courses'),
  createCourse: (payload) => request('/courses', { method: 'POST', body: payload }),
  enroll: (id) => request(`/courses/${id}/enroll`, { method: 'POST' }),
  myEnrollments: () => request('/courses/mine/enrollments'),
  recommendations: () => request('/courses/recommendations/for-me'),

  stats: () => request('/stats/summary'),

  geographicCoverage: () => request('/geographic-coverage'),
  addGeographicCoverage: (name) => request('/geographic-coverage', { method: 'POST', body: { name } }),
  setGeographicCoverageStatus: (id, is_enabled) => request(`/geographic-coverage/${id}/status`, { method: 'PATCH', body: { is_enabled } }),
  renameGeographicCoverage: (id, name) => request(`/geographic-coverage/${id}`, { method: 'PATCH', body: { name } }),
  deleteGeographicCoverage: (id) => request(`/geographic-coverage/${id}`, { method: 'DELETE' }),

  accreditations: () => request('/accreditations'),
  addAccreditation: (name) => request('/accreditations', { method: 'POST', body: { name } }),
  setAccreditationStatus: (id, is_enabled) => request(`/accreditations/${id}/status`, { method: 'PATCH', body: { is_enabled } }),
  renameAccreditation: (id, name) => request(`/accreditations/${id}`, { method: 'PATCH', body: { name } }),
  deleteAccreditation: (id) => request(`/accreditations/${id}`, { method: 'DELETE' }),

  orgClassifications: () => request('/org-classifications'),
  addOrgClassification: (name) => request('/org-classifications', { method: 'POST', body: { name } }),
  setOrgClassificationStatus: (id, is_enabled) => request(`/org-classifications/${id}/status`, { method: 'PATCH', body: { is_enabled } }),
  renameOrgClassification: (id, name) => request(`/org-classifications/${id}`, { method: 'PATCH', body: { name } }),
  deleteOrgClassification: (id) => request(`/org-classifications/${id}`, { method: 'DELETE' })
};

export function setToken(token) {
  if (token) localStorage.setItem('snj_token', token);
  else localStorage.removeItem('snj_token');
}
export function hasToken() {
  return !!getToken();
}
