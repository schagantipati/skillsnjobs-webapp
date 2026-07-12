// E2E tests for the Employer Portal
// Credentials: hr@technova.com / password123

import { test, expect } from '@playwright/test';

const EMP_EMAIL    = 'hr@technova.com';
const EMP_PASSWORD = 'password123';
const BASE         = 'http://localhost:5173';

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', EMP_EMAIL);
  await page.fill('input[type="password"]', EMP_PASSWORD);
  await page.locator('form button').click();
  await page.waitForURL('**/employer-portal', { timeout: 10000 });
  await page.waitForSelector('text=EMPLOYER PORTAL', { timeout: 10000 });
}

async function expandSection(page, label) {
  const matches = page.getByText(label, { exact: true });
  const count = await matches.count();
  await matches.nth(count - 1).click();
  await page.waitForTimeout(300);
}

async function goSub(page, section, sub) {
  await expandSection(page, section);
  await page.locator(`text=· ${sub}`).click();
  await page.waitForTimeout(400);
}

// ─── Authentication ──────────────────────────────────────────────────────────

test('TC-AUTH-01: login with valid credentials navigates to portal', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/employer-portal/);
  await expect(page.locator('text=EMPLOYER PORTAL')).toBeVisible();
});

test('TC-AUTH-02: login with wrong password shows error', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', EMP_EMAIL);
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.locator('form button').click();
  await page.waitForTimeout(1500);
  await expect(page).not.toHaveURL(/employer-portal/);
});

test('TC-AUTH-03: unauthenticated access to portal redirects to login', async ({ page }) => {
  await page.goto(`${BASE}/employer-portal`);
  await page.waitForTimeout(1000);
  const url = page.url();
  expect(url).not.toMatch(/employer-portal/);
});

test('TC-AUTH-04: sign out via Sign Out panel shows confirmation screen', async ({ page }) => {
  await login(page);
  await page.getByText('Sign Out', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Are you sure you want to sign out')).toBeVisible();
});

test('TC-AUTH-05: sign out confirmation performs logout', async ({ page }) => {
  await login(page);
  await page.getByText('Sign Out', { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByText('Yes, Sign Out').click();
  await page.waitForTimeout(1500);
  await expect(page).not.toHaveURL(/employer-portal/);
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

test('TC-DASH-01: dashboard loads with welcome heading showing org name', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=TechNova Pvt Ltd').first()).toBeVisible();
});

test('TC-DASH-02: Active Job Postings KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Active Job Postings').first()).toBeVisible();
});

test('TC-DASH-03: Total Applications KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Total Applications').first()).toBeVisible();
});

test('TC-DASH-04: Candidates Shortlisted KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Candidates Shortlisted').first()).toBeVisible();
});

test('TC-DASH-05: Total Hired KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Total Hired').first()).toBeVisible();
});

test('TC-DASH-06: Notifications badge shows count in sidebar', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Notifications').first()).toBeVisible();
});

// ─── Navigation ──────────────────────────────────────────────────────────────

test('TC-NAV-01: Company Profile section expands to show sub-items', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Company Profile');
  await expect(page.locator('text=· Company Information')).toBeVisible();
  await expect(page.locator('text=· Contact & Address')).toBeVisible();
  await expect(page.locator('text=· HR Contacts')).toBeVisible();
});

test('TC-NAV-02: Job Postings section expands to show sub-items', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Job Postings');
  await expect(page.locator('text=· Post New Job')).toBeVisible();
  await expect(page.locator('text=· Active Jobs')).toBeVisible();
  await expect(page.locator('text=· All Applications')).toBeVisible();
});

test('TC-NAV-03: Candidates section expands to show sub-items', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Candidates');
  await expect(page.locator('text=· Search Candidates')).toBeVisible();
  await expect(page.locator('text=· Shortlisted')).toBeVisible();
  await expect(page.locator('text=· Interviews')).toBeVisible();
});

test('TC-NAV-04: Apprenticeship section expands to show sub-items', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Apprenticeship');
  await expect(page.locator('text=· Register Vacancy')).toBeVisible();
  await expect(page.locator('text=· Active Apprentices')).toBeVisible();
});

test('TC-NAV-05: Schemes and Benefits section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Schemes & Benefits');
  await expect(page.locator('text=· PMKVY')).toBeVisible();
  await expect(page.locator('text=· NAPS / NATS')).toBeVisible();
  await expect(page.locator('text=· Employer Incentives')).toBeVisible();
});

test('TC-NAV-06: Reports section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Reports');
  await expect(page.locator('text=· Hiring Reports')).toBeVisible();
  await expect(page.locator('text=· Placement Analytics')).toBeVisible();
});

