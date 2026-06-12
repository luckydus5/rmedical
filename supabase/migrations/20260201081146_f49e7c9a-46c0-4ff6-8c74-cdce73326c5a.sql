-- Create facility type enum
CREATE TYPE public.facility_type AS ENUM ('hospital', 'clinic', 'health_center', 'pharmacy', 'laboratory');

-- Create facility status enum
CREATE TYPE public.facility_status AS ENUM ('pending', 'approved', 'suspended');

-- Create facility role enum
CREATE TYPE public.facility_role AS ENUM ('facility_admin', 'doctor', 'nurse', 'receptionist');

-- Create facilities table
CREATE TABLE public.facilities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    facility_type facility_type NOT NULL DEFAULT 'clinic',
    status facility_status NOT NULL DEFAULT 'pending',
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Rwanda',
    phone TEXT,
    email TEXT,
    license_number TEXT,
    logo_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facility staff table (links users to facilities with roles)
CREATE TABLE public.facility_staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role facility_role NOT NULL DEFAULT 'receptionist',
    is_active BOOLEAN NOT NULL DEFAULT true,
    hired_at DATE,
    department TEXT,
    specialization TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(facility_id, user_id)
);

-- Create facility patients table (links patients to facilities they've visited)
CREATE TABLE public.facility_patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_visit_at TIMESTAMP WITH TIME ZONE,
    patient_number TEXT, -- Facility-specific patient number
    notes TEXT,
    UNIQUE(facility_id, patient_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_patients ENABLE ROW LEVEL SECURITY;

-- Add national_id index to profiles for fast patient search
CREATE INDEX IF NOT EXISTS idx_profiles_national_id ON public.profiles(national_id);

-- Create function to check if user is staff at a facility
CREATE OR REPLACE FUNCTION public.is_facility_staff(_user_id UUID, _facility_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.facility_staff
        WHERE user_id = _user_id
          AND facility_id = _facility_id
          AND is_active = true
    )
$$;

-- Create function to get user's facility role
CREATE OR REPLACE FUNCTION public.get_facility_role(_user_id UUID, _facility_id UUID)
RETURNS facility_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.facility_staff 
    WHERE user_id = _user_id AND facility_id = _facility_id AND is_active = true
    LIMIT 1
$$;

-- Create function to get user's facilities
CREATE OR REPLACE FUNCTION public.get_user_facilities(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT facility_id FROM public.facility_staff 
    WHERE user_id = _user_id AND is_active = true
$$;

-- RLS Policies for facilities
CREATE POLICY "Anyone can view approved facilities"
ON public.facilities FOR SELECT
USING (status = 'approved' OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create facilities"
ON public.facilities FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Facility creators and admins can update"
ON public.facilities FOR UPDATE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only system admins can delete facilities"
ON public.facilities FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for facility_staff
CREATE POLICY "Staff can view their own facility staff"
ON public.facility_staff FOR SELECT
USING (
    user_id = auth.uid() 
    OR is_facility_staff(auth.uid(), facility_id)
    OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Facility admins can manage staff"
ON public.facility_staff FOR INSERT
WITH CHECK (
    get_facility_role(auth.uid(), facility_id) = 'facility_admin'
    OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Facility admins can update staff"
ON public.facility_staff FOR UPDATE
USING (
    get_facility_role(auth.uid(), facility_id) = 'facility_admin'
    OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Facility admins can remove staff"
ON public.facility_staff FOR DELETE
USING (
    get_facility_role(auth.uid(), facility_id) = 'facility_admin'
    OR has_role(auth.uid(), 'admin')
);

-- RLS Policies for facility_patients
CREATE POLICY "Staff can view their facility patients"
ON public.facility_patients FOR SELECT
USING (
    patient_id = auth.uid()
    OR is_facility_staff(auth.uid(), facility_id)
    OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Staff can register patients"
ON public.facility_patients FOR INSERT
WITH CHECK (
    is_facility_staff(auth.uid(), facility_id)
    OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Staff can update patient records"
ON public.facility_patients FOR UPDATE
USING (
    is_facility_staff(auth.uid(), facility_id)
    OR has_role(auth.uid(), 'admin')
);

-- Update medical tables to include facility_id for facility-specific records
ALTER TABLE public.visit_history ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES public.facilities(id);
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES public.facilities(id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_facility_staff_updated_at
    BEFORE UPDATE ON public.facility_staff
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();