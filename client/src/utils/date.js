const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// Converts any stored date to DD-MM-YYYY for display.
// Handles: YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, DD-MMM-YYYY (legacy)
export function formatDate(val) {
  if (!val) return '';
  // YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  // DD-MMM-YYYY legacy (e.g. 02-JUN-2021)
  if (/^\d{2}-[A-Z]{3}-\d{4}$/.test(val)) {
    const [d, mon, y] = val.split('-');
    const mNum = String(MONTHS_SHORT.indexOf(mon) + 1).padStart(2, '0');
    return `${d}-${mNum}-${y}`;
  }
  return val;
}

// Parse DD-MM-YYYY user input → YYYY-MM-DD for HTML date inputs
export function toISODate(val) {
  if (!val) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
    const [d, m, y] = val.split('-');
    return `${y}-${m}-${d}`;
  }
  return val;
}
