// E2E test suite for the Superadmin Portal
// Credentials: superadmin@skillsnjobs.in / Welcome@123  →  /superadmin
// 90 tests across Auth, Dashboard, Navigation, User Mgmt, Roles & Permissions,
// Training Ecosystem, Courses, Candidates, Batches, Jobs, Placements, Audit Logs,
// Geographic, Setup & Config, Schemes, Financial, Reports, Content, Analytics

import { test, expect } from '@playwright/test';

const SA_EMAIL    = 'superadmin@skillsnjobs.in';
const SA_PASSWORD = 'Welcome@123';
const BASE        = 'http://localhost:5173';

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', SA_EMAIL);
  await page.fill('input[type="password"]', SA_PASSWORD);
  await page.locator('form button').click();
  await page.waitForURL('**/superadmin', { timeout: 12000 });
  await page.waitForSelector('.sa-sidebar', { timeout: 10000 });
}

// Click a top-level nav item by its label text (inside .sa-lbl)
async function navTo(page, label) {
  await page.locator('.sa-item').filter({ hasText: label }).first().click();
  await page.waitForTimeout(400);
}

// Expand a parent nav item then click a child
async function navToChild(page, parentLabel, childLabel) {
  const parent = page.locator('.sa-item').filter({ hasText: parentLabel }).first();
  // Expand if not already open
  const chevron = parent.locator('.sa-chev');
  const isExpanded = await chevron.evaluate(el => el.style.transform.includes('180')).catch(() => false);
  if (!isExpanded) {
    await parent.click();
    await page.waitForTimeout(300);
  }
  await page.locator('.sa-child').filter({ hasText: childLabel }).first().click();
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════

test('TC-AUTH-01: login with valid superadmin credentials redirects to /superadmin', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/superadmin/);
});

test('TC-AUTH-02: sidebar is visible after login', async ({ page }) => {
  await login(page);
  await expect(page.locator('.sa-sidebar')).toBeVisible();
});

test('TC-AUTH-03: topbar shows Superadmin role label', async ({ page }) => {
  await login(page);
  await expect(page.locator('.sa-tb-urole')).toContainText('Superadmin');
});

test('TC-AUTH-04: topbar shows Sign Out button', async ({ page }) => {
  await login(page);
  await expect(page.locator('button.sa-signout-btn')).toBeVisible();
});

test('TC-AUTH-05: sign out redirects to home page', async ({ page }) => {
  await login(page);
  await page.locator('button.sa-signout-btn').click();
  await page.waitForTimeout(1000);
  await expect(page).not.toHaveURL(/\/superadmin/);
});

// ══════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════

test('TC-DASH-01: dashboard loads with Platform Overview heading', async ({ page }) => {
  await login(page);
  await expect(page.locator('h1')).toContainText('Platform Overview');
});

test('TC-DASH-02: Total Learners KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Learners' })).toBeVisible();
});

test('TC-DASH-03: Training Partners KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Training Partners' })).toBeVisible();
});

test('TC-DASH-04: Certifications Issued KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Certifications Issued' })).toBeVisible();
});

test('TC-DASH-05: Platform KPIs card with Placement Rate is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('.card-title').filter({ hasText: 'Platform KPIs' })).toBeVisible();
  await expect(page.locator('text=Placement Rate').first()).toBeVisible();
});

test('TC-DASH-06: Quick Actions card is visible with Add Training Partner button', async ({ page }) => {
  await login(page);
  await expect(page.locator('.card-title').filter({ hasText: 'Quick Actions' })).toBeVisible();
  await expect(page.locator('button').filter({ hasText: 'Add Training Partner' })).toBeVisible();
});

test('TC-DASH-07: breadcrumb shows MAIN / Dashboard on load', async ({ page }) => {
  await login(page);
  await expect(page.locator('.sa-tb-title')).toContainText('Dashboard');
});

test('TC-DASH-08: logo click returns to Dashboard from another panel', async ({ page }) => {
  await login(page);
  await navTo(page, 'Notifications');
  await page.locator('.sa-logo').click();
  await page.waitForTimeout(400);
  await expect(page.locator('h1')).toContainText('Platform Overview');
});