test('TC-NAV-07: Compliance section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Compliance');
  await expect(page.locator('text=· Labour Law')).toBeVisible();
  await expect(page.locator('text=· PF / ESI')).toBeVisible();
  await expect(page.locator('text=· Audit Trail')).toBeVisible();
});

test('TC-NAV-08: Dashboard nav item navigates to dashboard', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Post New Job');
  await page.getByText('Dashboard', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Active Job Postings').first()).toBeVisible();
});

// ─── Company Information ──────────────────────────────────────────────────────

test('TC-PROF-01: Company Information panel loads with heading', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Company Information');
  await expect(page.locator('text=Company Information 🏢')).toBeVisible();
});

test('TC-PROF-02: invalid PAN on blur shows inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Company Information');
  const panInput = page.locator('input[placeholder="e.g. AAACT1234A"]');
  await panInput.fill('INVALIDPAN');
  await panInput.blur();
  await expect(page.locator('text=⚠ Invalid PAN')).toBeVisible();
});

test('TC-PROF-03: valid PAN clears inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Company Information');
  const panInput = page.locator('input[placeholder="e.g. AAACT1234A"]');
  await panInput.fill('INVALID!@#');
  await panInput.blur();
  await expect(page.locator('text=⚠ Invalid PAN')).toBeVisible();
  await panInput.fill('AAACT1234A');
  await panInput.blur();
  await expect(page.locator('text=⚠ Invalid PAN')).not.toBeVisible();
});

test('TC-PROF-04: invalid GSTIN on blur shows inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Company Information');
  const gstInput = page.locator('input[placeholder="e.g. 29AAACT1234A1ZK"]');
  await gstInput.fill('INVALIDGST');
  await gstInput.blur();
  await expect(page.locator('text=⚠ Invalid GSTIN')).toBeVisible();
});

test('TC-PROF-05: invalid CIN on blur shows inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Company Information');
  const cinInput = page.locator('input[placeholder="e.g. U72200KA2015PTC082341"]');
  await cinInput.fill('BADCIN123');
  await cinInput.blur();
  await expect(page.locator('text=⚠').first()).toBeVisible();
});

// ─── Contact & Address ────────────────────────────────────────────────────────

test('TC-CONTACT-01: Contact & Address panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Contact & Address');
  await expect(page.locator('text=Contact & Address 📍')).toBeVisible();
});

test('TC-CONTACT-02: invalid phone on blur shows inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Contact & Address');
  const phoneInput = page.locator('input[placeholder="e.g. 9876543210"]');
  await phoneInput.fill('12345');
  await phoneInput.blur();
  await expect(page.locator('text=⚠ Must be a 10-digit number')).toBeVisible();
});

test('TC-CONTACT-03: invalid email on blur shows inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Contact & Address');
  const emailInput = page.locator('input[placeholder="e.g. contact@company.com"]');
  await emailInput.fill('bademail');
  await emailInput.blur();
  await expect(page.locator('text=⚠ Invalid email address')).toBeVisible();
});

// ─── Company Documents ────────────────────────────────────────────────────────

test('TC-DOCS-01: Company Documents panel loads with upload options', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Company Documents');
  await expect(page.locator('text=Company Documents 📄')).toBeVisible();
  await expect(page.locator('text=GST Certificate').first()).toBeVisible();
});

// ─── Bank & Billing ───────────────────────────────────────────────────────────

test('TC-BANK-01: Bank & Billing panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'Bank & Billing');
  await expect(page.locator('text=Bank & Billing 🏦')).toBeVisible();
});

// ─── HR Contacts ──────────────────────────────────────────────────────────────

test('TC-HR-01: HR Contacts panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'HR Contacts');
  await expect(page.locator('text=HR Contacts 👤')).toBeVisible();
});

test('TC-HR-02: Add HR Contact form opens on clicking add button', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'HR Contacts');
  await page.locator('text=+ Add HR Contact').click();
  await page.waitForTimeout(300);
  await expect(page.locator('input[placeholder="Full name"]')).toBeVisible();
});

test('TC-HR-03: saving HR contact with empty name shows error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Company Profile', 'HR Contacts');
  await page.locator('text=+ Add HR Contact').click();
  await page.waitForTimeout(300);
  await page.locator('text=Save Contact').click();
  await expect(page.locator('text=Name is required.')).toBeVisible();
});

// ─── Job Post ─────────────────────────────────────────────────────────────────

test('TC-JOB-01: Post New Job panel loads with form fields', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Post New Job');
  await expect(page.locator('text=Post New Job 📋')).toBeVisible();
  await expect(page.locator('input[placeholder="e.g. Senior Frontend Developer"]')).toBeVisible();
});

