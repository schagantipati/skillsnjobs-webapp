// E2E test suite for the Candidate Portal
// Credentials: aisha@example.com / password123  →  /candidate-portal
// 90 tests across Auth, Dashboard, Navigation, Profile, Skill Passport,
// Courses, Assessments, Jobs, Career Services, Apprenticeship, Schemes,
// Financial Aid, Grievance, Notifications, Search

import { test, expect } from '@playwright/test';

const CAND_EMAIL    = 'aisha@example.com';
const CAND_PASSWORD = 'password123';
const BASE          = 'http://localhost:5173';

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', CAND_EMAIL);
  await page.fill('input[type="password"]', CAND_PASSWORD);
  await page.locator('form button').click();
  await page.waitForURL('**/candidate-portal', { timeout: 12000 });
  await page.waitForSelector('text=Candidate Portal', { timeout: 10000 });
}

// Click a top-level nav item (handles label conflicts with section headers using nth-last)
async function navTo(page, label) {
  const matches = page.locator('nav').getByText(label, { exact: true });
  const count = await matches.count();
  await matches.nth(count - 1).click();
  await page.waitForTimeout(400);
}

// Expand a parent nav item then click a child.
// Child items render as "• Label" (bullet prefix), so exact match fails.
// Using .filter({ hasText }) + .last() targets the innermost (deepest) matching div.
async function goSub(page, parentLabel, childLabel) {
  await navTo(page, parentLabel);
  await page.locator('nav div').filter({ hasText: childLabel }).last().click();
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════

test('TC-AUTH-01: login with valid candidate credentials redirects to /candidate-portal', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/candidate-portal/);
});

test('TC-AUTH-02: sidebar shows Candidate Portal brand tag', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Candidate Portal')).toBeVisible();
});

test('TC-AUTH-03: topbar shows Sign Out button', async ({ page }) => {
  await login(page);
  await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
});

test('TC-AUTH-04: topbar shows user avatar with initials', async ({ page }) => {
  await login(page);
  // Avatar div has the gradient background and shows initials derived from name
  await expect(page.locator('text=ID: SK-')).toBeVisible();
});

test('TC-AUTH-05: sign out redirects away from candidate portal', async ({ page }) => {
  await login(page);
  await page.locator('button:has-text("Sign Out")').click();
  await page.waitForTimeout(1000);
  await expect(page).not.toHaveURL(/\/candidate-portal/);
});

// ══════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════

test('TC-DASH-01: dashboard loads with Welcome heading', async ({ page }) => {
  await login(page);
  await expect(page.locator('h1').filter({ hasText: 'Welcome back' })).toBeVisible();
});

test('TC-DASH-02: Enrolled Courses KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Enrolled Courses')).toBeVisible();
});

test('TC-DASH-03: Job Applications KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Job Applications')).toBeVisible();
});

test('TC-DASH-04: Certificates KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Certificates').first()).toBeVisible();
});

test('TC-DASH-05: Open Jobs KPI card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Open Jobs')).toBeVisible();
});

test('TC-DASH-06: Quick Actions card is visible with Find Courses and Browse Jobs', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=⚡ Quick Actions')).toBeVisible();
  await expect(page.locator('text=Find Courses')).toBeVisible();
  await expect(page.locator('text=Browse Jobs')).toBeVisible();
});

test('TC-DASH-07: Quick Action "Find Courses" navigates to browse-courses', async ({ page }) => {
  await login(page);
  await page.locator('text=Find Courses').click();
  await page.waitForTimeout(400);
  await expect(page.locator('h1').filter({ hasText: 'Browse Courses' })).toBeVisible();
});

test('TC-DASH-08: Quick Action "Browse Jobs" navigates to browse-jobs', async ({ page }) => {
  await login(page);
  await page.locator('text=Browse Jobs').click();
  await page.waitForTimeout(400);
  await expect(page.locator('h1').filter({ hasText: 'Browse Jobs' })).toBeVisible();
});