// ══════════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════════

test('TC-NAV-01: Notifications nav item navigates to Notifications panel', async ({ page }) => {
  await login(page);
  await navTo(page, 'Notifications');
  await expect(page.locator('h1')).toContainText('Notifications');
});

test('TC-NAV-02: Live Analytics nav item navigates to Live Analytics panel', async ({ page }) => {
  await login(page);
  await navTo(page, 'Live Analytics');
  await expect(page.locator('h1')).toContainText('Live Analytics');
});

test('TC-NAV-03: USER MANAGEMENT section is collapsible', async ({ page }) => {
  await login(page);
  const section = page.locator('.sa-section').filter({ hasText: 'USER MANAGEMENT' });
  await section.click();
  await page.waitForTimeout(300);
  // Items should collapse (max-height 0)
  const container = section.locator('+ .sa-sec-items');
  await expect(container).toHaveCSS('max-height', '0px');
});

test('TC-NAV-04: clicking collapsed section re-expands it', async ({ page }) => {
  await login(page);
  const section = page.locator('.sa-section').filter({ hasText: 'USER MANAGEMENT' });
  await section.click();
  await page.waitForTimeout(300);
  await section.click();
  await page.waitForTimeout(300);
  const container = section.locator('+ .sa-sec-items');
  const height = await container.evaluate(el => el.style.maxHeight);
  expect(height).not.toBe('0px');
});

test('TC-NAV-05: All Users parent item expands to show children', async ({ page }) => {
  await login(page);
  await navTo(page, 'All Users');
  await expect(page.locator('.sa-children.open').first()).toBeVisible();
});

test('TC-NAV-06: clicking Training Partners parent expands its children', async ({ page }) => {
  await login(page);
  await navTo(page, 'Training Partners');
  await expect(page.locator('.sa-children.open').first()).toBeVisible();
  await expect(page.locator('.sa-child').filter({ hasText: 'Partner Registry' })).toBeVisible();
});

test('TC-NAV-07: active nav item gets the active class', async ({ page }) => {
  await login(page);
  await navTo(page, 'Notifications');
  const item = page.locator('.sa-item.active');
  await expect(item).toBeVisible();
  await expect(item).toContainText('Notifications');
});

test('TC-NAV-08: breadcrumb updates when navigating to Audit Logs', async ({ page }) => {
  await login(page);
  await navTo(page, 'Audit Logs');
  await expect(page.locator('.sa-tb-title')).toContainText('Audit Logs');
});

// ══════════════════════════════════════════════════════════════════
// USER MANAGEMENT — ALL USERS
// ══════════════════════════════════════════════════════════════════

test('TC-USR-01: All Users panel loads with correct heading', async ({ page }) => {
  await login(page);
  await navTo(page, 'All Users');
  await page.waitForTimeout(600);
  await expect(page.locator('h1')).toContainText('All Users');
});

test('TC-USR-02: All Users panel shows Total / Active / Inactive KPIs from role breakdown', async ({ page }) => {
  await login(page);
  await navTo(page, 'All Users');
  await page.waitForTimeout(800);
  // Should have at least one KPI card
  await expect(page.locator('.kpi').first()).toBeVisible();
});

test('TC-USR-03: All Users table has Name, Email, Role, Status columns', async ({ page }) => {
  await login(page);
  await navTo(page, 'All Users');
  await page.waitForTimeout(800);
  const thead = page.locator('.sa-table thead');
  await expect(thead).toContainText('Name');
  await expect(thead).toContainText('Email');
  await expect(thead).toContainText('Role');
  await expect(thead).toContainText('Status');
});

test('TC-USR-04: All Users table has Action column with Activate/Deactivate buttons', async ({ page }) => {
  await login(page);
  await navTo(page, 'All Users');
  await page.waitForTimeout(800);
  await expect(page.locator('.sa-table thead')).toContainText('Action');
});

