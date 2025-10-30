-- Add admin role to current user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('673f3100-726b-4213-9118-b9d71d7827ee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;