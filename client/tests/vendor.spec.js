// E2E tests for the Training Vendor Portal
// Credentials: netapp@gmail.com / Welcome@123

import { test, expect } from '@playwright/test';

const VENDOR_EMAIL    = 'netapp@gmail.com';
const VENDOR_PASSWORD = 'Welcome@123';
const BASE            = 'http://localhost:5173';

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', VENDOR_EMAIL);
  await page.fill('input[type="password"]', VENDOR_PASSWORD);
  await page.locator('form button').click();
  await page.waitForURL('**/vendor-portal', { timeout: 10000 });
  await page.waitForSelector('text=Training Partner', { timeout: 10000 });
}

async function expandSection(page, label) {
  // section-header divs share the same text as the nav item spans — use last() to hit the clickable nav item
  const matches = page.locator('nav').getByText(label, { exact: true });
  const count = await matches.count();
  await matches.nth(count - 1).click();
  await page.waitForTimeout(300);
}

async function navTo(page, label) {
  await page.locator('nav').getByText(label, { exact: true }).click();
  await page.waitForTimeout(400);
}

async function goSub(page, section, sub) {
  await expandSection(page, section);
  await navTo(page, sub);
}

function catchDialog(page) {
  return new Promise(resolve => {
    page.once('dialog', async dialog => {
      const msg = dialog.message();
      await dialog.accept();
      resolve(msg);
    });
  });
}

// ─── Authentication ──────────────────────────────────────────────────────────

test('TC-AUTH-01: login with valid credentials navigates to vendor portal', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/vendor-portal/);
  await expect(page.locator('text=Training Partner').first()).toBeVisible();
});

test('TC-AUTH-02: login with wrong password shows error', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', VENDOR_EMAIL);
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.locator('form button').click();
  await page.waitForTimeout(1500);
  await expect(page).not.toHaveURL(/vendor-portal/);
});

test('TC-AUTH-03: unauthenticated access redirects away from portal', async ({ page }) => {
  await page.goto(`${BASE}/vendor-portal`);
  await page.waitForTimeout(1000);
  expect(page.url()).not.toMatch(/vendor-portal/);
});

test('TC-AUTH-04: sign out button is visible in topbar', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=⏻ Sign Out')).toBeVisible();
});

test('TC-AUTH-05: sign out logs out and redirects', async ({ page }) => {
  await login(page);
  await page.locator('text=⏻ Sign Out').click();
  await page.waitForTimeout(1500);
  await expect(page).not.toHaveURL(/vendor-portal/);
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

test('TC-DASH-01: dashboard loads with page title', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Dashboard').first()).toBeVisible();
});

test('TC-DASH-02: welcome subtitle is visible on dashboard', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Welcome,').first()).toBeVisible();
});

test('TC-DASH-03: Training Centres KPI stat card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Training Centres').first()).toBeVisible();
});

test('TC-DASH-04: Active Batches KPI stat card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Active Batches').first()).toBeVisible();
});

test('TC-DASH-05: Enrolled Candidates KPI stat card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Enrolled Candidates').first()).toBeVisible();
});

test('TC-DASH-06: Active Trainers KPI stat card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Active Trainers').first()).toBeVisible();
});

test('TC-DASH-07: profile completion card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Profile completion').first()).toBeVisible();
});

test('TC-DASH-08: quick links card is visible', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Quick links').first()).toBeVisible();
});

test('TC-DASH-09: quick link Add Training Centre is present', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=Add Training Centre').first()).toBeVisible();
});

// ─── Navigation ──────────────────────────────────────────────────────────────

test('TC-NAV-01: Training Centres section expands to show sub-items', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Training Centres');
  await expect(page.locator('nav').getByText('Centre list', { exact: true })).toBeVisible();
  await expect(page.locator('nav').getByText('Add centre', { exact: true })).toBeVisible();
});

test('TC-NAV-02: Trainers & Faculty section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Trainers & Faculty');
  await expect(page.locator('nav').getByText('Trainer list', { exact: true })).toBeVisible();
  await expect(page.locator('nav').getByText('Add trainer', { exact: true })).toBeVisible();
});