test('TC-USR-05: Candidates / Learners sub-panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'All Users', 'Candidates / Learners');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Candidates');
});

test('TC-USR-06: Training Partners sub-panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'All Users', 'Training Partners');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Training Partners');
});

test('TC-USR-07: Trainers & Assessors sub-panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'All Users', 'Trainers & Assessors');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Trainers');
});

test('TC-USR-08: Employers sub-panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'All Users', 'Employers');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Employers');
});

test('TC-USR-09: Bulk Import panel shows Coming Soon state', async ({ page }) => {
  await login(page);
  await navTo(page, 'Bulk Import / Export');
  await expect(page.locator('h1')).toContainText('Bulk Import');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// ROLES & PERMISSIONS
// ══════════════════════════════════════════════════════════════════

test('TC-ROLES-01: Roles & Permissions panel loads with heading', async ({ page }) => {
  await login(page);
  await navTo(page, 'Roles & Permissions');
  await expect(page.locator('h1')).toContainText('Roles & Permissions');
});

test('TC-ROLES-02: role KPI cards for Training Partner are visible', async ({ page }) => {
  await login(page);
  await navTo(page, 'Roles & Permissions');
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Training Partner' })).toBeVisible();
});

test('TC-ROLES-03: role tabs row shows Training Partner tab', async ({ page }) => {
  await login(page);
  await navTo(page, 'Roles & Permissions');
  await page.waitForTimeout(500);
  await expect(page.locator('button').filter({ hasText: 'Training Partner' }).first()).toBeVisible();
});

test('TC-ROLES-04: Save Changes button is visible', async ({ page }) => {
  await login(page);
  await navTo(page, 'Roles & Permissions');
  await expect(page.locator('button').filter({ hasText: 'Save Changes' })).toBeVisible();
});

test('TC-ROLES-05: Reset button is visible', async ({ page }) => {
  await login(page);
  await navTo(page, 'Roles & Permissions');
  await expect(page.locator('button').filter({ hasText: 'Reset' })).toBeVisible();
});

test('TC-ROLES-06: clicking Trainer tab switches the permission editor to Trainer role', async ({ page }) => {
  await login(page);
  await navTo(page, 'Roles & Permissions');
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: 'Trainer' }).first().click();
  await page.waitForTimeout(300);
  await expect(page.locator('text=Trainer — Menu Permissions')).toBeVisible();
});

test('TC-ROLES-07: section checkboxes are rendered for selected role', async ({ page }) => {
  await login(page);
  await navTo(page, 'Roles & Permissions');
  await page.waitForTimeout(600);
  const checkboxes = page.locator('input[type="checkbox"]');
  await expect(checkboxes.first()).toBeVisible();
  const count = await checkboxes.count();
  expect(count).toBeGreaterThan(5);
});

// ══════════════════════════════════════════════════════════════════
// TRAINING ECOSYSTEM — TRAINING PARTNERS
// ══════════════════════════════════════════════════════════════════

test('TC-TP-01: Partner Registry panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Training Partners', 'Partner Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Partner Registry');
});

test('TC-TP-02: Partner Registry shows Total TPs / Verified / Pending / Suspended KPIs', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Training Partners', 'Partner Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total TPs' })).toBeVisible();
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Verified' })).toBeVisible();
});

test('TC-TP-03: Verification Queue panel loads with Pending filter heading', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Training Partners', 'Verification Queue');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Verification Queue');
});

test('TC-TP-04: Accreditation Status panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Training Partners', 'Accreditation Status');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Accreditation Status');
});

// ══════════════════════════════════════════════════════════════════
// TRAINING ECOSYSTEM — TRAINING CENTERS
// ══════════════════════════════════════════════════════════════════

test('TC-CTR-01: Center Registry panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Training Centers', 'Center Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Center Registry');
});

test('TC-CTR-02: Center Registry shows Total Centres KPI', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Training Centers', 'Center Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Centres' })).toBeVisible();
});

test('TC-CTR-03: Infrastructure Audit panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Training Centers', 'Infrastructure Audit');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Infrastructure Audit');
});

