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
  me: () => request('/users/me'),
  updateMe: (payload) => request('/users/me', { method: 'PUT', body: payload }),
  candidates: () => request('/users/candidates'),

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
  jobApplicants: (jobId) => request(`/applications/job/${jobId}`),
  updateApplicationStatus: (id, status) => request(`/applications/${id}/status`, { method: 'PUT', body: { status } }),

  courses: () => request('/courses'),
  createCourse: (payload) => request('/courses', { method: 'POST', body: payload }),
  enroll: (id) => request(`/courses/${id}/enroll`, { method: 'POST' }),
  myEnrollments: () => request('/courses/mine/enrollments'),
  recommendations: () => request('/courses/recommendations/for-me'),

  stats: () => request('/stats/summary')
};

export function setToken(token) {
  if (token) localStorage.setItem('snj_token', token);
  else localStorage.removeItem('snj_token');
}
export function hasToken() {
  return !!getToken();
}