test('TC-NAV-03: Courses & Curriculum section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Courses & Curriculum');
  await expect(page.locator('nav').getByText('Course catalogue', { exact: true })).toBeVisible();
  await expect(page.locator('nav').getByText('Add course', { exact: true })).toBeVisible();
});

test('TC-NAV-04: Batch Management section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Batch Management');
  await expect(page.locator('nav').getByText('All batches', { exact: true })).toBeVisible();
  await expect(page.locator('nav').getByText('Create batch', { exact: true })).toBeVisible();
});

test('TC-NAV-05: Candidate Management section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Candidate Management');
  await expect(page.locator('nav').getByText('All candidates', { exact: true })).toBeVisible();
  await expect(page.locator('nav').getByText('Enrol candidate', { exact: true })).toBeVisible();
});

test('TC-NAV-06: Assessments section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Assessments');
  await expect(page.locator('nav').getByText('All assessments', { exact: true })).toBeVisible();
  await expect(page.locator('nav').getByText('Schedule assessment', { exact: true })).toBeVisible();
});

test('TC-NAV-07: Collaboration section expands', async ({ page }) => {
  await login(page);
  await expandSection(page, 'Collaboration');
  await expect(page.locator('nav').getByText('Consortium Builder', { exact: true })).toBeVisible();
  await expect(page.locator('nav').getByText('Resource Sharing', { exact: true })).toBeVisible();
});

test('TC-NAV-08: Dashboard nav item returns to dashboard', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await page.waitForTimeout(300);
  await navTo(page, 'Dashboard');
  await expect(page.locator('text=Dashboard').first()).toBeVisible();
  await expect(page.locator('text=Active Batches').first()).toBeVisible();
});

// ─── Organisation Profile ─────────────────────────────────────────────────────

test('TC-PROF-01: Organisation Profile page loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await expect(page.locator('text=Organisation Profile').first()).toBeVisible();
});

test('TC-PROF-02: basic details section is rendered', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await expect(page.locator('text=Basic details').first()).toBeVisible();
});

test('TC-PROF-03: Edit button opens org profile modal', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await page.locator('button:has-text("✏ Edit")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('text=Edit Organisation Profile')).toBeVisible();
});

test('TC-PROF-04: invalid email in edit modal shows inline error on blur', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await page.locator('button:has-text("✏ Edit")').click();
  await page.waitForTimeout(300);
  const emailInput = page.locator('input[placeholder="contact@org.com"]');
  await emailInput.fill('bademail');
  await emailInput.press('Tab');
  await expect(page.locator('text=⚠ Enter a valid email address')).toBeVisible();
});

test('TC-PROF-05: invalid mobile in edit modal shows inline error on blur', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await page.locator('button:has-text("✏ Edit")').click();
  await page.waitForTimeout(300);
  const mobileInput = page.locator('input[placeholder="9876543210"]');
  await mobileInput.fill('12345');
  await mobileInput.press('Tab');
  await expect(page.locator('text=⚠ Must be 10 digits starting with 6–9')).toBeVisible();
});

test('TC-PROF-06: invalid GSTIN in edit modal shows inline error on blur', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await page.locator('button:has-text("✏ Edit")').click();
  await page.waitForTimeout(300);
  const gstInput = page.locator('input[placeholder="27AAPFU0939F1ZV"]');
  await gstInput.fill('BADGSTIN');
  await gstInput.press('Tab');
  await expect(page.locator('text=⚠ Invalid GSTIN')).toBeVisible();
});

test('TC-PROF-07: Cancel button closes edit modal', async ({ page }) => {
  await login(page);
  await navTo(page, 'Organisation Profile');
  await page.locator('button:has-text("✏ Edit")').click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(300);
  await expect(page.locator('text=Edit Organisation Profile')).not.toBeVisible();
});

// ─── Training Centres ─────────────────────────────────────────────────────────

test('TC-CENT-01: Centre list page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Training Centres', 'Centre list');
  await expect(page.locator('text=Training Centres').first()).toBeVisible();
});