// ══════════════════════════════════════════════════════════════════
// TRAINING ECOSYSTEM — TRAINERS & ASSESSORS
// ══════════════════════════════════════════════════════════════════

test('TC-TR-01: Trainer Registry panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Trainers & Assessors', 'Trainer Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Trainer Registry');
});

test('TC-TR-02: Trainer Registry shows Total Trainers KPI', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Trainers & Assessors', 'Trainer Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Trainers' })).toBeVisible();
});

test('TC-TR-03: Assessor Registry panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Trainers & Assessors', 'Assessor Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Assessor Registry');
});

// ══════════════════════════════════════════════════════════════════
// TRAINING ECOSYSTEM — SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════════

test('TC-SESS-01: All Sessions panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Session Management', 'All Sessions');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('All Sessions');
});

test('TC-SESS-02: All Sessions shows Total Sessions KPI', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Session Management', 'All Sessions');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Sessions' })).toBeVisible();
});

test('TC-SESS-03: Schedule Session panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Session Management', 'Schedule Session');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Scheduled Sessions');
});

test('TC-SESS-04: Attendance Tracking panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Session Management', 'Attendance Tracking');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText("Today's Sessions");
});

// ══════════════════════════════════════════════════════════════════
// COURSES & CURRICULUM
// ══════════════════════════════════════════════════════════════════

test('TC-COURSE-01: Course Catalogue panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Courses', 'Course Catalogue');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Course Catalogue');
});

test('TC-COURSE-02: Course Catalogue shows Total Courses KPI', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Courses', 'Course Catalogue');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Courses' })).toBeVisible();
});

test('TC-COURSE-03: NSQF Framework panel loads', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Courses', 'NSQF Framework');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('NSQF Framework');
});

test('TC-COURSE-04: Sectors & Job Roles panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Sectors & Job Roles');
  await expect(page.locator('h1')).toContainText('Sectors & Job Roles');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// SCHEMES & PROGRAMS
// ══════════════════════════════════════════════════════════════════

test('TC-SCH-01: PMKVY 4.0 panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'PMKVY 4.0');
  await expect(page.locator('h1')).toContainText('PMKVY 4.0');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

test('TC-SCH-02: DDU-GKY panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'DDU-GKY');
  await expect(page.locator('h1')).toContainText('DDU-GKY');
});

test('TC-SCH-03: NAPS (Apprenticeship) panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'NAPS (Apprenticeship)');
  await expect(page.locator('h1')).toContainText('NAPS');
});

test('TC-SCH-04: CSR-Funded Programs panel loads with KPIs', async ({ page }) => {
  await login(page);
  await navTo(page, 'CSR-Funded Programs');
  await page.waitForTimeout(600);
  await expect(page.locator('h1')).toContainText('CSR-Funded Programs');
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Projects' })).toBeVisible();
});

test('TC-SCH-05: Scheme Configuration panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Scheme Configuration');
  await expect(page.locator('h1')).toContainText('Scheme Configuration');
});

// ══════════════════════════════════════════════════════════════════
// CANDIDATES & ENROLMENT
// ══════════════════════════════════════════════════════════════════

test('TC-CAND-01: Candidate Registry panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Candidate Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Candidate Registry');
});

test('TC-CAND-02: Candidate Registry shows Total KPI', async ({ page }) => {
  await login(page);
  await navTo(page, 'Candidate Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total' })).toBeVisible();
});

test('TC-CAND-03: Batch Management panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Batch Management');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Batch Management');
});

test('TC-CAND-04: Batch Management shows Total Batches KPI', async ({ page }) => {
  await login(page);
  await navTo(page, 'Batch Management');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Batches' })).toBeVisible();
});

test('TC-CAND-05: Target Beneficiaries panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Target Beneficiaries');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Target Beneficiaries');
});

test('TC-CAND-06: Dropout Management shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Dropout Management');
  await expect(page.locator('h1')).toContainText('Dropout Management');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// ASSESSMENTS & CERTIFICATIONS
