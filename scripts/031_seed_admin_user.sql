-- Seed admin user: bryan@nyuchi.com
-- This migration grants admin privileges to the specified email address.
-- The user must already exist in auth.users (created via signup).
-- If the user doesn't exist yet, this will update them on first login via the trigger.

-- Update existing profile to admin role
UPDATE profiles
SET role = 'admin'
WHERE email = 'bryan@nyuchi.com';

-- Also ensure that when bryan@nyuchi.com signs up, they get admin role
-- Create or replace the trigger function to handle admin seeding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['bryan@nyuchi.com'];
  user_role TEXT;
BEGIN
  -- Check if this email should be an admin
  IF NEW.email = ANY(admin_emails) THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the update (for debugging - check in Supabase logs)
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  RAISE NOTICE 'Total admin users: %', admin_count;

  -- Check if bryan@nyuchi.com is now admin
  IF EXISTS (SELECT 1 FROM profiles WHERE email = 'bryan@nyuchi.com' AND role = 'admin') THEN
    RAISE NOTICE 'bryan@nyuchi.com is now an admin';
  ELSE
    RAISE NOTICE 'bryan@nyuchi.com not found or not yet an admin (will be set on first login)';
  END IF;
END $$;