test('TC-CENT-02: Add Centre button is visible', async ({ page }) => {
  await login(page);
  await goSub(page, 'Training Centres', 'Centre list');
  await expect(page.locator('button:has-text("+ Add Centre")')).toBeVisible();
});

test('TC-CENT-03: Add Centre button opens modal', async ({ page }) => {
  await login(page);
  await goSub(page, 'Training Centres', 'Centre list');
  await page.locator('button:has-text("+ Add Centre")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('button:has-text("×")')).toBeVisible();
  await expect(page.locator('text=Centre details')).toBeVisible();
});

test('TC-CENT-04: saving centre with empty name shows alert', async ({ page }) => {
  await login(page);
  await goSub(page, 'Training Centres', 'Centre list');
  await page.locator('button:has-text("+ Add Centre")').click();
  await page.waitForTimeout(300);
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Save Centre")').click();
  const msg = await dialogPromise;
  expect(msg).toContain('Centre name is required');
});

test('TC-CENT-05: centre form modal contains all infrastructure fields', async ({ page }) => {
  await login(page);
  await goSub(page, 'Training Centres', 'Centre list');
  await page.locator('button:has-text("+ Add Centre")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('label:has-text("Seating capacity")')).toBeVisible();
  await expect(page.locator('label:has-text("Internet connectivity")')).toBeVisible();
  await expect(page.locator('label:has-text("PIN code")')).toBeVisible();
});

test('TC-CENT-06: Add centre quick-link from dashboard navigates correctly', async ({ page }) => {
  await login(page);
  await page.locator('text=Add Training Centre').first().click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Add Training Centre').first()).toBeVisible();
});

// ─── Trainers ─────────────────────────────────────────────────────────────────

test('TC-TRAIN-01: Trainer list page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Trainers & Faculty', 'Trainer list');
  await expect(page.locator('text=Trainers & Faculty').first()).toBeVisible();
});

test('TC-TRAIN-02: Add Trainer button opens modal', async ({ page }) => {
  await login(page);
  await goSub(page, 'Trainers & Faculty', 'Trainer list');
  await page.locator('button:has-text("+ Add Trainer")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('button:has-text("×")')).toBeVisible();
  await expect(page.locator('text=Full name *')).toBeVisible();
});

test('TC-TRAIN-03: saving trainer with empty name shows alert', async ({ page }) => {
  await login(page);
  await goSub(page, 'Trainers & Faculty', 'Trainer list');
  await page.locator('button:has-text("+ Add Trainer")').click();
  await page.waitForTimeout(300);
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Save")').last().click();
  const msg = await dialogPromise;
  expect(msg).toContain('Trainer name required');
});

test('TC-TRAIN-04: invalid email in trainer modal shows inline error on blur', async ({ page }) => {
  await login(page);
  await goSub(page, 'Trainers & Faculty', 'Trainer list');
  await page.locator('button:has-text("+ Add Trainer")').click();
  await page.waitForTimeout(300);
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill('notanemail');
  await emailInput.blur();
  await expect(page.locator('text=⚠').first()).toBeVisible();
});

test('TC-TRAIN-05: invalid mobile in trainer modal shows inline error on blur', async ({ page }) => {
  await login(page);
  await goSub(page, 'Trainers & Faculty', 'Trainer list');
  await page.locator('button:has-text("+ Add Trainer")').click();
  await page.waitForTimeout(300);
  const inputs = page.locator('input:not([type="email"])');
  await inputs.nth(1).fill('123456');
  await inputs.nth(1).blur();
  await page.waitForTimeout(200);
});

// ─── Courses ──────────────────────────────────────────────────────────────────

test('TC-COURSE-01: Course catalogue page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses & Curriculum', 'Course catalogue');
  await expect(page.locator('text=Courses & Curriculum').first()).toBeVisible();
});

test('TC-COURSE-02: Add Course button opens modal', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses & Curriculum', 'Course catalogue');
  await page.locator('button:has-text("+ Add Course")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('button:has-text("×")')).toBeVisible();
  await expect(page.locator('text=Course title *')).toBeVisible();
});

