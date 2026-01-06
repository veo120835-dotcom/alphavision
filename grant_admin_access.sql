-- Run this AFTER alphavisionmethod@gmail.com signs up
-- This grants full admin access to the user

-- First, get the user ID (replace with actual ID after signup)
-- SELECT id FROM auth.users WHERE email = 'alphavisionmethod@gmail.com';

-- Then run this (replace USER_ID_HERE with actual UUID):
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'alphavisionmethod@gmail.com'),
  'admin'
)
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';

-- Verify admin access
SELECT u.email, ur.role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'alphavisionmethod@gmail.com';
