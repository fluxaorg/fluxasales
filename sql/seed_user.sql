-- INSTRUÇÃO: Após criar o usuário via Supabase Studio (Authentication → Users → "Invite user"),
-- execute este SQL no SQL Editor do Supabase Studio.
-- Substitua [user_id_do_auth] pelo UUID do usuário criado.

-- 1. Criar organização
INSERT INTO fluxaleads_organizations (user_id, name, slug)
VALUES ('[user_id_do_auth]', 'Minha Empresa', 'minha-empresa');

-- 2. Criar subscription (copie o id gerado acima)
INSERT INTO fluxaleads_subscriptions (org_id, plan, status)
VALUES ('[org_id_gerado_acima]', 'TRIAL', 'active');

-- Para verificar o org_id após o primeiro INSERT:
-- SELECT id FROM fluxaleads_organizations WHERE user_id = '[user_id_do_auth]';