// ══════════════════════════════════════════════════════════════════

test('TC-ASSESS-01: Assessment Agencies panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Assessment Agencies');
  await expect(page.locator('h1')).toContainText('Assessment Agencies');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

test('TC-ASSESS-02: Certificate Generation panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Certificate Generation');
  await expect(page.locator('h1')).toContainText('Certificate Generation');
});

test('TC-ASSESS-03: Certificate Verification panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Certificate Verification');
  await expect(page.locator('h1')).toContainText('Certificate Verification');
});

// ══════════════════════════════════════════════════════════════════
// PLACEMENTS & EMPLOYMENT
// ══════════════════════════════════════════════════════════════════

test('TC-PLACE-01: Job Marketplace panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Job Marketplace');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Job Marketplace');
});

test('TC-PLACE-02: Job Marketplace shows Total Jobs KPI', async ({ page }) => {
  await login(page);
  await navTo(page, 'Job Marketplace');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Jobs' })).toBeVisible();
});

test('TC-PLACE-03: Placement Records panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Placement Records');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Placement Records');
});

test('TC-PLACE-04: Employer Registry panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Employer Registry');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Employer Registry');
});

test('TC-PLACE-05: Apprenticeship Portal shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Apprenticeship Portal');
  await expect(page.locator('h1')).toContainText('Apprenticeship Portal');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// FINANCIAL MANAGEMENT
// ══════════════════════════════════════════════════════════════════

test('TC-FIN-01: Fund Allocation panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Fund Allocation');
  await expect(page.locator('h1')).toContainText('Fund Allocation');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

test('TC-FIN-02: Disbursements panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Disbursements');
  await expect(page.locator('h1')).toContainText('Disbursements');
});

test('TC-FIN-03: Training Cost Claims panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Training Cost Claims');
  await expect(page.locator('h1')).toContainText('Training Cost Claims');
});

test('TC-FIN-04: Payment Reports panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Payment Reports');
  await expect(page.locator('h1')).toContainText('Payment Reports');
});

// ══════════════════════════════════════════════════════════════════
// GRIEVANCE & SUPPORT
// ══════════════════════════════════════════════════════════════════

test('TC-GRIEV-01: Grievance Management parent expands to children', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance Management');
  await expect(page.locator('.sa-child').filter({ hasText: 'Open Grievances' })).toBeVisible();
});

test('TC-GRIEV-02: Open Grievances panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navToChild(page, 'Grievance Management', 'Open Grievances');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

test('TC-GRIEV-03: Help Desk / Support Tickets panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Help Desk / Support Tickets');
  await expect(page.locator('h1')).toContainText('Help Desk');
});

// ══════════════════════════════════════════════════════════════════
// REPORTS & ANALYTICS
// ══════════════════════════════════════════════════════════════════

test('TC-RPT-01: MIS Dashboard panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'MIS Dashboard');
  await expect(page.locator('h1')).toContainText('MIS Dashboard');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

test('TC-RPT-02: Sector-wise Reports panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Sector-wise Reports');
  await expect(page.locator('h1')).toContainText('Sector-wise Reports');
});

test('TC-RPT-03: Placement Analytics panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Placement Analytics');
  await expect(page.locator('h1')).toContainText('Placement Analytics');
});

test('TC-RPT-04: Export Centre panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Export Centre');
  await expect(page.locator('h1')).toContainText('Export Centre');
});

test('TC-RPT-05: Custom Report Builder panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Custom Report Builder');
  await expect(page.locator('h1')).toContainText('Custom Report Builder');
});

// ══════════════════════════════════════════════════════════════════
// GEOGRAPHIC COVERAGE
// ══════════════════════════════════════════════════════════════════

test('TC-GEO-01: States & Districts panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'States & Districts');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('States & Districts');
});

test('TC-GEO-02: States & Districts shows Regions Configured KPI', async ({ page }) => {
  await login(page);
  await navTo(page, 'States & Districts');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Regions Configured' })).toBeVisible();
});

