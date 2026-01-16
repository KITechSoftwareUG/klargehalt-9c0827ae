-- Consultation bookings table
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('video', 'phone', 'in-person')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employee_count TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookings"
  ON consultation_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON consultation_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON consultation_bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Consultants can view all bookings
CREATE POLICY "Consultants can view all bookings"
  ON consultation_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'consultant')
    )
  );

-- Consultants can update bookings
CREATE POLICY "Consultants can update bookings"
  ON consultation_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'consultant')
    )
  );

-- Indexes
CREATE INDEX idx_consultation_bookings_user_id ON consultation_bookings(user_id);
CREATE INDEX idx_consultation_bookings_status ON consultation_bookings(status);
CREATE INDEX idx_consultation_bookings_scheduled_date ON consultation_bookings(scheduled_date);
CREATE INDEX idx_consultation_bookings_consultant_id ON consultation_bookings(consultant_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultation_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER consultation_bookings_updated_at
  BEFORE UPDATE ON consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_bookings_updated_at();

-- Comments
COMMENT ON TABLE consultation_bookings IS 'Stores consultation booking requests and appointments';
COMMENT ON COLUMN consultation_bookings.consultation_type IS 'Type of consultation: video, phone, or in-person';
COMMENT ON COLUMN consultation_bookings.status IS 'Booking status: pending, confirmed, completed, or cancelled';
COMMENT ON COLUMN consultation_bookings.meeting_link IS 'Video call link (for video consultations)';
