// Simple, explainable skill-match scoring used across jobs and courses.
function normSkills(arr) {
  return (arr || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
}

// Score 0-100: overlap between candidate skills and required skills,
// weighted slightly by candidate experience.
function matchScore(candidateSkills, requiredSkills, experienceYears = 0) {
  const cand = new Set(normSkills(candidateSkills));
  const req = normSkills(requiredSkills);
  if (req.length === 0) return 50;
  const matched = req.filter((s) => cand.has(s));
  const base = (matched.length / req.length) * 100;
  const expBonus = Math.min(experienceYears, 5) * 2; // up to +10
  const score = Math.round(Math.min(100, base * 0.85 + expBonus));
  return { score, matchedSkills: matched, missingSkills: req.filter((s) => !cand.has(s)) };
}

module.exports = { matchScore, normSkills };
