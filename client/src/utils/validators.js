// Standard Indian form field validators — return error string or '' if valid

export const PATTERNS = {
  name:      /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ\s'.\-]{1,99}$/,
  mobile:    /^[6-9]\d{9}$/,
  email:     /^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/,
  pincode:   /^\d{6}$/,
  gst:       /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/,
  pan:       /^[A-Z]{5}\d{4}[A-Z]{1}$/,
  tan:       /^[A-Z]{4}\d{5}[A-Z]{1}$/,
  cin:       /^[A-Z]{1}\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/,
  udyam:     /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/,
  msme:      /^[A-Z]{2}-[A-Z]{2}-\d{2}-\d{7}$/,
  ifsc:      /^[A-Z]{4}0[A-Z0-9]{6}$/,
  aadhaar:   /^\d{12}$/,
  website:   /^https?:\/\/.+\..+/,
  phone:     /^[0-9\-\s\+\(\)]{7,15}$/,
  // New patterns
  year:      /^(19[0-9]{2}|20[0-9]{2}|2100)$/,           // 1900–2100
  bankAcct:  /^\d{9,18}$/,                                 // 9–18 digit account number
  batchCode: /^[A-Za-z0-9][A-Za-z0-9\-_]{1,19}$/,        // 2–20 alphanumeric/dash/underscore
  fy:        /^\d{4}-\d{2}$|^\d{4}-\d{4}$/,               // 2025-26 or 2025-2026
  certNo:    /^[A-Za-z0-9\-/]{4,30}$/,                    // certificate / ref number
};

export const MESSAGES = {
  name:      'Name must contain only letters, spaces, hyphens, apostrophes or dots (2–100 characters)',
  mobile:    'Must be a 10-digit number starting with 6–9',
  email:     'Enter a valid email address (e.g. name@example.com)',
  pincode:   'Must be a 6-digit PIN code',
  gst:       'Invalid GSTIN — format: 29AAACT1234A1ZK (15 chars)',
  pan:       'Invalid PAN — format: ABCDE1234F (10 chars)',
  tan:       'Invalid TAN — format: PDES03028F (10 chars)',
  cin:       'Invalid CIN — format: U72200KA2015PTC082341 (21 chars)',
  udyam:     'Invalid Udyam number — format: UDYAM-MH-00-0000000 (19 chars)',
  msme:      'Invalid MSME number — format: MH-MU-00-0000000 (16 chars)',
  ifsc:      'Invalid IFSC — format: HDFC0001234 (11 chars)',
  aadhaar:   'Must be a 12-digit Aadhaar number',
  website:   'Enter a valid URL starting with http:// or https://',
  phone:     'Enter a valid phone / landline number',
  // New messages
  year:      'Enter a valid 4-digit year (1900–2100)',
  bankAcct:  'Account number must be 9–18 digits',
  batchCode: 'Batch code must be 2–20 characters (letters, digits, dash or underscore)',
  fy:        'Enter a valid financial year — format: 2025-26 or 2025-2026',
  certNo:    'Certificate number must be 4–30 alphanumeric characters',
};

// Fields that should be auto-uppercased
export const UPPERCASE_FIELDS = new Set(['gst', 'pan', 'tan', 'cin', 'udyam', 'msme', 'ifsc', 'batchCode', 'certNo']);

export function validate(type, value) {
  if (!value || !value.trim()) return '';
  const v = UPPERCASE_FIELDS.has(type) ? value.trim().toUpperCase() : value.trim();
  if (type === 'email') {
    if (v.length > 254) return 'Email must be 254 characters or fewer';
    if (/\.\./.test(v)) return 'Email must not contain consecutive dots';
  }
  return PATTERNS[type]?.test(v) ? '' : (MESSAGES[type] || 'Invalid value');
}

// ── Numeric range helpers ─────────────────────────────────────────────────────

/** Validates a positive integer (count, qty, questions). Returns error string or ''. */
export function validatePosInt(value, label = 'Value', max = 9999) {
  if (!value && value !== 0) return '';
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return `${label} must be a whole number ≥ 1`;
  if (n > max) return `${label} must be ≤ ${max}`;
  return '';
}

/** Validates a positive decimal (duration in hours/minutes, salary). Returns error string or ''. */
export function validatePositiveNum(value, label = 'Value', min = 0, max = 999999) {
  if (!value && value !== 0) return '';
  const n = Number(value);
  if (isNaN(n)) return `${label} must be a number`;
  if (n < min) return `${label} must be ≥ ${min}`;
  if (n > max) return `${label} must be ≤ ${max}`;
  return '';
}

/** Validates year of passing — must be between startYear and current year. */
export function validatePassingYear(value, label = 'Year of Passing') {
  if (!value || !String(value).trim()) return '';
  const n = Number(value);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(n) || n < 1950 || n > currentYear) {
    return `${label} must be a 4-digit year between 1950 and ${currentYear}`;
  }
  return '';
}

/** Validates score/percentage — 0 to 100 or a grade string like "A+", "8.5 CGPA". */
export function validateScore(value) {
  if (!value || !String(value).trim()) return '';
  const v = String(value).trim();
  // Accept formats: "85", "85.5", "85%", "8.5 CGPA", "A+", "B"
  if (/^[A-Fa-f][+\-]?$/.test(v)) return '';           // letter grade
  if (/^\d{1,3}(\.\d{1,2})?\s*(CGPA|GPA|%)?$/i.test(v)) {
    const n = parseFloat(v);
    if (n < 0 || n > 100) return 'Score must be between 0 and 100';
    return '';
  }
  return 'Enter a valid score: e.g. 85, 85%, 8.5 CGPA, or A+';
}

/** Validates that salary_max >= salary_min. Returns error on the max field. */
export function validateSalaryRange(min, max) {
  const lo = Number(min), hi = Number(max);
  if (!min || !max) return '';
  if (isNaN(lo) || lo < 0) return 'Minimum salary must be a positive number';
  if (isNaN(hi) || hi < 0) return 'Maximum salary must be a positive number';
  if (hi < lo) return 'Maximum salary must be ≥ minimum salary';
  return '';
}

/** Validates passing marks ≤ total marks. */
export function validatePassingMarks(passing, total) {
  const p = Number(passing), t = Number(total);
  if (!passing) return '';
  if (isNaN(p) || p < 0) return 'Passing marks must be a positive number';
  if (total && !isNaN(t) && p > t) return 'Passing marks cannot exceed total marks';
  return '';
}

/** Validates a plain text field with minLength and maxLength. */
export function validateText(value, label, { min = 1, max = 200 } = {}) {
  if (!value || !value.trim()) return '';
  const v = value.trim();
  if (v.length < min) return `${label} must be at least ${min} characters`;
  if (v.length > max) return `${label} must be at most ${max} characters`;
  return '';
}

/** Validates a free-text date like "Jan 2020" or "MM/YYYY". Returns error or ''. */
export function validateMonthYear(value, label = 'Date') {
  if (!value || !value.trim()) return '';
  const v = value.trim();
  // Accept: "Jan 2020", "January 2020", "01/2020", "2020-01", "Present", "present", "Till Date"
  if (/^(present|till date|current|ongoing)$/i.test(v)) return '';
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}$/i.test(v)) return '';
  if (/^\d{2}\/\d{4}$/.test(v)) return '';
  if (/^\d{4}-\d{2}$/.test(v)) return '';
  return `${label} format should be like "Jan 2020", "01/2020" or "Present"`;
}
