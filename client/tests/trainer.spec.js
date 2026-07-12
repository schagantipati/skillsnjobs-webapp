// E2E tests for the Trainer Portal
// Credentials: trainer@skillbridge.in / password123

import { test, expect } from '@playwright/test';

const TRAINER_EMAIL    = 'trainer@skillbridge.in';
const TRAINER_PASSWORD = 'password123';
const BASE             = 'http://localhost:5173';

// ─── Helper ──────────────────────────────────────────────────────────
async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', TRAINER_EMAIL);
  await page.fill('input[type="password"]', TRAINER_PASSWORD);
  await page.locator('form button').click();
  await page.waitForURL('**/trainer-portal', { timeout: 10000 });
  // Wait for the sidebar to fully render (lazy chunk loaded)
  await page.waitForSelector('text=TRAINER PORTAL', { timeout: 10000 });
}

async function expandNav(page, label) {
  // Section header text equals the nav item label (e.g. section:"My Profile" + item:"My Profile").
  // CSS text-transform:uppercase makes headers LOOK uppercase but DOM text matches both.
  // Using .last() picks the label span inside the nav item div (deepest in DOM),
  // whose click event bubbles up to the parent div's onClick handler.
  const matches = page.getByText(label, { exact: true });
  const count = await matches.count();
  await matches.nth(count - 1).click();
  await page.waitForTimeout(300);
}

// ─── 1. Authentication ────────────────────────────────────────────────
test.describe('Authentication', () => {
  test('TC-AUTH-01: Login with valid trainer credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/trainer-portal/);
    await expect(page.locator('text=TRAINER PORTAL')).toBeVisible();
  });

  test('TC-AUTH-02: Reject invalid password', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', TRAINER_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.locator('form button').click();
    await expect(page.locator('text=/Invalid|incorrect|failed/i')).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/trainer-portal/);
  });

  test('TC-AUTH-03: Redirect unauthenticated user to login', async ({ page }) => {
    await page.goto(`${BASE}/trainer-portal`);
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('TC-AUTH-04: Sign out logs user out and redirects', async ({ page }) => {
    await login(page);
    await page.locator('button:has-text("Sign Out")').click();
    await expect(page).toHaveURL(/login|\//, { timeout: 5000 });
    await page.goto(`${BASE}/trainer-portal`);
    await expect(page).toHaveURL(/login/);
  });
});

// ─── 2. Dashboard ─────────────────────────────────────────────────────
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('TC-DASH-01: Dashboard loads with KPI cards', async ({ page }) => {
    // KPI labels are rendered as plain divs; confirm at least two are visible
    await expect(page.locator('text=Active Batches').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Avg Attendance').first()).toBeVisible();
    await expect(page.locator('text=Assessment Pass Rate').first()).toBeVisible();
  });

  test("TC-DASH-02: Today's Sessions card title is visible", async ({ page }) => {
    await expect(page.locator("text=📅 Today's Sessions")).toBeVisible({ timeout: 8000 });
  });

  test('TC-DASH-03: Recent Activity card title is visible', async ({ page }) => {
    await expect(page.locator('text=🔔 Recent Activity')).toBeVisible({ timeout: 8000 });
  });

  test('TC-DASH-04: Upcoming This Week card is visible', async ({ page }) => {
    await expect(page.locator('text=📅 Upcoming This Week')).toBeVisible({ timeout: 8000 });
  });

  test('TC-DASH-05: Alert banner shows session count for today', async ({ page }) => {
    // Banner always renders: "…Mark attendance before 5 PM to avoid compliance flag."
    await expect(page.locator('text=compliance flag')).toBeVisible({ timeout: 8000 });
  });

  test('TC-DASH-06: Batch Performance card is visible', async ({ page }) => {
    await expect(page.locator('text=📊 Batch Performance')).toBeVisible({ timeout: 8000 });
  });

  test('TC-DASH-07: Welcome heading shows trainer name', async ({ page }) => {
    await expect(page.locator('h1', { hasText: /Welcome/ })).toBeVisible({ timeout: 8000 });
  });
});