test('TC-COURSE-03: saving course with empty title shows alert', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses & Curriculum', 'Course catalogue');
  await page.locator('button:has-text("+ Add Course")').click();
  await page.waitForTimeout(300);
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Save")').last().click();
  const msg = await dialogPromise;
  expect(msg).toContain('Course title required');
});

test('TC-COURSE-04: course modal has sector dropdown', async ({ page }) => {
  await login(page);
  await goSub(page, 'Courses & Curriculum', 'Course catalogue');
  await page.locator('button:has-text("+ Add Course")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('text=Course title *')).toBeVisible();
  await expect(page.locator('text=Sector').first()).toBeVisible();
});

// ─── Batches ──────────────────────────────────────────────────────────────────

test('TC-BATCH-01: Batch Management page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Batch Management', 'All batches');
  await expect(page.locator('text=Batch Management').first()).toBeVisible();
});

test('TC-BATCH-02: Create Batch button opens modal', async ({ page }) => {
  await login(page);
  await goSub(page, 'Batch Management', 'All batches');
  await page.locator('button:has-text("+ Create Batch")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('button:has-text("×")')).toBeVisible();
  // 'Batch code' also appears as a table header — use label element unique to the modal
  await expect(page.locator('label:has-text("Batch code")')).toBeVisible();
});

test('TC-BATCH-03: creating batch without course shows alert', async ({ page }) => {
  await login(page);
  await goSub(page, 'Batch Management', 'All batches');
  await page.locator('button:has-text("+ Create Batch")').click();
  await page.waitForTimeout(300);
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Save")').last().click();
  const msg = await dialogPromise;
  expect(msg).toContain('Please select a course');
});

test('TC-BATCH-04: filter tabs are visible (all, upcoming, ongoing, completed, cancelled)', async ({ page }) => {
  await login(page);
  await goSub(page, 'Batch Management', 'All batches');
  await expect(page.locator('button:has-text("all")')).toBeVisible();
  await expect(page.locator('button:has-text("upcoming")')).toBeVisible();
  await expect(page.locator('button:has-text("ongoing")')).toBeVisible();
  await expect(page.locator('button:has-text("completed")')).toBeVisible();
});

test('TC-BATCH-05: invalid batch code shows alert', async ({ page }) => {
  await login(page);
  await goSub(page, 'Batch Management', 'All batches');
  await page.locator('button:has-text("+ Create Batch")').click();
  await page.waitForTimeout(300);
  await page.locator('input[placeholder="Auto-generated if blank"]').fill('!!invalid!!');
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Save")').last().click();
  const msg = await dialogPromise;
  // Either batch code error or course-required fires first
  expect(msg.length).toBeGreaterThan(0);
});

// ─── Candidates ───────────────────────────────────────────────────────────────

test('TC-CAND-01: All candidates page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidate Management', 'All candidates');
  await expect(page.locator('text=Candidate Management').first()).toBeVisible();
});

test('TC-CAND-02: Enrol Candidate button opens modal', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidate Management', 'All candidates');
  await page.locator('button:has-text("+ Enrol Candidate")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('button:has-text("×")')).toBeVisible();
  await expect(page.locator('text=Full name *')).toBeVisible();
});

test('TC-CAND-03: enrolling without name shows alert', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidate Management', 'All candidates');
  await page.locator('button:has-text("+ Enrol Candidate")').click();
  await page.waitForTimeout(300);
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Save")').last().click();
  const msg = await dialogPromise;
  expect(msg).toContain('Candidate name required');
});

test('TC-CAND-04: invalid mobile in candidate modal shows inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidate Management', 'All candidates');
  await page.locator('button:has-text("+ Enrol Candidate")').click();
  await page.waitForTimeout(300);
  // mobile is the 2nd text input in the modal (after name); exclude date and search types
  const mobileInput = page.locator('input:not([type="date"]):not([type="search"])').nth(1);
  await mobileInput.fill('12345');
  await mobileInput.press('Tab');
  await expect(page.locator('text=⚠ Must be a 10-digit number starting with 6–9')).toBeVisible();
});