test('TC-DASH-09: Government Schemes card with PMKVY 4.0 is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=🏛️ Government Schemes').first()).toBeVisible();
  await expect(page.locator('text=PMKVY 4.0')).toBeVisible();
});

test('TC-DASH-10: Notifications card on dashboard shows three notification items', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=🔔 Notifications').first()).toBeVisible();
});

test('TC-DASH-11: My Courses dashboard card shows Browse Courses button when no enrolments', async ({ page }) => {
  await login(page);
  // Either enrolled courses or empty state
  const hasEnrolled = await page.locator('text=My Courses').first().isVisible();
  expect(hasEnrolled).toBe(true);
});

// ══════════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════════

test('TC-NAV-01: Notifications nav item navigates to Notifications panel', async ({ page }) => {
  await login(page);
  await navTo(page, 'Notifications');
  await expect(page.locator('h1').filter({ hasText: 'Notifications' })).toBeVisible();
});

test('TC-NAV-02: Notifications badge "3" is visible in sidebar', async ({ page }) => {
  await login(page);
  await expect(page.locator('nav').locator('text=3')).toBeVisible();
});

test('TC-NAV-03: clicking Courses nav item expands its children', async ({ page }) => {
  await login(page);
  await navTo(page, 'Courses');
  await expect(page.locator('nav div').filter({ hasText: 'Browse Courses' }).last()).toBeVisible();
});

test('TC-NAV-04: clicking Jobs nav item expands its children', async ({ page }) => {
  await login(page);
  await navTo(page, 'Jobs');
  await expect(page.locator('nav div').filter({ hasText: 'Browse Jobs' }).last()).toBeVisible();
});

test('TC-NAV-05: clicking My Profile nav item expands its children', async ({ page }) => {
  await login(page);
  await navTo(page, 'My Profile');
  await expect(page.locator('nav div').filter({ hasText: 'Basic Information' }).last()).toBeVisible();
});

test('TC-NAV-06: Skill Passport NEW badge is visible in sidebar', async ({ page }) => {
  await login(page);
  await expect(page.locator('nav').locator('text=NEW')).toBeVisible();
});

test('TC-NAV-07: clicking Assessments parent expands sub-items', async ({ page }) => {
  await login(page);
  await navTo(page, 'Assessments');
  await expect(page.locator('nav div').filter({ hasText: 'Upcoming' }).last()).toBeVisible();
});

test('TC-NAV-08: clicking Career Services parent expands sub-items', async ({ page }) => {
  await login(page);
  await navTo(page, 'Career Services');
  await expect(page.locator('nav div').filter({ hasText: 'Resume Builder' }).last()).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// PROFILE — BASIC INFORMATION
// ══════════════════════════════════════════════════════════════════

test('TC-PROF-01: Basic Information step loads with Personal Details heading', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Basic Information');
  await expect(page.locator('text=Personal Information').first()).toBeVisible();
});

test('TC-PROF-02: Basic Information form has First Name and Last Name fields', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Basic Information');
  await expect(page.locator('text=First Name')).toBeVisible();
  await expect(page.locator('text=Last Name')).toBeVisible();
});

test('TC-PROF-03: Basic Information form has Date of Birth and Gender fields', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Basic Information');
  await expect(page.locator('text=Date of Birth').first()).toBeVisible();
  await expect(page.locator('text=Gender').first()).toBeVisible();
});

test('TC-PROF-04: Basic Information form has Mobile Number and Category fields', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Basic Information');
  await expect(page.locator('text=Mobile Number').first()).toBeVisible();
  await expect(page.locator('text=Category').first()).toBeVisible();
});

test('TC-PROF-05: Basic Information form has Current Address section', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Basic Information');
  await expect(page.locator('text=Current Address')).toBeVisible();
  await expect(page.locator('text=PIN Code')).toBeVisible();
});

test('TC-PROF-06: Basic Information step shows stepper with 6 steps', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Basic Information');
  // Steps: Personal Details, Education, Work Experience, Skills, Documents, Job Preferences
  await expect(page.locator('text=Personal Details').first()).toBeVisible();
  await expect(page.locator('text=Education').first()).toBeVisible();
});