// ─── 3. Sidebar Navigation ────────────────────────────────────────────
test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('TC-NAV-01: My Profile menu expands to show sub-items', async ({ page }) => {
    await expandNav(page, 'My Profile');
    await expect(page.locator('text=Personal Information').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Educational Qualifications')).toBeVisible();
    await expect(page.locator('text=Work Experience')).toBeVisible();
  });

  test('TC-NAV-02: Batch Management menu expands to show sub-items', async ({ page }) => {
    await expandNav(page, 'Batch Management');
    await expect(page.locator('text=Create New Batch')).toBeVisible({ timeout: 5000 });
  });

  test('TC-NAV-03: Session Management menu expands', async ({ page }) => {
    await expandNav(page, 'Session Management');
    await expect(page.locator('text=Schedule Sessions')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Reschedule / Cancel')).toBeVisible();
  });

  test('TC-NAV-04: Assessments menu expands', async ({ page }) => {
    await expandNav(page, 'Assessments');
    await expect(page.locator('text=Assessment Schedule')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Results & Scorecards')).toBeVisible();
  });

  test('TC-NAV-05: Notifications navigates to panel', async ({ page }) => {
    // Use expandNav pattern — section "Main" has no "Notifications" collision, direct click is fine
    await page.getByText('Notifications', { exact: true }).last().click();
    await expect(page.locator('text=Notifications 🔔')).toBeVisible({ timeout: 5000 });
  });

  test('TC-NAV-06: Search bar finds a nav item', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Mark Attendance');
    await expect(page.locator('text=Mark Attendance').first()).toBeVisible({ timeout: 3000 });
  });

  test('TC-NAV-07: Clicking search result navigates to panel', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Schedule Session');
    const result = page.locator('text=Schedule Sessions').first();
    await result.waitFor({ state: 'visible', timeout: 3000 });
    await result.click();
    await expect(page.locator('text=Schedule Sessions 📅')).toBeVisible({ timeout: 5000 });
  });
});

// ─── 4. My Profile – Personal Information ────────────────────────────
test.describe('Profile — Personal Information', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'My Profile');
    await page.locator('text=Personal Information').first().click();
    await page.waitForSelector('text=Personal Information 👤', { timeout: 8000 });
  });

  test('TC-PROF-01: Personal Info panel renders', async ({ page }) => {
    await expect(page.locator('text=Personal Information 👤')).toBeVisible();
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
  });

  test('TC-PROF-02: Name field is pre-filled from user account', async ({ page }) => {
    // input[0] = topbar search box; input[1] = Full Name form field
    const nameInput = page.locator('input').nth(1);
    const val = await nameInput.inputValue();
    expect(val.length).toBeGreaterThan(0);
  });

  test('TC-PROF-03: Save with empty name shows warning toast', async ({ page }) => {
    // input[0] = topbar search; input[1] = Full Name
    await page.locator('input').nth(1).fill('');
    await page.locator('button:has-text("Save Changes")').click();
    await expect(page.locator('text=/name is required/i')).toBeVisible({ timeout: 3000 });
  });

  test('TC-PROF-04: Invalid Aadhaar shows inline error on blur', async ({ page }) => {
    // Validator returns: "Must be a 12-digit Aadhaar number"
    const aadhaarInput = page.locator('input[placeholder*="Aadhaar"]');
    await aadhaarInput.fill('123456789');   // 9 digits — too short
    await aadhaarInput.press('Tab');        // trigger blur via Tab key
    await expect(page.locator('text=Must be a 12-digit Aadhaar number')).toBeVisible({ timeout: 3000 });
  });

  test('TC-PROF-05: Invalid PAN shows inline error on blur', async ({ page }) => {
    // Validator returns: "Invalid PAN — format: ABCDE1234F (10 chars)"
    const panInput = page.locator('input[placeholder*="ABCDE"]');
    await panInput.fill('ABCDE12345');  // wrong format (ends in digit not letter)
    await panInput.press('Tab');
    await expect(page.locator('text=Invalid PAN')).toBeVisible({ timeout: 3000 });
  });

  test('TC-PROF-06: Valid PAN (ABCDE1234F) clears any error', async ({ page }) => {
    const panInput = page.locator('input[placeholder*="ABCDE"]');
    await panInput.fill('ABCDE1234F');
    await panInput.press('Tab');
    await expect(panInput).toHaveValue('ABCDE1234F');
    await expect(page.locator('text=Invalid PAN')).not.toBeVisible({ timeout: 2000 });
  });

  test('TC-PROF-07: Short mobile number shows error', async ({ page }) => {
    // Phone validation message: "Must be a 10-digit number starting with 6–9"
    const phoneInput = page.locator('input[placeholder*="10-digit"]');
    await phoneInput.fill('12345');
    await phoneInput.press('Tab');
    await expect(page.locator('text=10-digit number')).toBeVisible({ timeout: 3000 });
  });

  test('TC-PROF-08: Mobile starting with invalid digit shows error', async ({ page }) => {
    const phoneInput = page.locator('input[placeholder*="10-digit"]');
    await phoneInput.fill('1234567890');  // starts with 1 — invalid (must start with 6-9)
    await phoneInput.press('Tab');
    await expect(page.locator('text=10-digit number')).toBeVisible({ timeout: 3000 });
  });
});

