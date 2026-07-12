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
  checkDuplicate: (field, value) => request('/auth/check-duplicate', { method: 'POST', body: { field, value }, auth: false }),
  sendOtp: (type, value) => request('/auth/send-otp', { method: 'POST', body: { type, value }, auth: false }),
  verifyOtp: (type, value, otp) => request('/auth/verify-otp', { method: 'POST', body: { type, value, otp }, auth: false }),
  me: () => request('/users/me'),
  updateMe: (payload) => request('/users/me', { method: 'PUT', body: payload }),
  changePassword: (current_password, new_password) => request('/users/me/change-password', { method: 'POST', body: { current_password, new_password } }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload }),
  candidates: () => request('/users/candidates'),
  allEnrolments: () => request('/users/enrolments'),
  allAssessments: () => request('/users/assessments'),
  usersByRole: (role) => request(`/users/by-role/${role}`),
  auditLogs: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request('/users/audit-logs' + (qs ? `?${qs}` : '')); },
  adminSessions: () => request('/users/admin/sessions'),
  getRolePermissions: () => request('/users/admin/role-permissions'),
  saveRolePermissions: (role, perms) => request(`/users/admin/role-permissions/${role}`, { method: 'PUT', body: perms }),
  allUsers: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request('/users/all' + (qs ? `?${qs}` : '')); },
  setUserStatus: (id, is_active) => request(`/users/${id}/status`, { method: 'PUT', body: { is_active } }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

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
  enroll: (id, body) => request(`/courses/${id}/enroll`, { method: 'POST', body: body || {} }),
  myEnrollments: () => request('/courses/mine/enrollments'),
  myCertificates: () => request('/courses/mine/certificates'),
  myGrievances: () => request('/courses/mine/grievances'),
  submitGrievance: (b) => request('/courses/mine/grievances', { method: 'POST', body: b }),
  recommendations: () => request('/courses/recommendations/for-me'),

  stats: () => request('/stats/summary'),
  dashboardStats: () => request('/stats/summary'), // alias kept for portal components

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
  vendorOnboardingCentres: () => request('/vendor/centres/onboarding'),
  lookupTrainerByEmail: (email) => request(`/vendor/trainers/lookup?email=${encodeURIComponent(email)}`),
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

  // ── CSR Organization Portal ──
  csrStats: () => request('/csr/stats'),
  csrProjects: () => request('/csr/projects'),
  csrCreateProject: (b) => request('/csr/projects', { method: 'POST', body: b }),
  csrUpdateProject: (id, b) => request(`/csr/projects/${id}`, { method: 'PUT', body: b }),
  csrDeleteProject: (id) => request(`/csr/projects/${id}`, { method: 'DELETE' }),
  csrBeneficiaries: (p = {}) => { const qs = new URLSearchParams(p).toString(); return request('/csr/beneficiaries' + (qs ? `?${qs}` : '')); },
  csrCreateBeneficiary: (b) => request('/csr/beneficiaries', { method: 'POST', body: b }),
  csrUpdateBeneficiary: (id, b) => request(`/csr/beneficiaries/${id}`, { method: 'PUT', body: b }),
  csrDisbursements: () => request('/csr/disbursements'),
  csrCreateDisbursement: (b) => request('/csr/disbursements', { method: 'POST', body: b }),
  csrUpdateDisbursementStatus: (id, status) => request(`/csr/disbursements/${id}/status`, { method: 'PUT', body: { status } }),
  csrTrainingPartners: () => request('/csr/training-partners'),
  csrCreateTP: (b) => request('/csr/training-partners', { method: 'POST', body: b }),
  csrUpdateTP: (id, b) => request(`/csr/training-partners/${id}`, { method: 'PUT', body: b }),
  csrDeleteTP: (id) => request(`/csr/training-partners/${id}`, { method: 'DELETE' }),

  // ── Batches (Trainer Portal) ──
  myBatches: () => request('/batches/mine'),
  allBatches: () => request('/batches'),
  createBatch: (b) => request('/batches', { method: 'POST', body: b }),
  updateBatch: (id, b) => request(`/batches/${id}`, { method: 'PUT', body: b }),
  deleteBatch: (id) => request(`/batches/${id}`, { method: 'DELETE' }),
  batchLearners: (id) => request(`/batches/${id}/learners`),
  enrollLearner: (batchId, body) => request(`/batches/${batchId}/learners`, { method: 'POST', body }),
  myAssessments: () => request('/batches/my-assessments'),
  batchAttendance: (id, date) => request(`/batches/${id}/attendance` + (date ? `?date=${date}` : '')),
  markAttendance: (id, date, records) => request(`/batches/${id}/attendance`, { method: 'POST', body: { date, records } }),

  // ── Placements (Placement Partner Portal) ──
  myPlacements: () => request('/placements/mine'),
  placementSummary: () => request('/placements/summary'),
  createPlacement: (b) => request('/placements', { method: 'POST', body: b }),
  updatePlacement: (id, b) => request(`/placements/${id}`, { method: 'PUT', body: b }),
  deletePlacement: (id) => request(`/placements/${id}`, { method: 'DELETE' }),

  // ── Trainer Profile ──
  trainerQualifications: () => request('/users/me/qualifications'),
  addTrainerQualification: (b) => request('/users/me/qualifications', { method: 'POST', body: b }),
  deleteTrainerQualification: (id) => request(`/users/me/qualifications/${id}`, { method: 'DELETE' }),
  trainerExperience: () => request('/users/me/experience'),
  addTrainerExperience: (b) => request('/users/me/experience', { method: 'POST', body: b }),
  deleteTrainerExperience: (id) => request(`/users/me/experience/${id}`, { method: 'DELETE' }),
  trainerSkills: () => request('/users/me/skills'),
  addTrainerSkill: (b) => request('/users/me/skills', { method: 'POST', body: b }),
  deleteTrainerSkill: (id) => request(`/users/me/skills/${id}`, { method: 'DELETE' }),

  // ── Trainer Features ──
  trainerCertifications: () => request('/trainer/certifications'),
  addTrainerCertification: (b) => request('/trainer/certifications', { method: 'POST', body: b }),
  deleteTrainerCertification: (id) => request(`/trainer/certifications/${id}`, { method: 'DELETE' }),

  trainerDocuments: () => request('/trainer/documents'),
  addTrainerDocument: (formData) => {
    const token = localStorage.getItem('snj_token');
    return fetch('/api/trainer/documents', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Upload failed (${r.status})`);
      return data;
    });
  },
  downloadTrainerDocument: (id) => `/api/trainer/documents/${id}/download`,
  updateTrainerDocument: (id, b) => request(`/trainer/documents/${id}`, { method: 'PUT', body: b }),
  deleteTrainerDocument: (id) => request(`/trainer/documents/${id}`, { method: 'DELETE' }),

  trainerSessions: () => request('/trainer/sessions'),
  addTrainerSession: (b) => request('/trainer/sessions', { method: 'POST', body: b }),
  updateTrainerSession: (id, b) => request(`/trainer/sessions/${id}`, { method: 'PUT', body: b }),
  deleteTrainerSession: (id) => request(`/trainer/sessions/${id}`, { method: 'DELETE' }),

  trainerAssessments: () => request('/trainer/assessments'),
  addTrainerAssessment: (b) => request('/trainer/assessments', { method: 'POST', body: b }),
  updateTrainerAssessment: (id, b) => request(`/trainer/assessments/${id}`, { method: 'PUT', body: b }),
  deleteTrainerAssessment: (id) => request(`/trainer/assessments/${id}`, { method: 'DELETE' }),

  trainerMockTests: () => request('/trainer/mock-tests'),
  addTrainerMockTest: (b) => request('/trainer/mock-tests', { method: 'POST', body: b }),
  deleteTrainerMockTest: (id) => request(`/trainer/mock-tests/${id}`, { method: 'DELETE' }),

  trainerContent: () => request('/trainer/content'),
  addTrainerContent: (b) => request('/trainer/content', { method: 'POST', body: b }),
  deleteTrainerContent: (id) => request(`/trainer/content/${id}`, { method: 'DELETE' }),

  trainerTickets: () => request('/trainer/tickets'),
  addTrainerTicket: (b) => request('/trainer/tickets', { method: 'POST', body: b }),
  updateTrainerTicket: (id, b) => request(`/trainer/tickets/${id}`, { method: 'PUT', body: b }),

  trainerGrievances: () => request('/trainer/grievances'),
  addTrainerGrievance: (b) => request('/trainer/grievances', { method: 'POST', body: b }),

  trainerReportAttendance: () => request('/trainer/reports/attendance'),
  trainerReportBatch: () => request('/trainer/reports/batch'),
  trainerReportDropout: () => request('/trainer/reports/dropout'),
  trainerReportAssessment: () => request('/trainer/reports/assessment'),
  trainerReportPlacement: () => request('/trainer/reports/placement'),
  trainerCertEligible: () => request('/trainer/cert-eligible'),
  trainerNotifications: () => request('/trainer/notifications'),
  trainerVerifyCert: (cert_no) => request(`/trainer/cert-verify?cert_no=${encodeURIComponent(cert_no)}`),
  trainerReportScheme: () => request('/trainer/reports/scheme'),

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
  // Collaboration
  collabConsortium: () => request('/collaboration/consortium'),
  collabInvitations: () => request('/collaboration/invitations'),
  collabSendInvitation: (payload) => request('/collaboration/invitations', { method: 'POST', body: payload }),
  collabUpdateInvitation: (id, status) => request(`/collaboration/invitations/${id}`, { method: 'PATCH', body: { status } }),
  collabPartnershipRequests: () => request('/collaboration/partnership-requests'),
  collabPostPartnershipRequest: (payload) => request('/collaboration/partnership-requests', { method: 'POST', body: payload }),
  collabClosePartnershipRequest: (id) => request(`/collaboration/partnership-requests/${id}/close`, { method: 'PATCH' }),
  collabRespondToRequest: (id, message) => request(`/collaboration/partnership-requests/${id}/respond`, { method: 'POST', body: { message } }),
  collabRequestResponses: (id) => request(`/collaboration/partnership-requests/${id}/responses`),
  collabResources: (listing_type) => request(`/collaboration/resources${listing_type ? `?listing_type=${listing_type}` : ''}`),
  collabListResource: (payload) => request('/collaboration/resources', { method: 'POST', body: payload }),
  collabDeleteResource: (id) => request(`/collaboration/resources/${id}`, { method: 'DELETE' }),
  collabRequestResource: (id, payload) => request(`/collaboration/resources/${id}/request`, { method: 'POST', body: payload }),
};

export function setToken(token) {
  if (token) localStorage.setItem('snj_token', token);
  else localStorage.removeItem('snj_token');
}
export function hasToken() {
  return !!getToken();
}