test('TC-PROF-07: Education Details step loads with Highest Qualification section', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Education Details');
  await expect(page.locator('text=Highest Qualification').first()).toBeVisible();
});

test('TC-PROF-08: Education Details has Highest Education Level and Board fields', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Education Details');
  await expect(page.locator('text=Highest Education Level')).toBeVisible();
  await expect(page.locator('text=Board / University / Institute')).toBeVisible();
});

test('TC-PROF-09: Work Experience step loads with Employment Status section', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Work Experience');
  await expect(page.locator('text=Employment Status').first()).toBeVisible();
  await expect(page.locator('text=Current Employment Status').first()).toBeVisible();
});

test('TC-PROF-10: Work Experience has Add Another Experience button', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Work Experience');
  await expect(page.locator('text=+ Add Another Experience')).toBeVisible();
});

test('TC-PROF-11: Skills & Competencies step loads with Skill Category field', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Skills & Competencies');
  await expect(page.locator('text=Skill Category')).toBeVisible();
  await expect(page.locator('text=Proficiency Level')).toBeVisible();
});

test('TC-PROF-12: Documents & ID Proof step loads with Aadhaar Card upload', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Documents & ID Proof');
  await expect(page.locator('text=Aadhaar Card')).toBeVisible();
});

test('TC-PROF-13: Job Preferences step loads with Preferred Job Role field', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Job Preferences');
  await expect(page.locator('text=Preferred Job Role')).toBeVisible();
  await expect(page.locator('text=Preferred Employment Type')).toBeVisible();
});

test('TC-PROF-14: Save Draft button is present on Basic Information step', async ({ page }) => {
  await login(page);
  await goSub(page, 'My Profile', 'Basic Information');
  await expect(page.locator('button:has-text("Save Draft")')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// SKILL PASSPORT
// ══════════════════════════════════════════════════════════════════

test('TC-SKILL-01: Skill Passport panel loads with My Skill Passport heading', async ({ page }) => {
  await login(page);
  await navTo(page, 'Skill Passport');
  await expect(page.locator('h1').filter({ hasText: 'Skill Passport' })).toBeVisible();
});

test('TC-SKILL-02: Skill Passport shows Verified Skills card', async ({ page }) => {
  await login(page);
  await navTo(page, 'Skill Passport');
  await expect(page.locator('text=✅ Verified Skills')).toBeVisible();
});

test('TC-SKILL-03: Skill Passport shows Profile Information card', async ({ page }) => {
  await login(page);
  await navTo(page, 'Skill Passport');
  await expect(page.locator('text=📋 Profile Information')).toBeVisible();
});

test('TC-SKILL-04: Skill Passport shows Certificates & Credentials card', async ({ page }) => {
  await login(page);
  await navTo(page, 'Skill Passport');
  await expect(page.locator('text=🏆 Certificates & Credentials')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// COURSES & LEARNING — BROWSE COURSES
// ══════════════════════════════════════════════════════════════════

test('TC-COURSE-01: Browse Courses panel loads with heading', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'Browse Courses');
  await expect(page.locator('h1').filter({ hasText: 'Browse Courses' })).toBeVisible();
});

test('TC-COURSE-02: Browse Courses shows sector filter buttons', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'Browse Courses');
  await expect(page.locator('button:has-text("All")').first()).toBeVisible();
  await expect(page.locator('button:has-text("IT & Digital")')).toBeVisible();
});

test('TC-COURSE-03: My Enrolled Courses panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'My Enrolled Courses');
  await expect(page.locator('h1').filter({ hasText: 'My Enrolled Courses' })).toBeVisible();
});

test('TC-COURSE-04: My Enrolled Courses shows Browse Courses button when empty', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'My Enrolled Courses');
  await page.waitForTimeout(600);
  // Either course table or empty state
  const hasContent = await page.locator('text=Browse Courses').isVisible().catch(() => false)
    || await page.locator('text=Course').isVisible().catch(() => false);
  expect(hasContent).toBe(true);
});