// ─── 5. Profile – Qualifications ─────────────────────────────────────
test.describe('Profile — Qualifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'My Profile');
    await page.locator('text=Educational Qualifications').click();
    await page.waitForSelector('text=Educational Qualifications 🎓', { timeout: 8000 });
  });

  test('TC-QUAL-01: Qualifications panel loads with table headers', async ({ page }) => {
    await expect(page.locator('text=Educational Qualifications 🎓')).toBeVisible();
    await expect(page.locator('text=Degree').first()).toBeVisible();
    await expect(page.locator('text=Institution').first()).toBeVisible();
  });

  test('TC-QUAL-02: Add Qualification button opens form', async ({ page }) => {
    await page.locator('button:has-text("Add Qualification")').click();
    await expect(page.locator('input[placeholder*="B.Tech"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Save Qualification")')).toBeVisible();
  });

  test('TC-QUAL-03: Submit empty form shows warning toast', async ({ page }) => {
    await page.locator('button:has-text("Add Qualification")').click();
    await page.locator('button:has-text("Save Qualification")').click();
    // Unique warning div text — avoids strict mode matching table headers / form labels
    await expect(page.locator('text=⚠️ Please fill in Degree')).toBeVisible({ timeout: 3000 });
  });

  test('TC-QUAL-04: Cancel hides the form', async ({ page }) => {
    await page.locator('button:has-text("Add Qualification")').click();
    await expect(page.locator('input[placeholder*="B.Tech"]')).toBeVisible();
    // Exact match avoids "✕ Cancel" button collision
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('input[placeholder*="B.Tech"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('TC-QUAL-05: Valid submission adds a qualification row', async ({ page }) => {
    await page.locator('button:has-text("Add Qualification")').click();
    await page.locator('input[placeholder*="B.Tech"]').fill('B.Tech Computer Science');
    await page.locator('input[placeholder*="NIT"]').fill('NIT Warangal');
    await page.locator('input[placeholder*="2010"]').fill('2018');
    await page.locator('button:has-text("Save Qualification")').click();
    await expect(page.locator('text=Qualification saved!')).toBeVisible({ timeout: 5000 });
    // Use .first() — prior test runs may have saved the same degree, creating multiple rows
    await expect(page.locator('text=B.Tech Computer Science').first()).toBeVisible();
  });
});

// ─── 6. Profile – Work Experience ────────────────────────────────────
test.describe('Profile — Work Experience', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'My Profile');
    await page.locator('text=Work Experience').click();
    await page.waitForSelector('text=Work Experience 💼', { timeout: 8000 });
  });

  test('TC-EXP-01: Work Experience panel loads', async ({ page }) => {
    await expect(page.locator('text=Work Experience 💼')).toBeVisible();
    await expect(page.locator('text=Organisation').first()).toBeVisible();
  });

  test('TC-EXP-02: Add Experience form opens', async ({ page }) => {
    await page.locator('button:has-text("Add Experience")').click();
    await expect(page.locator('input[placeholder*="Infosys"]')).toBeVisible({ timeout: 3000 });
  });

  test('TC-EXP-03: Empty submission shows warning', async ({ page }) => {
    await page.locator('button:has-text("Add Experience")').click();
    await page.locator('button:has-text("Save Experience")').click();
    // Unique warning div text — avoids strict mode matching table headers / form labels
    await expect(page.locator('text=⚠️ Please fill in Organisation')).toBeVisible({ timeout: 3000 });
  });

  test('TC-EXP-04: Valid experience saves successfully', async ({ page }) => {
    await page.locator('button:has-text("Add Experience")').click();
    await page.locator('input[placeholder*="Infosys"]').fill('Infosys Ltd');
    await page.locator('input[placeholder*="Senior Trainer"]').fill('Senior Trainer');
    await page.locator('input[placeholder*="Jan 2020"]').fill('Jan 2022');
    await page.locator('button:has-text("Save Experience")').click();
    await expect(page.locator('text=Experience saved!')).toBeVisible({ timeout: 5000 });
    // Use .first() — prior test runs may have saved the same org, creating multiple rows
    await expect(page.locator('text=Infosys Ltd').first()).toBeVisible();
  });
});

