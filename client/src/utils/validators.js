// Standard Indian form field validators — return error string or '' if valid

export const PATTERNS = {
  name:    /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ\s'.\-]{1,99}$/,
  mobile:  /^[6-9]\d{9}$/,
  email:   /^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/,
  pincode: /^\d{6}$/,
  gst:     /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/,
  pan:     /^[A-Z]{5}\d{4}[A-Z]{1}$/,
  tan:     /^[A-Z]{4}\d{5}[A-Z]{1}$/,
  cin:     /^[A-Z]{1}\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/,
  udyam:   /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/,
  ifsc:    /^[A-Z]{4}0[A-Z0-9]{6}$/,
  aadhaar: /^\d{12}$/,
  website: /^https?:\/\/.+\..+/,
  phone:   /^[0-9\-\s\+\(\)]{7,15}$/,
};

export const MESSAGES = {
  name:    'Name must contain only letters, spaces, hyphens, apostrophes or dots (2–100 characters)',
  mobile:  'Must be a 10-digit number starting with 6–9',
  email:   'Enter a valid email address (e.g. name@example.com)',
  pincode: 'Must be a 6-digit PIN code',
  gst:     'Invalid GSTIN — format: 29AAACT1234A1ZK (15 chars)',
  pan:     'Invalid PAN — format: ABCDE1234F (10 chars)',
  tan:     'Invalid TAN — format: PDES03028F (10 chars)',
  cin:     'Invalid CIN — format: U72200KA2015PTC082341 (21 chars)',
  udyam:   'Invalid Udyam number — format: UDYAM-MH-00-0000000 (19 chars)',
  ifsc:    'Invalid IFSC — format: HDFC0001234 (11 chars)',
  aadhaar: 'Must be a 12-digit Aadhaar number',
  website: 'Enter a valid URL starting with http:// or https://',
  phone:   'Enter a valid phone / landline number',
};

// Fields that should be auto-uppercased
export const UPPERCASE_FIELDS = new Set(['gst', 'pan', 'tan', 'cin', 'udyam', 'ifsc']);

export function validate(type, value) {
  if (!value || !value.trim()) return '';
  const v = UPPERCASE_FIELDS.has(type) ? value.trim().toUpperCase() : value.trim();
  if (type === 'email') {
    if (v.length > 254) return 'Email must be 254 characters or fewer';
    if (/\.\./.test(v)) return 'Email must not contain consecutive dots';
  }
  return PATTERNS[type]?.test(v) ? '' : (MESSAGES[type] || 'Invalid value');
}