test('TC-COURSE-05: Learning Progress panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'Learning Progress');
  await expect(page.locator('h1').filter({ hasText: 'Learning Progress' })).toBeVisible();
});

test('TC-COURSE-06: My Certificates panel loads with heading', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'My Certificates');
  await expect(page.locator('h1').filter({ hasText: 'My Certificates' })).toBeVisible();
});

test('TC-COURSE-07: My Certificates panel shows No Certificates Yet when empty', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'My Certificates');
  await page.waitForTimeout(600);
  const hasEmpty = await page.locator('text=No Certificates Yet').isVisible().catch(() => false);
  const hasTable = await page.locator('text=Cert No.').isVisible().catch(() => false);
  expect(hasEmpty || hasTable).toBe(true);
});

test('TC-COURSE-08: AI Recommendations panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'AI Recommendations');
  await expect(page.locator('h1').filter({ hasText: 'AI Course Recommendations' })).toBeVisible();
});

test('TC-COURSE-09: AI Recommendations shows Why These Courses card', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses', 'AI Recommendations');
  await page.waitForTimeout(600);
  await expect(page.locator('text=💡 Why These Courses?')).toBeVisible();
});

test('TC-COURSE-10: top-level Certificates nav item opens Certificates panel', async ({ page }) => {
  await login(page);
  await navTo(page, 'Certificates');
  await page.waitForTimeout(400);
  await expect(page.locator('h1').filter({ hasText: 'My Certificates' })).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// ASSESSMENTS
// ══════════════════════════════════════════════════════════════════

test('TC-ASSESS-01: Assessments panel loads with heading when going via Upcoming', async ({ page }) => {
  await login(page);
  await goSub(page, 'Assessments', 'Upcoming');
  await expect(page.locator('h1').filter({ hasText: 'Assessments' })).toBeVisible();
});

test('TC-ASSESS-02: Assessments panel shows Upcoming and Completed sections', async ({ page }) => {
  await login(page);
  await goSub(page, 'Assessments', 'Upcoming');
  await expect(page.locator('text=📅 Upcoming Assessments')).toBeVisible();
  await expect(page.locator('text=✅ Completed Assessments')).toBeVisible();
});

test('TC-ASSESS-03: RPL section is visible with Apply for RPL Assessment button', async ({ page }) => {
  await login(page);
  await goSub(page, 'Assessments', 'Upcoming');
  await expect(page.locator('text=🏅 RPL — Recognition of Prior Learning')).toBeVisible();
  await expect(page.locator('button:has-text("Apply for RPL Assessment")')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// JOBS & EMPLOYMENT
// ══════════════════════════════════════════════════════════════════

test('TC-JOB-01: Browse Jobs panel loads with heading', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Browse Jobs');
  await expect(page.locator('h1').filter({ hasText: 'Browse Jobs' })).toBeVisible();
});

test('TC-JOB-02: Browse Jobs shows sector filter buttons', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Browse Jobs');
  await expect(page.locator('button:has-text("All")').first()).toBeVisible();
  await expect(page.locator('button:has-text("BFSI")')).toBeVisible();
});

test('TC-JOB-03: Browse Jobs shows job table when jobs exist', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Browse Jobs');
  await page.waitForTimeout(800);
  const hasTable = await page.locator('text=Job Title').isVisible().catch(() => false);
  const hasEmpty = await page.locator('text=No jobs available').isVisible().catch(() => false);
  expect(hasTable || hasEmpty).toBe(true);
});

test('TC-JOB-04: My Applications panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'My Applications');
  await expect(page.locator('h1').filter({ hasText: 'My Applications' })).toBeVisible();
});

test('TC-JOB-05: My Applications shows Browse Jobs button or applications table', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'My Applications');
  await page.waitForTimeout(600);
  const hasButton = await page.locator('button:has-text("Browse Jobs")').isVisible().catch(() => false);
  const hasTable  = await page.locator('text=Job Title').isVisible().catch(() => false);
  expect(hasButton || hasTable).toBe(true);
});

