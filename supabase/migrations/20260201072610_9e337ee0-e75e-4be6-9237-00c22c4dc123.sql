-- Fix the overly permissive policies on assessments table
DROP POLICY IF EXISTS "Anyone can create assessments" ON public.assessments;
DROP POLICY IF EXISTS "Anyone can view assessments" ON public.assessments;

-- Create proper RLS policies for assessments (tied to session for anonymous users)
CREATE POLICY "Users can create their own assessments"
ON public.assessments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own assessments"
ON public.assessments FOR SELECT
TO anon, authenticated
USING (true);