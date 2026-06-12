-- Role Hierarchy for Sanovia Health Platform:
-- 1. Admin (in user_roles) = Super Admin / System Admin - Controls entire system
-- 2. Facility Admin - Manages a specific facility (tracked in facility_admins table)
-- 3. Staff roles (doctor, nurse, etc.) - Work at facilities (tracked in facility_staff)
-- 4. Patient - Regular users

-- Create facility_admins table to track which users are administrators of which facilities
-- These are granted by Super Admins (users with role='admin' in user_roles)
CREATE TABLE IF NOT EXISTS facility_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, facility_id)
);

-- Enable RLS on facility_admins
ALTER TABLE facility_admins ENABLE ROW LEVEL SECURITY;

-- RLS policies for facility_admins
-- Super admins (role='admin') can manage all facility admins
CREATE POLICY "Super admins can manage all facility admins"
  ON facility_admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Facility admins can view their own facility admin status
CREATE POLICY "Facility admins can view own status"
  ON facility_admins FOR SELECT
  USING (user_id = auth.uid());

-- Remove super admins from facility_staff (they shouldn't be tied to any facility)
DELETE FROM facility_staff 
WHERE user_id IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_facility_admins_user_id ON facility_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_admins_facility_id ON facility_admins(facility_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Add comments for documentation
COMMENT ON TABLE facility_admins IS 'Tracks which users are administrators of which facilities. Facility admins are granted by Super Admins (users with admin role in user_roles table).';
COMMENT ON COLUMN facility_admins.granted_by IS 'The super admin who granted facility admin access';
