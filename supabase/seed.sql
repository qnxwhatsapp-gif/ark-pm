-- Seed script: Create initial admin user (run manually in Supabase SQL Editor)
-- Before running: You must have at least ONE admin user created via Auth > Users in Supabase dashboard

-- This script creates additional admin users via direct SQL
-- IMPORTANT: The email and password must match an auth.users entry created in Supabase Auth

-- Example: To create a second admin user named "Vivek Singh" with email "vivek@arkdesign.com"
-- 1. Go to Supabase Dashboard > Authentication > Users > Add user
-- 2. Email: vivek@arkdesign.com, Password: (generate or set temporary), Confirm email
-- 3. Then run this SQL to add the user record to public.users:

INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT
  auth_users.id,
  auth_users.email,
  'Vivek Singh',  -- Change this name
  'admin'::user_role,
  true
FROM auth.users AS auth_users
WHERE auth_users.email = 'vivek@arkdesign.com'  -- Change this email
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth_users.id
  );

-- Notes:
-- - Default password should be set via Supabase > Users > Password
-- - After creating via Auth, the user will get a confirmation email
-- - They can log in and reset their password
-- - Or set a temporary password: Supabase > Users > User details > Reset password
