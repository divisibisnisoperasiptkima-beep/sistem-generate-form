-- supabase/migrations/003_admin_rls.sql
-- Grant admin users (role = 'Admin' in public.profiles) full read access to templates and submissions.
-- Run this in your Supabase SQL Editor: https://app.supabase.com

-- Admin can read ALL templates (regardless of ownership or publish status)
DROP POLICY IF EXISTS "Admin read all templates" ON templates;
CREATE POLICY "Admin read all templates" ON templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
  );

-- Admin can read ALL submissions
DROP POLICY IF EXISTS "Admin read all submissions" ON submissions;
CREATE POLICY "Admin read all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
  );

-- Admin can update all profiles (role and status management)
DROP POLICY IF EXISTS "Admin update all profiles" ON public.profiles;
CREATE POLICY "Admin update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.role = 'Admin'
    )
  );

-- Admin can delete profiles
DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;
CREATE POLICY "Admin delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.role = 'Admin'
    )
  );
