-- Onboarding data table
CREATE TABLE IF NOT EXISTS onboarding_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_size TEXT NOT NULL CHECK (company_size IN ('1-50', '51-250', '251-1000', '1000+')),
  consulting_option TEXT NOT NULL CHECK (consulting_option IN ('self-service', 'guided', 'full-service')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own onboarding data"
  ON onboarding_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data"
  ON onboarding_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data"
  ON onboarding_data FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_onboarding_user_id ON onboarding_data(user_id);
CREATE INDEX idx_onboarding_company_id ON onboarding_data(company_id);

-- Comments
COMMENT ON TABLE onboarding_data IS 'Stores user onboarding preferences and progress';
COMMENT ON COLUMN onboarding_data.company_size IS 'Company size category';
COMMENT ON COLUMN onboarding_data.consulting_option IS 'Selected consulting/support level';
