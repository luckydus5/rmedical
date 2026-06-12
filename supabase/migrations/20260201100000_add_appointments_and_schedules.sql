-- ================================
-- Sanovia Database Migration
-- Add Appointments, Doctor Schedules, and Unique Constraints
-- ================================

-- Add unique constraint on national_id (REQUIRED - no duplicates)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_national_id_unique UNIQUE (national_id);

-- Add unique constraint on phone (but allow NULL for people without phones)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- ================================
-- Doctor Schedules Table
-- Stores recurring availability for doctors
-- ================================
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
    max_patients_per_slot INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index for faster queries
CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_facility ON doctor_schedules(facility_id);
CREATE INDEX idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- ================================
-- Appointments Table
-- Stores patient appointments with doctors
-- ================================
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE appointment_type AS ENUM ('consultation', 'follow_up', 'emergency', 'routine_checkup', 'lab_test', 'vaccination', 'other');

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL, -- References auth.users but patient might not have account yet
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    scheduled_by UUID NOT NULL REFERENCES auth.users(id), -- Nurse or receptionist who created the appointment
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_type appointment_type NOT NULL DEFAULT 'consultation',
    status appointment_status NOT NULL DEFAULT 'scheduled',
    chief_complaint TEXT, -- Reason for visit
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_facility ON appointments(facility_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_by ON appointments(scheduled_by);

-- Prevent double-booking for doctors
CREATE UNIQUE INDEX idx_no_double_booking ON appointments(doctor_id, appointment_date, start_time) 
WHERE status NOT IN ('cancelled', 'no_show');

-- ================================
-- Row Level Security (RLS) Policies
-- ================================

-- Enable RLS
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Doctor Schedules Policies
CREATE POLICY "Staff can view all schedules in their facility"
ON doctor_schedules FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM facility_staff 
        WHERE facility_staff.facility_id = doctor_schedules.facility_id 
        AND facility_staff.user_id = auth.uid() 
        AND facility_staff.is_active = true
    )
);

CREATE POLICY "Doctors can manage their own schedules"
ON doctor_schedules FOR ALL
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Facility admins can manage all schedules"
ON doctor_schedules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM facility_staff 
        WHERE facility_staff.facility_id = doctor_schedules.facility_id 
        AND facility_staff.user_id = auth.uid() 
        AND facility_staff.role = 'facility_admin'
        AND facility_staff.is_active = true
    )
);

-- Appointments Policies
CREATE POLICY "Patients can view their own appointments"
ON appointments FOR SELECT
USING (patient_id = auth.uid());

CREATE POLICY "Staff can view appointments in their facility"
ON appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM facility_staff 
        WHERE facility_staff.facility_id = appointments.facility_id 
        AND facility_staff.user_id = auth.uid() 
        AND facility_staff.is_active = true
    )
);

CREATE POLICY "Nurses and receptionists can create appointments"
ON appointments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM facility_staff 
        WHERE facility_staff.facility_id = appointments.facility_id 
        AND facility_staff.user_id = auth.uid() 
        AND facility_staff.role IN ('nurse', 'receptionist', 'facility_admin', 'doctor')
        AND facility_staff.is_active = true
    )
);

CREATE POLICY "Staff can update appointments in their facility"
ON appointments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM facility_staff 
        WHERE facility_staff.facility_id = appointments.facility_id 
        AND facility_staff.user_id = auth.uid() 
        AND facility_staff.is_active = true
    )
);

-- ================================
-- Trigger for updated_at
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doctor_schedules_updated_at
    BEFORE UPDATE ON doctor_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- Function to get available appointment slots
-- ================================
CREATE OR REPLACE FUNCTION get_available_slots(
    p_doctor_id UUID,
    p_facility_id UUID,
    p_date DATE
)
RETURNS TABLE (
    slot_start TIME,
    slot_end TIME,
    is_available BOOLEAN
) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_schedule RECORD;
    v_current_time TIME;
    v_slot_end TIME;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Get schedule for this day
    SELECT * INTO v_schedule
    FROM doctor_schedules
    WHERE doctor_id = p_doctor_id
    AND facility_id = p_facility_id
    AND day_of_week = v_day_of_week
    AND is_active = true
    LIMIT 1;
    
    IF v_schedule IS NULL THEN
        RETURN;
    END IF;
    
    v_current_time := v_schedule.start_time;
    
    WHILE v_current_time < v_schedule.end_time LOOP
        v_slot_end := v_current_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
        
        IF v_slot_end > v_schedule.end_time THEN
            EXIT;
        END IF;
        
        slot_start := v_current_time;
        slot_end := v_slot_end;
        
        -- Check if slot is available
        is_available := NOT EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.doctor_id = p_doctor_id
            AND appointments.facility_id = p_facility_id
            AND appointments.appointment_date = p_date
            AND appointments.start_time = v_current_time
            AND appointments.status NOT IN ('cancelled', 'no_show')
        );
        
        RETURN NEXT;
        
        v_current_time := v_slot_end;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
