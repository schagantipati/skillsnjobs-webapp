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
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    if (data && data.field) err.field = data.field;
    throw err;
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
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload }),
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

  targetBeneficiaries: () => request('/target-beneficiaries'),
  addTargetBeneficiary: (name) => request('/target-beneficiaries', { method: 'POST', body: { name } }),
  setTargetBeneficiaryStatus: (id, is_enabled) => request(`/target-beneficiaries/${id}/status`, { method: 'PATCH', body: { is_enabled } }),
  renameTargetBeneficiary: (id, name) => request(`/target-beneficiaries/${id}`, { method: 'PATCH', body: { name } }),
  deleteTargetBeneficiary: (id) => request(`/target-beneficiaries/${id}`, { method: 'DELETE' }),

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
  deleteOrgClassification: (id) => request(`/org-classifications/${id}`, { method: 'DELETE' }),

  // Training Vendor portal
  vendorStats: () => request('/vendor/stats'),
  // Centres
  vendorCentres: () => request('/vendor/centres'),
  createVendorCentre: (b) => request('/vendor/centres', { method: 'POST', body: b }),
  updateVendorCentre: (id, b) => request(`/vendor/centres/${id}`, { method: 'PUT', body: b }),
  deleteVendorCentre: (id) => request(`/vendor/centres/${id}`, { method: 'DELETE' }),
  // Trainers
  vendorTrainers: () => request('/vendor/trainers'),
  createVendorTrainer: (b) => request('/vendor/trainers', { method: 'POST', body: b }),
  updateVendorTrainer: (id, b) => request(`/vendor/trainers/${id}`, { method: 'PUT', body: b }),
  deleteVendorTrainer: (id) => request(`/vendor/trainers/${id}`, { method: 'DELETE' }),
  // Courses
  vendorCourses: () => request('/vendor/courses'),
  createVendorCourse: (b) => request('/vendor/courses', { method: 'POST', body: b }),
  updateVendorCourse: (id, b) => request(`/vendor/courses/${id}`, { method: 'PUT', body: b }),
  deleteVendorCourse: (id) => request(`/vendor/courses/${id}`, { method: 'DELETE' }),
  // Batches
  vendorBatches: () => request('/vendor/batches'),
  createVendorBatch: (b) => request('/vendor/batches', { method: 'POST', body: b }),
  updateVendorBatch: (id, b) => request(`/vendor/batches/${id}`, { method: 'PUT', body: b }),
  deleteVendorBatch: (id) => request(`/vendor/batches/${id}`, { method: 'DELETE' }),
  // Candidates
  vendorCandidates: (params) => { const qs = params ? new URLSearchParams(params).toString() : ''; return request('/vendor/candidates' + (qs ? `?${qs}` : '')); },
  createVendorCandidate: (b) => request('/vendor/candidates', { method: 'POST', body: b }),
  updateVendorCandidate: (id, b) => request(`/vendor/candidates/${id}`, { method: 'PUT', body: b }),
  deleteVendorCandidate: (id) => request(`/vendor/candidates/${id}`, { method: 'DELETE' }),
  // Assessments
  vendorAssessments: () => request('/vendor/assessments'),
  createVendorAssessment: (b) => request('/vendor/assessments', { method: 'POST', body: b }),
  updateVendorAssessment: (id, b) => request(`/vendor/assessments/${id}`, { method: 'PUT', body: b }),
  deleteVendorAssessment: (id) => request(`/vendor/assessments/${id}`, { method: 'DELETE' }),
  // Documents
  vendorDocuments: () => request('/vendor/documents'),
  uploadVendorDocument: (b) => request('/vendor/documents', { method: 'POST', body: b }),
  deleteVendorDocument: (id) => request(`/vendor/documents/${id}`, { method: 'DELETE' }),
  // Grievances
  vendorGrievances: () => request('/vendor/grievances'),
  createVendorGrievance: (b) => request('/vendor/grievances', { method: 'POST', body: b }),
  updateVendorGrievance: (id, b) => request(`/vendor/grievances/${id}`, { method: 'PUT', body: b }),

  // ── State Government Portal ──
  sgStats: () => request('/state-govt/stats'),
  sgSchemes: () => request('/state-govt/schemes'),
  sgMis: () => request('/state-govt/mis'),
  sgProfile: () => request('/state-govt/profile'),
  // Training Partners
  sgTPs: (p = {}) => { const qs = new URLSearchParams(p).toString(); return request('/state-govt/training-partners' + (qs ? `?${qs}` : '')); },
  sgCreateTP: (b) => request('/state-govt/training-partners', { method: 'POST', body: b }),
  sgUpdateTP: (id, b) => request(`/state-govt/training-partners/${id}`, { method: 'PUT', body: b }),
  // Candidates
  sgCandidates: (p = {}) => { const qs = new URLSearchParams(p).toString(); return request('/state-govt/candidates' + (qs ? `?${qs}` : '')); },
  sgCreateCandidate: (b) => request('/state-govt/candidates', { method: 'POST', body: b }),
  sgUpdateCandidate: (id, b) => request(`/state-govt/candidates/${id}`, { method: 'PUT', body: b }),
  // Targets
  sgTargets: (p = {}) => { const qs = new URLSearchParams(p).toString(); return request('/state-govt/targets' + (qs ? `?${qs}` : '')); },
  sgCreateTarget: (b) => request('/state-govt/targets', { method: 'POST', body: b }),
  sgUpdateAchievement: (id, b) => request(`/state-govt/targets/${id}/achievement`, { method: 'PUT', body: b }),
  // Disbursements
  sgDisbursements: () => request('/state-govt/disbursements'),
  sgCreateDisbursement: (b) => request('/state-govt/disbursements', { method: 'POST', body: b }),
  sgUpdateDisbStatus: (id, status) => request(`/state-govt/disbursements/${id}/status`, { method: 'PUT', body: { status } }),
  // Grievances
  sgGrievances: (p = {}) => { const qs = new URLSearchParams(p).toString(); return request('/state-govt/grievances' + (qs ? `?${qs}` : '')); },
  sgCreateGrievance: (b) => request('/state-govt/grievances', { method: 'POST', body: b }),
  sgUpdateGrievance: (id, b) => request(`/state-govt/grievances/${id}`, { method: 'PUT', body: b }),
  // Certificates
  sgCertificates: (p = {}) => { const qs = new URLSearchParams(p).toString(); return request('/state-govt/certificates' + (qs ? `?${qs}` : '')); },
  sgVerifyCert: (cert_no) => request('/state-govt/certificates/verify', { method: 'POST', body: { cert_no } }),
  // Notifications
  sgNotifications: () => request('/state-govt/notifications'),
  sgMarkNotifRead: () => request('/state-govt/notifications/mark-read', { method: 'PUT' }),
};

export function setToken(token) {
  if (token) localStorage.setItem('snj_token', token);
  else localStorage.removeItem('snj_token');
}
export function hasToken() {
  return !!getToken();
}