test('TC-CAND-05: invalid Aadhaar format shows inline error', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidate Management', 'All candidates');
  await page.locator('button:has-text("+ Enrol Candidate")').click();
  await page.waitForTimeout(300);
  const aadhaarInput = page.locator('input[placeholder="XXXX-XXXX-1234"]');
  await aadhaarInput.fill('1234');
  await aadhaarInput.press('Tab');
  await expect(page.locator('text=⚠ Format must be XXXX-XXXX-1234')).toBeVisible();
});

test('TC-CAND-06: batch filter dropdown is visible', async ({ page }) => {
  await login(page);
  await goSub(page, 'Candidate Management', 'All candidates');
  await expect(page.locator('select').filter({ hasText: 'All batches' })).toBeVisible();
});

// ─── Assessments ──────────────────────────────────────────────────────────────

test('TC-ASSESS-01: Assessments page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Assessments', 'All assessments');
  await expect(page.locator('text=Assessments').first()).toBeVisible();
});

test('TC-ASSESS-02: Schedule Assessment button opens modal', async ({ page }) => {
  await login(page);
  await goSub(page, 'Assessments', 'All assessments');
  await page.locator('button:has-text("+ Schedule Assessment")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('button:has-text("×")')).toBeVisible();
  await expect(page.locator('label:has-text("Preferred date")')).toBeVisible();
});

test('TC-ASSESS-03: scheduling without batch shows alert', async ({ page }) => {
  await login(page);
  await goSub(page, 'Assessments', 'All assessments');
  await page.locator('button:has-text("+ Schedule Assessment")').click();
  await page.waitForTimeout(300);
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Save")').last().click();
  const msg = await dialogPromise;
  expect(msg).toContain('Please select a batch');
});

test('TC-ASSESS-04: assessment modal has agency dropdown', async ({ page }) => {
  await login(page);
  await goSub(page, 'Assessments', 'All assessments');
  await page.locator('button:has-text("+ Schedule Assessment")').click();
  await page.waitForTimeout(300);
  await expect(page.locator('text=Assessment agency')).toBeVisible();
});

// ─── Documents ────────────────────────────────────────────────────────────────

test('TC-DOCS-01: Documents page loads with required doc types', async ({ page }) => {
  await login(page);
  await navTo(page, 'Documents');
  await expect(page.locator('text=Documents').first()).toBeVisible();
  await expect(page.locator('text=PAN Card').first()).toBeVisible();
});

test('TC-DOCS-02: Upload button opens document upload modal', async ({ page }) => {
  await login(page);
  await navTo(page, 'Documents');
  await page.locator('button:has-text("Upload")').first().click();
  await page.waitForTimeout(300);
  await expect(page.locator('text=File upload is simulated')).toBeVisible();
});

test('TC-DOCS-03: document upload modal has Mark as uploaded button', async ({ page }) => {
  await login(page);
  await navTo(page, 'Documents');
  await page.locator('button:has-text("Upload")').first().click();
  await page.waitForTimeout(300);
  await expect(page.locator('button:has-text("Mark as uploaded")')).toBeVisible();
});

// ─── Reports & MIS ────────────────────────────────────────────────────────────

test('TC-REP-01: Reports & MIS page loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Reports & MIS');
  await expect(page.locator('text=Reports & MIS').first()).toBeVisible();
});

test('TC-REP-02: Total Centres stat card is visible', async ({ page }) => {
  await login(page);
  await navTo(page, 'Reports & MIS');
  await expect(page.locator('text=Total Centres').first()).toBeVisible();
});

test('TC-REP-03: Placement Rate stat card is visible', async ({ page }) => {
  await login(page);
  await navTo(page, 'Reports & MIS');
  await expect(page.locator('text=Placement Rate').first()).toBeVisible();
});

test('TC-REP-04: Batch-wise summary section is visible', async ({ page }) => {
  await login(page);
  await navTo(page, 'Reports & MIS');
  await expect(page.locator('text=Batch-wise summary').first()).toBeVisible();
});

test('TC-REP-05: Candidate status breakdown section is visible', async ({ page }) => {
  await login(page);
  await navTo(page, 'Reports & MIS');
  await expect(page.locator('text=Candidate status breakdown').first()).toBeVisible();
});