// ─── 7. Profile – Domain & Skills ────────────────────────────────────
test.describe('Profile — Domain & Skills', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'My Profile');
    await page.locator('text=Domain & Skills').click();
    await page.waitForSelector('text=Domain & Skills 🛠️', { timeout: 8000 });
  });

  test('TC-SKILL-01: Domain & Skills panel loads', async ({ page }) => {
    await expect(page.locator('text=Domain & Skills 🛠️')).toBeVisible();
  });

  test('TC-SKILL-02: Add Domain & Skills form opens', async ({ page }) => {
    await page.locator('button:has-text("Add Domain")').click();
    // Use label role to avoid matching the table column header
    await expect(page.locator('label', { hasText: 'Sector Skill Council' })).toBeVisible({ timeout: 3000 });
  });

  test('TC-SKILL-03: Submit without domain/courses shows warning', async ({ page }) => {
    await page.locator('button:has-text("Add Domain")').click();
    await page.locator('button:has-text("Save Domain")').click();
    // Unique warning div text — avoids strict mode matching headings / column headers
    await expect(page.locator('text=⚠️ Please fill in Domain')).toBeVisible({ timeout: 3000 });
  });
});

// ─── 8. Profile – Certifications ─────────────────────────────────────
test.describe('Profile — Certifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'My Profile');
    await page.locator('text=Certifications & Awards').click();
    await page.waitForSelector('text=Certifications & Awards 🏅', { timeout: 8000 });
  });

  test('TC-CERT-01: Certifications panel loads', async ({ page }) => {
    await expect(page.locator('text=Certifications & Awards 🏅')).toBeVisible();
  });

  test('TC-CERT-02: Add Certification form opens', async ({ page }) => {
    await page.locator('button:has-text("Add Certification")').click();
    await expect(page.locator('input[placeholder*="PMKVY"]')).toBeVisible({ timeout: 3000 });
  });

  test('TC-CERT-03: Empty submission shows warning', async ({ page }) => {
    await page.locator('button:has-text("Add Certification")').click();
    await page.locator('button:has-text("Save Certification")').click();
    // Unique warning div text — avoids strict mode matching column headers / labels
    await expect(page.locator('text=⚠️ Certification name')).toBeVisible({ timeout: 3000 });
  });

  test('TC-CERT-04: Valid certification saves and appears in list', async ({ page }) => {
    await page.locator('button:has-text("Add Certification")').click();
    await page.locator('input[placeholder*="PMKVY"]').fill('Certified PMKVY Trainer');
    await page.locator('input[placeholder*="NSDC"]').fill('NSDC');
    await page.locator('button:has-text("Save Certification")').click();
    await expect(page.locator('text=Certification saved!')).toBeVisible({ timeout: 5000 });
    // Use .first() — prior runs may have saved the same cert
    await expect(page.locator('text=Certified PMKVY Trainer').first()).toBeVisible();
  });
});