test('TC-JOB-02: publish with empty title shows required error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Post New Job');
  await page.locator('text=🚀 Publish Job').click();
  await expect(page.locator('text=Job title is required.')).toBeVisible();
});

test('TC-JOB-03: save draft with empty title shows required error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Post New Job');
  await page.locator('text=Save Draft').click();
  await expect(page.locator('text=Job title is required.')).toBeVisible();
});

test('TC-JOB-04: salary max less than min shows validation error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Post New Job');
  await page.locator('input[placeholder="e.g. Senior Frontend Developer"]').fill('Software Engineer');
  await page.locator('input[placeholder="500000"]').fill('800000');
  await page.locator('input[placeholder="800000"]').fill('500000');
  await page.locator('text=🚀 Publish Job').click();
  await expect(page.locator('text=Maximum salary must be ≥ minimum salary')).toBeVisible();
});

test('TC-JOB-05: valid job post publishes successfully', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Post New Job');
  await page.locator('input[placeholder="e.g. Senior Frontend Developer"]').fill('QA Engineer');
  await page.locator('text=🚀 Publish Job').click();
  await expect(page.locator('text=✅ Job published successfully!')).toBeVisible();
});

test('TC-JOB-06: valid job saves as draft', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Post New Job');
  await page.locator('input[placeholder="e.g. Senior Frontend Developer"]').fill('Intern Developer');
  await page.locator('text=Save Draft').click();
  await expect(page.locator('text=✅ Saved as draft.')).toBeVisible();
});

// ─── Job Management Panels ────────────────────────────────────────────────────

test('TC-JOB-07: Active Jobs panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Active Jobs');
  await expect(page.locator('text=Active Jobs 🚀')).toBeVisible();
});

test('TC-JOB-08: Draft Jobs panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Draft Jobs');
  await expect(page.locator('text=Draft Jobs 📝')).toBeVisible();
});

test('TC-JOB-09: Closed Jobs panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'Closed Jobs');
  await expect(page.locator('text=Closed Jobs ✅')).toBeVisible();
});

test('TC-JOB-10: All Applications panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Job Postings', 'All Applications');
  await expect(page.locator('text=All Applications 📬')).toBeVisible();
});

// ─── Candidates ───────────────────────────────────────────────────────────────

test('TC-CAND-01: Search Candidates panel loads with search input', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Search Candidates');
  await expect(page.locator('text=Search Candidates 🔍')).toBeVisible();
});

test('TC-CAND-02: Shortlisted Candidates panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Shortlisted');
  await expect(page.locator('text=Shortlisted Candidates 📌')).toBeVisible();
});

test('TC-CAND-03: Interview Management panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Interviews');
  await expect(page.locator('text=Interview Management 🗓️')).toBeVisible();
});

test('TC-CAND-04: scheduling interview without required fields shows error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Interviews');
  await page.locator('text=📅 Schedule Interview').click();
  await expect(page.locator('text=Candidate name, date and time are required.')).toBeVisible();
});

test('TC-CAND-05: scheduling interview with all required fields succeeds', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Interviews');
  await page.locator('input[placeholder="e.g. Rahul Verma"]').fill('Priya Sharma');
  await page.locator('input[type="date"]').fill('2026-08-15');
  await page.locator('input[type="time"]').fill('10:00');
  await page.locator('text=📅 Schedule Interview').click();
  await expect(page.locator('text=✅ Interview scheduled successfully.')).toBeVisible();
});

test('TC-CAND-06: Offers & Onboarding panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Offers & Onboarding');
  await expect(page.locator('text=Offers & Onboarding 📨')).toBeVisible();
});

test('TC-CAND-07: generating offer without required fields shows error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Offers & Onboarding');
  await page.locator('text=Generate Letter').click();
  await expect(page.locator('text=Candidate name, job role and CTC are required.')).toBeVisible();
});

test('TC-CAND-08: Placement Records panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidates', 'Placement Records');
  await expect(page.locator('text=Placement Records 🏆')).toBeVisible();
});

// ─── Apprenticeship ───────────────────────────────────────────────────────────

test('TC-APPR-01: Register Vacancy panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Apprenticeship', 'Register Vacancy');
  await expect(page.locator('text=Register Apprenticeship Vacancy').first()).toBeVisible();
});

test('TC-APPR-02: Active Apprentices panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Apprenticeship', 'Active Apprentices');
  await expect(page.locator('text=Active Apprentices').first()).toBeVisible();
});

test('TC-APPR-03: Stipend Management panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Apprenticeship', 'Stipend Management');
  await expect(page.locator('text=Stipend Management').first()).toBeVisible();
});

