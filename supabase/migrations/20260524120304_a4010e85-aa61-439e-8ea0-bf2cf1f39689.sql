
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous) VALUES
('206961b5-526b-4780-9feb-23778b83a5be','00000000-0000-0000-0000-000000000000','simonsadfa@outlook.dk',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false)
ON CONFLICT (id) DO NOTHING;

UPDATE auth.users SET confirmation_token = COALESCE(confirmation_token,''), email_change = COALESCE(email_change,''), email_change_token_new = COALESCE(email_change_token_new,''), email_change_token_current = COALESCE(email_change_token_current,''), recovery_token = COALESCE(recovery_token,''), phone_change = COALESCE(phone_change,''), phone_change_token = COALESCE(phone_change_token,''), reauthentication_token = COALESCE(reauthentication_token,'') WHERE id='206961b5-526b-4780-9feb-23778b83a5be';
