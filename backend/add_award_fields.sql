-- Add award fields to construction_projects table
-- This is a temporary solution while Alembic migrations are fixed

ALTER TABLE construction_projects 
ADD COLUMN IF NOT EXISTS award_amount NUMERIC(15, 2);

ALTER TABLE construction_projects 
ADD COLUMN IF NOT EXISTS award_date TIMESTAMP;

ALTER TABLE construction_projects 
ADD COLUMN IF NOT EXISTS contract_duration_days INTEGER;

ALTER TABLE construction_projects 
ADD COLUMN IF NOT EXISTS award_notes TEXT;

ALTER TABLE construction_projects 
ADD COLUMN IF NOT EXISTS estimated_completion_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN construction_projects.award_amount IS 'Final awarded amount when project is won';
COMMENT ON COLUMN construction_projects.award_date IS 'Date project was awarded';
COMMENT ON COLUMN construction_projects.contract_duration_days IS 'Contract duration in days';
COMMENT ON COLUMN construction_projects.award_notes IS 'Additional award information';
COMMENT ON COLUMN construction_projects.estimated_completion_date IS 'Expected completion date for construction'; 