-- Make bryan@nyuchi.com an admin
UPDATE profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'bryan@nyuchi.com';

-- Log the change
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE email = 'bryan@nyuchi.com' AND role = 'admin') THEN
    RAISE NOTICE 'Successfully made bryan@nyuchi.com an admin';
  ELSE
    RAISE NOTICE 'User bryan@nyuchi.com not found or already admin';
  END IF;
END $$;
