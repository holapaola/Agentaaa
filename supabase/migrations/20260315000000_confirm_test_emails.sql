-- Confirm email for all 3 test accounts
UPDATE auth.users SET
  email_confirmed_at = now(),
  updated_at = now()
WHERE email IN (
  'free@agentaaa.com',
  'basic@agentaaa.com',
  'premium@agentaaa.com'
);
