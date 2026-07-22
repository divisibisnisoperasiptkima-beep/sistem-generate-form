-- supabase/migrations/002_profiles.sql
-- Create a public profiles table, auto-confirm signup emails, and sync users with a Postgres trigger.
-- This script is fully idempotent (can be rerun safely multiple times).

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Viewer',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Drop if exists first to prevent ERROR 42710)
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.profiles;
CREATE POLICY "Allow select for authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.profiles;
CREATE POLICY "Allow update for authenticated users" ON public.profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Trigger function to auto-confirm emails on signup
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = now();
  NEW.confirmed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Register BEFORE INSERT trigger (Drop first to prevent duplicate errors)
DROP TRIGGER IF EXISTS on_auth_user_signup_confirm ON auth.users;
CREATE TRIGGER on_auth_user_signup_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user_email();

-- 5. Trigger function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (
    new.id,
    new.email,
    -- Make the first user or specific email an Admin, others default to Viewer
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'Admin'
      WHEN new.email LIKE '%admin%' THEN 'Admin'
      ELSE 'Viewer'
    END,
    'Active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Register AFTER INSERT trigger (Drop first to prevent duplicate errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill existing users (if any exist before migration)
INSERT INTO public.profiles (id, email, role, status, created_at)
SELECT id, email, 'Admin', 'Active', created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