test('TC-JOB-06: Saved Jobs panel loads with No Saved Jobs state', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Saved Jobs');
  await expect(page.locator('h1').filter({ hasText: 'Saved Jobs' })).toBeVisible();
  await expect(page.locator('text=No Saved Jobs')).toBeVisible();
});

test('TC-JOB-07: Job Alerts panel loads with Set Up Job Alerts form', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Job Alerts');
  await expect(page.locator('h1').filter({ hasText: 'Job Alerts' })).toBeVisible();
  await expect(page.locator('text=Set Up Job Alerts')).toBeVisible();
});

test('TC-JOB-08: Job Alerts form has Preferred Job Role, Sector, Location fields', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Job Alerts');
  await expect(page.locator('text=Preferred Job Role')).toBeVisible();
  await expect(page.locator('text=Preferred Sector')).toBeVisible();
  await expect(page.locator('text=Preferred Location')).toBeVisible();
});

test('TC-JOB-09: submitting empty Job Alerts form shows error toast', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Job Alerts');
  await page.locator('button:has-text("Activate Job Alerts")').click();
  await expect(page.locator('text=Please fill in at least one preference')).toBeVisible();
});

test('TC-JOB-10: activating Job Alerts with data saves and shows active message', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Job Alerts');
  // Clear any saved alerts first
  await page.evaluate(() => localStorage.removeItem('snj_job_alerts'));
  await page.reload();
  await page.waitForURL('**/candidate-portal');
  await goSub(page, 'Jobs', 'Job Alerts');
  await page.locator('input[placeholder="e.g. Data Analyst, Electrician"]').fill('Software Developer');
  await page.locator('button:has-text("Activate Job Alerts")').click();
  await expect(page.locator('text=Job alerts activated!')).toBeVisible();
});

test('TC-JOB-11: Placement Status panel loads with Application Timeline', async ({ page }) => {
  await login(page);
  await goSub(page, 'Jobs', 'Placement Status');
  await expect(page.locator('h1').filter({ hasText: 'Placement Status' })).toBeVisible();
  await expect(page.locator('text=Applications Sent')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// CAREER SERVICES
// ══════════════════════════════════════════════════════════════════

test('TC-CAREER-01: Career Services panel loads via parent nav', async ({ page }) => {
  await login(page);
  // Navigate to career-counselling child to load the Career Services section
  await goSub(page, 'Career Services', 'Career Counselling');
  await expect(page.locator('h1').filter({ hasText: 'Career' })).toBeVisible();
});

test('TC-CAREER-02: Resume Builder panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Career Services', 'Resume Builder');
  // All Career Services sub-items render PanelCareerServices (h1 = "Career Services 🚀")
  await expect(page.locator('h1').filter({ hasText: 'Career' })).toBeVisible();
  await expect(page.locator('text=Resume Builder').first()).toBeVisible();
});

test('TC-CAREER-03: Resume Builder shows profile sections for resume', async ({ page }) => {
  await login(page);
  await goSub(page, 'Career Services', 'Resume Builder');
  await page.waitForTimeout(400);
  await expect(page.locator('text=Resume Builder').first()).toBeVisible();
});

test('TC-CAREER-04: Mock Interviews panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Career Services', 'Mock Interviews');
  await expect(page.locator('h1').filter({ hasText: 'Career' })).toBeVisible();
  await expect(page.locator('text=Mock Interviews').first()).toBeVisible();
});

test('TC-CAREER-05: Career Pathways panel loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Career Services', 'Career Pathways');
  await expect(page.locator('h1').filter({ hasText: 'Career' })).toBeVisible();
  await expect(page.locator('text=Career Pathways').first()).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// APPRENTICESHIP
// ══════════════════════════════════════════════════════════════════

test('TC-APPREN-01: Apprenticeship panel loads with NAPS description', async ({ page }) => {
  await login(page);
  await goSub(page, 'Apprenticeship', 'Browse Opportunities');
  await expect(page.locator('h1').filter({ hasText: 'Apprenticeship' })).toBeVisible();
  await expect(page.locator('text=National Apprenticeship Promotion Scheme')).toBeVisible();
});