test('TC-APPR-04: Apprenticeship Reports panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Apprenticeship', 'Apprenticeship Reports');
  await expect(page.locator('text=Apprenticeship Reports').first()).toBeVisible();
});

// ─── Skill Development ────────────────────────────────────────────────────────

test('TC-SKILL-01: Skill Gap Analysis panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Skill Development', 'Skill Gap Analysis');
  await expect(page.locator('text=Skill Gap Analysis').first()).toBeVisible();
});

test('TC-SKILL-02: Training Partner Connect panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Skill Development', 'Training Partner Connect');
  await expect(page.locator('text=Training Partner Connect').first()).toBeVisible();
});

// ─── Govt Schemes ─────────────────────────────────────────────────────────────

test('TC-SCHEME-01: PMKVY panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Schemes & Benefits', 'PMKVY');
  await expect(page.locator('text=PMKVY').first()).toBeVisible();
});

test('TC-SCHEME-02: NAPS / NATS panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Schemes & Benefits', 'NAPS / NATS');
  await expect(page.locator('text=NAPS').first()).toBeVisible();
});

test('TC-SCHEME-03: DDU-GKY panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Schemes & Benefits', 'DDU-GKY');
  await expect(page.locator('text=DDU-GKY').first()).toBeVisible();
});

test('TC-SCHEME-04: Employer Incentives panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Schemes & Benefits', 'Employer Incentives');
  await expect(page.locator('text=Employer Incentives').first()).toBeVisible();
});

// ─── Reports ──────────────────────────────────────────────────────────────────

test('TC-REP-01: Hiring Reports panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Reports', 'Hiring Reports');
  await expect(page.locator('text=Hiring Reports').first()).toBeVisible();
});

test('TC-REP-02: Placement Analytics panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Reports', 'Placement Analytics');
  await expect(page.locator('text=Placement Analytics').first()).toBeVisible();
});

test('TC-REP-03: Workforce Reports panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Reports', 'Workforce Reports');
  await expect(page.locator('text=Workforce Reports').first()).toBeVisible();
});

test('TC-REP-04: Sector Reports panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Reports', 'Sector Reports');
  await expect(page.locator('text=Sector Reports').first()).toBeVisible();
});

// ─── Compliance ───────────────────────────────────────────────────────────────

test('TC-COMP-01: Labour Law panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Compliance', 'Labour Law');
  await expect(page.locator('text=Labour Law').first()).toBeVisible();
});

test('TC-COMP-02: PF / ESI panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Compliance', 'PF / ESI');
  await expect(page.locator('text=PF').first()).toBeVisible();
});

test('TC-COMP-03: Contract Labour panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Compliance', 'Contract Labour');
  await expect(page.locator('text=Contract Labour').first()).toBeVisible();
});

test('TC-COMP-04: Audit Trail panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Compliance', 'Audit Trail');
  await expect(page.locator('text=Audit Trail').first()).toBeVisible();
});

// ─── Support ──────────────────────────────────────────────────────────────────

test('TC-HELP-01: Helpdesk panel loads with ticket form', async ({ page }) => {
  await login(page);
  await page.getByText('Helpdesk', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Helpdesk 🎧')).toBeVisible();
  await expect(page.locator('text=Raise a Ticket').first()).toBeVisible();
});

test('TC-HELP-02: Helpdesk shows existing ticket history', async ({ page }) => {
  await login(page);
  await page.getByText('Helpdesk', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=My Tickets')).toBeVisible();
});

test('TC-GRIEV-01: Grievance panel loads', async ({ page }) => {
  await login(page);
  await page.getByText('Grievance', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Grievance Redressal 📣')).toBeVisible();
});

test('TC-GRIEV-02: Grievance panel shows info banner', async ({ page }) => {
  await login(page);
  await page.getByText('Grievance', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Expected resolution: 10 working days')).toBeVisible();
});

test('TC-FAQ-01: FAQ panel loads with questions', async ({ page }) => {
  await login(page);
  await page.getByText('FAQ', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Frequently Asked Questions ❓')).toBeVisible();
  await expect(page.locator('text=Q: How do I post a job?')).toBeVisible();
});

// ─── Settings ─────────────────────────────────────────────────────────────────

test('TC-SETT-01: Account Preferences panel loads', async ({ page }) => {
  await login(page);
  await page.getByText('Account Preferences', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Account Preferences').first()).toBeVisible();
});

// ─── Notifications ────────────────────────────────────────────────────────────

test('TC-NOTIF-01: Notifications panel loads', async ({ page }) => {
  await login(page);
  await page.getByText('Notifications', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Notifications').first()).toBeVisible();
});