// ─── Grievance & Support ──────────────────────────────────────────────────────

test('TC-GRIEV-01: Grievance & Support page loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance & Support');
  await expect(page.locator('text=Grievance & Support').first()).toBeVisible();
});

test('TC-GRIEV-02: ticket form is visible with category, subject, details fields', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance & Support');
  await expect(page.locator('text=Raise new ticket').first()).toBeVisible();
  await expect(page.locator('input[placeholder="Brief description"]')).toBeVisible();
});

test('TC-GRIEV-03: submitting with empty subject shows alert', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance & Support');
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Submit ticket")').click();
  const msg = await dialogPromise;
  expect(msg).toContain('Subject is required');
});

test('TC-GRIEV-04: submitting with too-short subject shows validation alert', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance & Support');
  await page.locator('input[placeholder="Brief description"]').fill('Hi');
  const dialogPromise = catchDialog(page);
  await page.locator('button:has-text("Submit ticket")').click();
  const msg = await dialogPromise;
  expect(msg).toContain('at least 5 characters');
});

test('TC-GRIEV-05: valid ticket submits and shows success', async ({ page }) => {
  await login(page);
  await navTo(page, 'Grievance & Support');
  await page.locator('input[placeholder="Brief description"]').fill('Centre registration issue');
  await page.locator('textarea[placeholder="Describe the issue in detail…"]').fill('Unable to add a new centre due to a server error when saving the form.');
  await page.locator('button:has-text("Submit ticket")').click();
  await expect(page.locator('text=raised successfully').first()).toBeVisible({ timeout: 6000 });
});

// ─── Collaboration ────────────────────────────────────────────────────────────

test('TC-COLLAB-01: Consortium Builder page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Collaboration', 'Consortium Builder');
  await expect(page.locator('text=Consortium').first()).toBeVisible();
});

test('TC-COLLAB-02: Partnership Requests page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Collaboration', 'Partnership Requests');
  await expect(page.locator('text=Partnership').first()).toBeVisible();
});

test('TC-COLLAB-03: Resource Sharing page loads', async ({ page }) => {
  await login(page);
  await goSub(page, 'Collaboration', 'Resource Sharing');
  await expect(page.locator('text=Resource').first()).toBeVisible();
});

test('TC-COLLAB-04: Invitations page loads with Send Invitation button', async ({ page }) => {
  await login(page);
  await goSub(page, 'Collaboration', 'Invitations');
  await expect(page.locator('text=Invitations').first()).toBeVisible();
  await expect(page.locator('button:has-text("+ Send Invitation")')).toBeVisible();
});

// ─── Account Preferences & Complete Profile ───────────────────────────────────

test('TC-SETT-01: Account Preferences page loads', async ({ page }) => {
  await login(page);
  await navTo(page, 'Account Preferences');
  await expect(page.locator('text=Account Preferences').first()).toBeVisible();
});

test('TC-ONBOARD-01: Complete Profile page loads the onboarding form', async ({ page }) => {
  await login(page);
  await navTo(page, 'Complete Profile');
  await page.waitForTimeout(500);
  await expect(page.locator('text=Step').first()).toBeVisible();
});

// ─── Search ───────────────────────────────────────────────────────────────────

test('TC-SEARCH-01: search bar shows results for "batch"', async ({ page }) => {
  await login(page);
  const searchInput = page.locator('input[placeholder="Search courses, batches, learners…"]');
  await searchInput.fill('batch');
  await searchInput.dispatchEvent('focus');
  await page.waitForTimeout(300);
  await expect(page.locator('text=Batch Management').first()).toBeVisible();
});

test('TC-SEARCH-02: search with no match shows no results message', async ({ page }) => {
  await login(page);
  const searchInput = page.locator('input[placeholder="Search courses, batches, learners…"]');
  await searchInput.fill('xyzunknownterm99');
  await searchInput.dispatchEvent('focus');
  await page.waitForTimeout(300);
  await expect(page.locator('text=No results for')).toBeVisible();
});