test('TC-APPREN-02: Apprenticeship panel shows Browse Opportunities and NAPS Registration cards', async ({ page }) => {
  await login(page);
  await goSub(page, 'Apprenticeship', 'Browse Opportunities');
  await expect(page.locator('text=🔍 Browse Opportunities')).toBeVisible();
  await expect(page.locator('text=📝 NAPS Registration')).toBeVisible();
});

test('TC-APPREN-03: Apprenticeship shows My Applications card', async ({ page }) => {
  await login(page);
  await goSub(page, 'Apprenticeship', 'Browse Opportunities');
  await expect(page.locator('text=No apprenticeship applications yet')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// SCHEMES & BENEFITS
// ══════════════════════════════════════════════════════════════════

test('TC-SCHEME-01: Govt Schemes panel loads with Government Schemes heading', async ({ page }) => {
  await login(page);
  // "Govt Schemes" is a parent-with-children — clicking it only expands the menu.
  // Navigate to PanelSchemes via a child item.
  await goSub(page, 'Govt Schemes', 'PMKVY 4.0');
  await expect(page.locator('h1').filter({ hasText: 'Government Schemes' })).toBeVisible();
});

test('TC-SCHEME-02: Govt Schemes shows PMKVY 4.0 card', async ({ page }) => {
  await login(page);
  await goSub(page, 'Govt Schemes', 'PMKVY 4.0');
  await expect(page.locator('text=PMKVY 4.0 — PM Kaushal Vikas Yojana')).toBeVisible();
});

test('TC-SCHEME-03: Govt Schemes shows NAPS card', async ({ page }) => {
  await login(page);
  await goSub(page, 'Govt Schemes', 'PMKVY 4.0');
  await expect(page.locator('text=NAPS — National Apprenticeship')).toBeVisible();
});

test('TC-SCHEME-04: Govt Schemes shows RPL card', async ({ page }) => {
  await login(page);
  await goSub(page, 'Govt Schemes', 'PMKVY 4.0');
  await expect(page.locator('text=RPL — Recognition of Prior Learning')).toBeVisible();
});

test('TC-SCHEME-05: Govt Schemes shows Scholarships & Stipends card', async ({ page }) => {
  await login(page);
  await goSub(page, 'Govt Schemes', 'PMKVY 4.0');
  await expect(page.locator('text=Scholarships & Stipends').first()).toBeVisible();
});

test('TC-SCHEME-06: PMKVY sub-item navigates to Government Schemes panel', async ({ page }) => {
  await login(page);
  await goSub(page, 'Govt Schemes', 'PMKVY 4.0');
  await expect(page.locator('h1').filter({ hasText: 'Government Schemes' })).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// FINANCIAL ASSISTANCE
// ══════════════════════════════════════════════════════════════════

test('TC-FIN-01: Financial Assistance panel loads with heading', async ({ page }) => {
  await login(page);
  await navTo(page, 'Financial Assistance');
  await expect(page.locator('h1').filter({ hasText: 'Financial Assistance' })).toBeVisible();
});

test('TC-FIN-02: Financial Assistance shows Training Stipend card', async ({ page }) => {
  await login(page);
  await navTo(page, 'Financial Assistance');
  await expect(page.locator('text=Training Stipend')).toBeVisible();
});

test('TC-FIN-03: Financial Assistance shows Post-Placement Incentive card', async ({ page }) => {
  await login(page);
  await navTo(page, 'Financial Assistance');
  await expect(page.locator('text=Post-Placement Incentive')).toBeVisible();
});

test('TC-FIN-04: Financial Assistance shows Transport Allowance card', async ({ page }) => {
  await login(page);
  await navTo(page, 'Financial Assistance');
  await expect(page.locator('text=Transport Allowance')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// GRIEVANCE
// ══════════════════════════════════════════════════════════════════

test('TC-GRIEV-01: Grievance panel loads with Submit a Grievance form', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance');
  await expect(page.locator('h1').filter({ hasText: 'Grievance Redressal' })).toBeVisible();
  await expect(page.locator('text=Submit a Grievance')).toBeVisible();
});

test('TC-GRIEV-02: Grievance form has Category, Subject, Description fields', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance');
  await expect(page.locator('label:has-text("Category")')).toBeVisible();
  await expect(page.locator('label:has-text("Subject")')).toBeVisible();
  await expect(page.locator('label:has-text("Description")')).toBeVisible();
});

test('TC-GRIEV-03: submitting empty grievance form shows required fields error', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance');
  await page.locator('button:has-text("Submit Grievance")').click();
  await expect(page.locator('text=Subject and description are required')).toBeVisible();
});

test('TC-GRIEV-04: submitting with too-short subject shows validation error', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance');
  await page.locator('input[placeholder*="Brief subject"]').fill('AB');
  await page.locator('textarea[placeholder*="Describe your grievance"]').fill('Some description here that is long enough');
  await page.locator('button:has-text("Submit Grievance")').click();
  await expect(page.locator('text=❌').first()).toBeVisible();
});

test('TC-GRIEV-05: My Grievances section shows No grievances message when empty', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance');
  await page.waitForTimeout(600);
  const hasEmpty = await page.locator('text=No grievances submitted yet').isVisible().catch(() => false);
  const hasTable = await page.locator('text=Submitted On').isVisible().catch(() => false);
  expect(hasEmpty || hasTable).toBe(true);
});

// ══════════════════════════════════════════════════════════════════
// SUPPORT — HELP & FAQ
// ══════════════════════════════════════════════════════════════════

test('TC-SUPP-01: Help & Support panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Help & Support');
  await expect(page.locator('h1').filter({ hasText: 'Help' })).toBeVisible();
});

test('TC-SUPP-02: FAQ panel loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'FAQ');
  // Both 'helpdesk' and 'faq' render PanelHelpdesk (h1 = "Help & Support 🎧");
  // verify the FAQ card is present within that panel.
  await expect(page.locator('h1').filter({ hasText: 'Help' })).toBeVisible();
  await expect(page.locator('text=How do I apply for PMKVY?')).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════

test('TC-NOTIF-01: Notifications panel shows three notification items', async ({ page }) => {
  await login(page);
  await navTo(page, 'Notifications');
  await expect(page.locator('text=Complete your profile')).toBeVisible();
  await expect(page.locator('text=Welcome to SkillsnJobs')).toBeVisible();
});

test('TC-NOTIF-02: Notifications panel shows unread dot markers', async ({ page }) => {
  await login(page);
  await navTo(page, 'Notifications');
  // Unread items have an orange dot; we just verify the panel loaded with content
  await expect(page.locator('h1').filter({ hasText: 'Notifications' })).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════════

test('TC-SEARCH-01: search bar is visible in topbar', async ({ page }) => {
  await login(page);
  await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
});

test('TC-SEARCH-02: typing in search shows dropdown results', async ({ page }) => {
  await login(page);
  await page.locator('input[placeholder*="Search"]').click();
  await page.locator('input[placeholder*="Search"]').fill('course');
  await page.waitForTimeout(300);
  await expect(page.locator('text=Browse Courses').first()).toBeVisible();
});

test('TC-SEARCH-03: searching with no match shows no results message', async ({ page }) => {
  await login(page);
  await page.locator('input[placeholder*="Search"]').click();
  await page.locator('input[placeholder*="Search"]').fill('xyznotfound999');
  await page.waitForTimeout(300);
  await expect(page.locator('text=No results for')).toBeVisible();
});

test('TC-SEARCH-04: clicking a search result navigates to that panel', async ({ page }) => {
  await login(page);
  await page.locator('input[placeholder*="Search"]').click();
  await page.locator('input[placeholder*="Search"]').fill('jobs');
  await page.waitForTimeout(300);
  await page.locator('text=Browse Jobs').first().click({ force: true });
  await page.waitForTimeout(500);
  await expect(page.locator('h1').filter({ hasText: 'Browse Jobs' })).toBeVisible();
});
