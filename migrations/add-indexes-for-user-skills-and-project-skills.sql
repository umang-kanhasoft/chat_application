-- Improve performance of onboarding and project skills queries

-- User skills lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills (user_id);

-- Project skills lookup by project_id
CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON project_skills (project_id);