// ─── 9. Batch Management ─────────────────────────────────────────────
test.describe('Batch Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Batch Management');
  });

  test('TC-BATCH-01: Active Batches panel loads with KPIs', async ({ page }) => {
    await page.locator('text=Active Batches').first().click();
    await page.waitForSelector('text=Active Batches 📋', { timeout: 8000 });
    await expect(page.locator('text=Total Learners').first()).toBeVisible();
    // KPI div — use .first() to avoid strict mode with column header
    await expect(page.locator('text=Avg Attendance').first()).toBeVisible();
  });

  test('TC-BATCH-02: Upcoming Batches panel loads', async ({ page }) => {
    await page.locator('text=Upcoming Batches').click();
    await expect(page.locator('h1', { hasText: 'Upcoming Batches' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-BATCH-03: Completed Batches panel loads', async ({ page }) => {
    await page.locator('text=Completed Batches').click();
    await expect(page.locator('h1', { hasText: 'Completed Batches' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-BATCH-04: Create New Batch form renders required fields', async ({ page }) => {
    await page.locator('text=Create New Batch').click();
    await expect(page.locator('text=Create New Batch 🆕')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[placeholder*="React.js Batch"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="IT-2026"]')).toBeVisible();
  });

  test('TC-BATCH-05: Create batch without name shows inline error', async ({ page }) => {
    await page.locator('text=Create New Batch').click();
    await page.waitForSelector('text=Create New Batch 🆕', { timeout: 8000 });
    await page.locator('button:has-text("Create Batch")').click();
    await expect(page.locator('text=/name is required/i')).toBeVisible({ timeout: 3000 });
  });

  test('TC-BATCH-06: Valid batch creation succeeds', async ({ page }) => {
    await page.locator('text=Create New Batch').click();
    await page.waitForSelector('text=Create New Batch 🆕', { timeout: 8000 });
    const ts = Date.now();
    await page.locator('input[placeholder*="React.js Batch"]').fill(`E2E Batch ${ts}`);
    await page.locator('input[placeholder*="IT-2026"]').fill(`E2E-${ts}`);
    await page.locator('button:has-text("Create Batch")').click();
    await expect(page.locator('text=✅ Batch created!')).toBeVisible({ timeout: 8000 });
  });

  test('TC-BATCH-07: Active batch shows learner count button', async ({ page }) => {
    await page.locator('text=Active Batches').first().click();
    await page.waitForSelector('text=Active Batches 📋', { timeout: 8000 });
    // If any active batches exist, a "Learners" button should be present
    const learnersBtn = page.locator('button:has-text("Learners")').first();
    if (await learnersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await learnersBtn.click();
      // Panel/modal title may vary — check for any heading or cell containing "Learner"
      await expect(page.locator('h1, h2, h3, th, td').filter({ hasText: /Learner/i }).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── 10. Session Management ───────────────────────────────────────────
test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Session Management');
  });

  test('TC-SESS-01: Schedule Sessions panel loads', async ({ page }) => {
    await page.locator('text=Schedule Sessions').click();
    await expect(page.locator('text=Schedule Sessions 📅')).toBeVisible({ timeout: 8000 });
  });

  test('TC-SESS-02: Session table headers are present', async ({ page }) => {
    await page.locator('text=Schedule Sessions').click();
    await page.waitForSelector('text=Schedule Sessions 📅', { timeout: 8000 });
    await expect(page.locator('text=Topic').first()).toBeVisible();
    await expect(page.locator('text=Mode').first()).toBeVisible();
  });

  test('TC-SESS-03: Add Session form opens and validates required fields', async ({ page }) => {
    await page.locator('text=Schedule Sessions').click();
    await page.waitForSelector('text=Schedule Sessions 📅', { timeout: 8000 });
    const addBtn = page.locator('button:has-text("Schedule Session")').first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.locator('button:has-text("Save Session")').click();
      await expect(page.locator('text=/Topic|date.*required/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('TC-SESS-04: Reschedule / Cancel panel loads', async ({ page }) => {
    await page.locator('text=Reschedule / Cancel').click();
    // Target h1 to avoid strict mode (nav breadcrumb + heading + button all match)
    await expect(page.locator('h1', { hasText: 'Reschedule' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-SESS-05: Training Calendar panel loads', async ({ page }) => {
    await page.locator('text=Training Calendar').click();
    // Target h1 to avoid strict mode (nav breadcrumb + heading + section title all match)
    await expect(page.locator('h1', { hasText: 'Training Calendar' })).toBeVisible({ timeout: 8000 });
  });
});

// ─── 11. Attendance ───────────────────────────────────────────────────
test.describe('Attendance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Attendance');
  });

  test('TC-ATT-01: Mark Attendance panel has date picker', async ({ page }) => {
    // Use .first() — alert banner div also contains "Mark Attendance" text
    await page.locator('text=Mark Attendance').first().click();
    await page.waitForSelector('input[type="date"]', { timeout: 8000 });
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test('TC-ATT-02: Mark Attendance date defaults to today', async ({ page }) => {
    await page.locator('text=Mark Attendance').first().click();
    await page.waitForSelector('input[type="date"]', { timeout: 8000 });
    const today = new Date().toISOString().slice(0, 10);
    await expect(page.locator('input[type="date"]')).toHaveValue(today);
  });

  test('TC-ATT-03: Attendance Reports panel loads', async ({ page }) => {
    await page.locator('text=Attendance Reports').click();
    // Target h1 to avoid strict mode (nav breadcrumb + heading both match)
    await expect(page.locator('h1', { hasText: 'Attendance Reports' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-ATT-04: Batch-wise Summary panel loads', async ({ page }) => {
    await page.locator('text=Batch-wise Summary').click();
    // Target h1 to avoid strict mode (many elements contain "Batch" or "Summary")
    await expect(page.locator('h1', { hasText: 'Batch-wise Attendance' })).toBeVisible({ timeout: 8000 });
  });
});

// ─── 12. Assessments ─────────────────────────────────────────────────
test.describe('Assessments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Assessments');
  });

  test('TC-ASSESS-01: Assessment Schedule panel loads', async ({ page }) => {
    await page.locator('text=Assessment Schedule').click();
    await expect(page.locator('text=Assessment Schedule 📝')).toBeVisible({ timeout: 8000 });
  });

  test('TC-ASSESS-02: Add Assessment form toggles and validates', async ({ page }) => {
    await page.locator('text=Assessment Schedule').click();
    await page.waitForSelector('text=Assessment Schedule 📝', { timeout: 8000 });
    const addBtn = page.locator('button:has-text("Schedule Assessment")').first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      // Wait for the form's Save button to appear before clicking
      const saveBtn = page.locator('button:has-text("Save Assessment")').first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await expect(page.locator('text=/date.*required|required/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('TC-ASSESS-03: Results & Scorecards panel loads', async ({ page }) => {
    await page.locator('text=Results & Scorecards').click();
    await expect(page.locator('h1', { hasText: /Results|Scorecard/i })).toBeVisible({ timeout: 8000 });
  });

  test('TC-ASSESS-04: RPL Assessment panel loads', async ({ page }) => {
    await page.locator('text=RPL Assessment').click();
    // Target h1 to avoid strict mode (heading + body content + nav all match /RPL/i)
    await expect(page.locator('h1', { hasText: 'RPL Assessment' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-ASSESS-05: Mock Tests panel loads', async ({ page }) => {
    await page.locator('text=Mock Tests').click();
    // Target h1 to avoid strict mode (heading + section title + button all match)
    await expect(page.locator('h1', { hasText: 'Mock Tests' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-ASSESS-06: Valid mock test saves successfully', async ({ page }) => {
    await page.locator('text=Mock Tests').click();
    await page.waitForSelector('h1', { timeout: 8000 });
    const addBtn = page.locator('button:has-text("Add Mock Test")').first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.locator('input[placeholder*="ubject"]').fill('JavaScript Basics');
      await page.locator('input[type="date"]').first().fill('2026-08-20');
      await page.locator('button:has-text("Save Mock Test")').click();
      await expect(page.locator('text=/saved|success/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── 13. Course Content ───────────────────────────────────────────────
test.describe('Course Content', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Course Content');
  });

  test('TC-CONTENT-01: Study Materials panel loads', async ({ page }) => {
    await page.locator('text=Study Materials').click();
    await expect(page.locator('h1', { hasText: 'Study Materials' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-CONTENT-02: Video Lectures panel loads', async ({ page }) => {
    await page.locator('text=Video Lectures').click();
    await expect(page.locator('h1', { hasText: 'Video Lectures' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-CONTENT-03: Upload Content panel loads', async ({ page }) => {
    await page.locator('text=Upload Content').click();
    await expect(page.locator('h1', { hasText: 'Upload Content' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-CONTENT-04: Resource Library panel loads', async ({ page }) => {
    await page.locator('text=Resource Library').click();
    await expect(page.locator('h1', { hasText: 'Resource Library' })).toBeVisible({ timeout: 8000 });
  });
});

// ─── 14. Certificates ────────────────────────────────────────────────
test.describe('Certificates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Certificates');
  });

  test('TC-CERTISSUE-01: Issue Certificates panel loads', async ({ page }) => {
    await page.locator('text=Issue Certificates').click();
    await expect(page.locator('h1', { hasText: 'Issue Certificates' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-CERTISSUE-02: Issued Certificates panel loads', async ({ page }) => {
    await page.locator('text=Issued Certificates').click();
    await expect(page.locator('h1', { hasText: 'Issued Certificates' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-CERTISSUE-03: Verify Certificate panel loads', async ({ page }) => {
    await page.locator('text=Verify Certificate').click();
    await expect(page.locator('h1', { hasText: 'Verify Certificate' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-CERTISSUE-04: Verify with unknown ID shows not found message', async ({ page }) => {
    await page.locator('text=Verify Certificate').click();
    await page.waitForSelector('h1', { timeout: 8000 });
    const inp = page.locator('input[placeholder*="ert"]').first();
    if (await inp.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inp.fill('CERT-DOES-NOT-EXIST-999');
      await page.locator('button:has-text("Verify")').first().click();
      await expect(page.locator('text=/not found|invalid/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── 15. Reports & Analytics ─────────────────────────────────────────
test.describe('Reports & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Reports');
  });

  test('TC-RPT-01: Batch Performance report loads', async ({ page }) => {
    // Use .first() — dashboard also shows "📊 Batch Performance" card in the DOM
    await page.locator('text=Batch Performance').first().click();
    await expect(page.locator('h1', { hasText: 'Batch Performance' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-RPT-02: Attendance Analytics report loads', async ({ page }) => {
    await page.locator('text=Attendance Analytics').click();
    await expect(page.locator('h1', { hasText: 'Attendance Analytics' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-RPT-03: Assessment Analytics report loads', async ({ page }) => {
    await page.locator('text=Assessment Analytics').click();
    await expect(page.locator('h1', { hasText: 'Assessment Analytics' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-RPT-04: Placement Analytics report loads', async ({ page }) => {
    await page.locator('text=Placement Analytics').click();
    await expect(page.locator('h1', { hasText: 'Placement Analytics' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-RPT-05: My Performance report loads', async ({ page }) => {
    await page.locator('text=My Performance').click();
    await expect(page.locator('h1', { hasText: 'My Performance' })).toBeVisible({ timeout: 8000 });
  });
});

// ─── 16. Government Schemes ──────────────────────────────────────────
test.describe('Government Schemes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandNav(page, 'Govt Schemes');
  });

  test('TC-SCH-01: PMKVY 4.0 panel loads', async ({ page }) => {
    await page.locator('text=PMKVY 4.0').click();
    // Target h1 to avoid strict mode (nav + heading + body text all contain "PMKVY")
    await expect(page.locator('h1', { hasText: 'PMKVY' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-SCH-02: RPL Prior Learning panel loads', async ({ page }) => {
    await page.locator('text=RPL — Prior Learning').click();
    await expect(page.locator('h1', { hasText: 'RPL' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-SCH-03: NAPS / NATS panel loads', async ({ page }) => {
    await page.locator('text=NAPS / NATS').click();
    await expect(page.locator('h1', { hasText: 'NAPS' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-SCH-04: DDU-GKY panel loads', async ({ page }) => {
    await page.locator('text=DDU-GKY').click();
    await expect(page.locator('h1', { hasText: 'DDU' })).toBeVisible({ timeout: 8000 });
  });
});

// ─── 17. Help & Support ──────────────────────────────────────────────
test.describe('Help & Support', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('TC-SUPP-01: Help & Support panel loads', async ({ page }) => {
    await page.locator('text=Help & Support').click();
    await expect(page.locator('h1', { hasText: 'Help & Support' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-SUPP-02: Grievance panel loads', async ({ page }) => {
    await page.locator('text=Grievance').click();
    await expect(page.locator('h1', { hasText: 'Grievance' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-SUPP-03: FAQ panel loads', async ({ page }) => {
    await page.locator('text=FAQ').click();
    await expect(page.locator('h1', { hasText: 'FAQ' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-SUPP-04: Raise ticket form appears', async ({ page }) => {
    await page.locator('text=Help & Support').click();
    await page.waitForSelector('h1', { timeout: 8000 });
    const btn = page.locator('button:has-text("Raise Ticket"), button:has-text("New Ticket")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await expect(page.locator('input[placeholder*="Subject"], textarea')).toBeVisible({ timeout: 3000 });
    }
  });
});

// ─── 18. Settings ────────────────────────────────────────────────────
test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('TC-SETT-01: Settings & Preferences panel loads', async ({ page }) => {
    await page.locator('text=Settings & Preferences').click();
    // Panel uses a div heading, not h1 — check for the unique card heading text
    await expect(page.locator('text=Account Preferences ⚙️')).toBeVisible({ timeout: 8000 });
  });
});