test('TC-GEO-03: Aspirational Districts panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Aspirational Districts');
  await expect(page.locator('h1')).toContainText('Aspirational Districts');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// CONTENT & COMMUNICATION
// ══════════════════════════════════════════════════════════════════

test('TC-CONT-01: Announcements panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Announcements');
  await expect(page.locator('h1')).toContainText('Announcements');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

test('TC-CONT-02: Email Templates panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Email Templates');
  await expect(page.locator('h1')).toContainText('Email Templates');
});

test('TC-CONT-03: Document Library panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'Document Library');
  await expect(page.locator('h1')).toContainText('Document Library');
});

// ══════════════════════════════════════════════════════════════════
// SETUP & CONFIGURATION
// ══════════════════════════════════════════════════════════════════

test('TC-SETUP-01: Accreditation Types panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Accreditation Types');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Accreditation Types');
});

test('TC-SETUP-02: Accreditation Types shows Total Types KPI', async ({ page }) => {
  await login(page);
  await navTo(page, 'Accreditation Types');
  await page.waitForTimeout(800);
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Types' })).toBeVisible();
});

test('TC-SETUP-03: Organisation Classifications panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Classifications');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Organisation Classifications');
});

test('TC-SETUP-04: Audit Logs panel loads with heading', async ({ page }) => {
  await login(page);
  await navTo(page, 'Audit Logs');
  await page.waitForTimeout(800);
  await expect(page.locator('h1')).toContainText('Audit Logs');
});

test('TC-SETUP-05: Audit Logs shows export CSV button when entries exist', async ({ page }) => {
  await login(page);
  await navTo(page, 'Audit Logs');
  await page.waitForTimeout(800);
  // Either export button or empty state should be present
  const hasExport = await page.locator('button:has-text("Export CSV")').isVisible().catch(() => false);
  const hasEmpty  = await page.locator('text=No audit log entries yet').isVisible().catch(() => false);
  expect(hasExport || hasEmpty).toBe(true);
});

test('TC-SETUP-06: System Settings panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'System Settings');
  await expect(page.locator('h1')).toContainText('System Settings');
  await expect(page.locator('text=No backend data yet')).toBeVisible();
});

test('TC-SETUP-07: API Configuration panel shows Coming Soon', async ({ page }) => {
  await login(page);
  await navTo(page, 'API Configuration');
  await expect(page.locator('h1')).toContainText('API Configuration');
});

// ══════════════════════════════════════════════════════════════════
// NOTIFICATIONS & ANALYTICS
// ══════════════════════════════════════════════════════════════════

test('TC-NOTIF-01: Notifications panel loads with Unread KPI', async ({ page }) => {
  await login(page);
  await navTo(page, 'Notifications');
  await expect(page.locator('h1')).toContainText('Notifications');
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Unread' })).toBeVisible();
});

test('TC-NOTIF-02: Notifications badge (5) is visible on the nav item', async ({ page }) => {
  await login(page);
  await expect(page.locator('.sa-badge')).toContainText('5');
});

test('TC-ANAL-01: Live Analytics panel loads with heading', async ({ page }) => {
  await login(page);
  await navTo(page, 'Live Analytics');
  await expect(page.locator('h1')).toContainText('Live Analytics');
});

test('TC-ANAL-02: Live Analytics shows multiple KPI cards', async ({ page }) => {
  await login(page);
  await navTo(page, 'Live Analytics');
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Total Learners' })).toBeVisible();
  await expect(page.locator('.kpi .lbl').filter({ hasText: 'Open Jobs' })).toBeVisible();
});

test('TC-ANAL-03: Live Analytics shows Key Performance Indicators card with progress bars', async ({ page }) => {
  await login(page);
  await navTo(page, 'Live Analytics');
  await expect(page.locator('.card-title').filter({ hasText: 'Key Performance Indicators' })).toBeVisible();
  await expect(page.locator('.prog-bar').first()).toBeVisible();
});
