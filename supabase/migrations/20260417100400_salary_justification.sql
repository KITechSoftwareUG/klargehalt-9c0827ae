-- Salary justification: structured "why this salary?" data per employee
-- Required for EU Pay Transparency Directive Art. 16 compliance

ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_justification JSONB DEFAULT '{}';
-- Structure:
-- {
--   "factors": [
--     { "type": "experience", "score": 4, "weight": 0.3, "note": "8 Jahre Berufserfahrung" },
--     { "type": "education", "score": 3, "weight": 0.2, "note": "Master-Abschluss" },
--     { "type": "performance", "score": 5, "weight": 0.25, "note": "Überdurchschnittliche Bewertung" },
--     { "type": "market_rate", "score": 3, "weight": 0.15, "note": "Marktüblich für Region" },
--     { "type": "seniority", "score": 4, "weight": 0.1, "note": "4 Jahre im Unternehmen" }
--   ],
--   "summary": "Gehalt basiert auf überdurchschnittlicher Erfahrung und Leistung",
--   "last_reviewed_at": "2026-03-15T...",
--   "reviewed_by": "user_abc"
-- }

ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_justification_updated_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_justification_updated_by TEXT;

-- Index for querying employees without justification (compliance reporting)
CREATE INDEX IF NOT EXISTS idx_employees_salary_justification_empty
  ON employees ((salary_justification = '{}'::jsonb OR salary_justification IS NULL))
  WHERE salary_justification = '{}'::jsonb OR salary_justification IS NULL;

COMMENT ON COLUMN employees.salary_justification IS 'Structured JSONB with salary positioning factors, scores, weights, and notes per EU Pay Transparency Art. 16';
COMMENT ON COLUMN employees.salary_justification_updated_at IS 'Timestamp of last salary justification review';
COMMENT ON COLUMN employees.salary_justification_updated_by IS 'User ID who last reviewed the salary justification';
