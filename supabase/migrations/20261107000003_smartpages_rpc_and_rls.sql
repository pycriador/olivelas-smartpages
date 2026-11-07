-- =============================================================================
-- Migration 003: Supabase RPC Functions & RLS Policies for `smartpages`
-- Project: Olivelas SmartPages (AIOps OpsPages Static Hosting & Governance)
-- Enables seamless operation both via FastAPI Backend and directly from
-- GitHub Pages Frontend via PostgREST (`Accept-Profile: smartpages`).
-- =============================================================================

-- Helper function to serialize a user row with their HBAC groups (matches UserResponse schema)
CREATE OR REPLACE FUNCTION smartpages.fn_serialize_user(p_user_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
DECLARE
  v_user RECORD;
  v_groups JSONB;
BEGIN
  SELECT * INTO v_user FROM smartpages.opspages_users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'description', g.description,
        'role_level', g.role_level,
        'created_at', g.created_at
      )
      ORDER BY g.id
    ),
    '[]'::jsonb
  )
  INTO v_groups
  FROM smartpages.opspages_groups g
  JOIN smartpages.opspages_user_groups ug ON ug.group_id = g.id
  WHERE ug.user_id = v_user.id;

  RETURN jsonb_build_object(
    'id', v_user.id,
    'username', v_user.username,
    'email', v_user.email,
    'full_name', v_user.full_name,
    'is_active', v_user.is_active,
    'is_superuser', v_user.is_superuser,
    'preferred_theme', v_user.preferred_theme,
    'preferred_language', v_user.preferred_language,
    'groups', v_groups,
    'created_at', v_user.created_at,
    'updated_at', v_user.updated_at
  );
END;
$$;

-- 1. RPC: Bootstrap Status & Platform Configuration
CREATE OR REPLACE FUNCTION smartpages.bootstrap_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
DECLARE
  v_user_count INTEGER;
  v_project_count INTEGER;
  v_settings JSONB;
  v_themes JSONB;
BEGIN
  SELECT count(*) INTO v_user_count FROM smartpages.opspages_users;
  SELECT count(*) INTO v_project_count FROM smartpages.opspages_projects;

  SELECT coalesce(
    jsonb_object_agg(key, (value_json)::jsonb),
    '{}'::jsonb
  )
  INTO v_settings
  FROM smartpages.opspages_platform_settings;

  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.sort_order), '[]'::jsonb)
  INTO v_themes
  FROM smartpages.opspages_themes t;

  RETURN jsonb_build_object(
    'has_users', (v_user_count > 0),
    'user_count', v_user_count,
    'project_count', v_project_count,
    'next_user_will_be_global_admin', (v_user_count = 0),
    'schema', 'smartpages',
    'settings', v_settings,
    'themes', v_themes
  );
END;
$$;

-- 2. RPC: Register User (First User automatically becomes Global Admin)
CREATE OR REPLACE FUNCTION smartpages.register_user(
  p_email TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_username TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
DECLARE
  v_clean_email VARCHAR(255);
  v_clean_username VARCHAR(100);
  v_existing_count INTEGER;
  v_is_first_user BOOLEAN;
  v_user_id INTEGER;
  v_hashed_password VARCHAR(255);
  v_target_role VARCHAR(32);
  v_group_id INTEGER;
  v_user_json JSONB;
  v_token TEXT;
BEGIN
  v_clean_email := lower(trim(p_email));

  IF v_clean_email = '' OR position('@' in v_clean_email) = 0 THEN
    RAISE EXCEPTION 'E-mail inválido.';
  END IF;

  v_clean_username := lower(trim(coalesce(nullif(trim(p_username), ''), split_part(v_clean_email, '@', 1))));

  IF length(coalesce(p_password, '')) < 6 THEN
    RAISE EXCEPTION 'A senha deve possuir pelo menos 6 caracteres.';
  END IF;

  IF EXISTS (SELECT 1 FROM smartpages.opspages_users WHERE email = v_clean_email) THEN
    RAISE EXCEPTION 'Já existe um usuário cadastrado com o e-mail %.', v_clean_email;
  END IF;

  IF EXISTS (SELECT 1 FROM smartpages.opspages_users WHERE username = v_clean_username) THEN
    v_clean_username := v_clean_username || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  END IF;

  SELECT count(*) INTO v_existing_count FROM smartpages.opspages_users;
  v_is_first_user := (v_existing_count = 0);

  -- Blowfish ($2a$) hash compatible with both PostgreSQL pgcrypto and Python bcrypt
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  INSERT INTO smartpages.opspages_users (
    username, email, full_name, hashed_password, is_active, is_superuser
  ) VALUES (
    v_clean_username,
    v_clean_email,
    coalesce(nullif(trim(p_full_name), ''), v_clean_username),
    v_hashed_password,
    TRUE,
    v_is_first_user
  )
  RETURNING id INTO v_user_id;

  -- Determine HBAC group
  IF v_is_first_user THEN
    v_target_role := 'admin';
  ELSE
    v_target_role := CASE
      WHEN p_role IN ('admin', 'editor', 'viewer') THEN p_role
      ELSE 'viewer'
    END;
  END IF;

  SELECT id INTO v_group_id
  FROM smartpages.opspages_groups
  WHERE role_level = v_target_role
  ORDER BY id ASC
  LIMIT 1;

  IF v_group_id IS NOT NULL THEN
    INSERT INTO smartpages.opspages_user_groups (user_id, group_id)
    VALUES (v_user_id, v_group_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT v_is_first_user THEN
    INSERT INTO smartpages.opspages_audit_logs (
      actor_id, actor_email, action, resource_type, resource_id, diff_payload, ip_address
    ) VALUES (
      v_user_id, v_clean_email, 'USER_REGISTER', 'user', v_user_id::text,
      jsonb_build_object('email', v_clean_email, 'role_level', v_target_role)::text,
      '127.0.0.1'
    );
  END IF;

  v_user_json := smartpages.fn_serialize_user(v_user_id);
  v_token := 'sp_jwt_' || v_user_id::text || '_' || replace(gen_random_uuid()::text, '-', '');

  RETURN jsonb_build_object(
    'access_token', v_token,
    'token_type', 'bearer',
    'expires_in', 86400,
    'is_first_user_global_admin', v_is_first_user,
    'user', v_user_json,
    'data', jsonb_build_object(
      'access_token', v_token,
      'user', v_user_json,
      'is_first_user_global_admin', v_is_first_user
    )
  );
END;
$$;

-- 3. RPC: Authenticate User (verifies both $2a$ and $2b$ bcrypt hashes)
CREATE OR REPLACE FUNCTION smartpages.authenticate_user(
  p_identifier TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
DECLARE
  v_clean_id VARCHAR(255);
  v_user RECORD;
  v_norm_hash TEXT;
  v_user_json JSONB;
  v_token TEXT;
BEGIN
  v_clean_id := lower(trim(p_identifier));

  SELECT * INTO v_user
  FROM smartpages.opspages_users
  WHERE lower(email) = v_clean_id OR lower(username) = v_clean_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credenciais inválidas: usuário/e-mail ou senha incorretos.';
  END IF;

  IF NOT v_user.is_active THEN
    RAISE EXCEPTION 'Conta de usuário desativada pelo administrador.';
  END IF;

  -- Normalize $2b$ (Python bcrypt default) to $2a$ for pgcrypto compatibility
  v_norm_hash := replace(v_user.hashed_password, '$2b$', '$2a$');

  IF extensions.crypt(p_password, v_norm_hash) <> v_norm_hash THEN
    RAISE EXCEPTION 'Credenciais inválidas: usuário/e-mail ou senha incorretos.';
  END IF;

  INSERT INTO smartpages.opspages_audit_logs (
    actor_id, actor_email, action, resource_type, resource_id, diff_payload, ip_address
  ) VALUES (
    v_user.id, v_user.email, 'USER_LOGIN', 'auth', v_user.id::text,
    jsonb_build_object('username', v_user.username, 'email', v_user.email)::text,
    '127.0.0.1'
  );

  v_user_json := smartpages.fn_serialize_user(v_user.id);
  v_token := 'sp_jwt_' || v_user.id::text || '_' || replace(gen_random_uuid()::text, '-', '');

  RETURN jsonb_build_object(
    'access_token', v_token,
    'token_type', 'bearer',
    'expires_in', 86400,
    'user', v_user_json,
    'data', jsonb_build_object(
      'access_token', v_token,
      'user', v_user_json
    )
  );
END;
$$;

-- 4. RPC: Change User Password (self-service or admin override)
CREATE OR REPLACE FUNCTION smartpages.change_user_password(
  p_user_id INTEGER,
  p_current_password TEXT,
  p_new_password TEXT,
  p_is_admin_override BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
DECLARE
  v_user RECORD;
  v_norm_hash TEXT;
  v_new_hash VARCHAR(255);
BEGIN
  SELECT * INTO v_user FROM smartpages.opspages_users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  IF length(coalesce(p_new_password, '')) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
  END IF;

  IF NOT p_is_admin_override THEN
    v_norm_hash := replace(v_user.hashed_password, '$2b$', '$2a$');
    IF extensions.crypt(coalesce(p_current_password, ''), v_norm_hash) <> v_norm_hash THEN
      RAISE EXCEPTION 'A senha atual informada está incorreta.';
    END IF;
  END IF;

  v_new_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));

  UPDATE smartpages.opspages_users
  SET hashed_password = v_new_hash,
      updated_at = NOW()
  WHERE id = v_user.id;

  INSERT INTO smartpages.opspages_audit_logs (
    actor_id, actor_email, action, resource_type, resource_id, diff_payload, ip_address
  ) VALUES (
    v_user.id, v_user.email, 'CHANGE_PASSWORD', 'user', v_user.id::text,
    jsonb_build_object('override', p_is_admin_override)::text,
    '127.0.0.1'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Senha atualizada com sucesso.'
  );
END;
$$;

-- 5. RPC: Admin Create User
CREATE OR REPLACE FUNCTION smartpages.admin_create_user(
  p_username TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_is_superuser BOOLEAN DEFAULT FALSE,
  p_group_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  p_role TEXT DEFAULT NULL,
  p_actor_email TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
DECLARE
  v_clean_email VARCHAR(255);
  v_clean_username VARCHAR(100);
  v_user_id INTEGER;
  v_hashed_password VARCHAR(255);
  v_gid INTEGER;
  v_role_group_id INTEGER;
BEGIN
  v_clean_email := lower(trim(p_email));
  v_clean_username := lower(trim(coalesce(nullif(trim(p_username), ''), split_part(v_clean_email, '@', 1))));

  IF EXISTS (SELECT 1 FROM smartpages.opspages_users WHERE email = v_clean_email) THEN
    RAISE EXCEPTION 'Já existe um usuário com o e-mail %.', v_clean_email;
  END IF;

  IF EXISTS (SELECT 1 FROM smartpages.opspages_users WHERE username = v_clean_username) THEN
    RAISE EXCEPTION 'Já existe um usuário com o username %.', v_clean_username;
  END IF;

  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  INSERT INTO smartpages.opspages_users (
    username, email, full_name, hashed_password, is_active, is_superuser
  ) VALUES (
    v_clean_username,
    v_clean_email,
    coalesce(nullif(trim(p_full_name), ''), v_clean_username),
    v_hashed_password,
    TRUE,
    coalesce(p_is_superuser, FALSE) OR (p_role = 'admin')
  )
  RETURNING id INTO v_user_id;

  IF array_length(p_group_ids, 1) IS NOT NULL THEN
    FOREACH v_gid IN ARRAY p_group_ids LOOP
      INSERT INTO smartpages.opspages_user_groups (user_id, group_id)
      VALUES (v_user_id, v_gid)
      ON CONFLICT DO NOTHING;
    END LOOP;
  ELSIF p_role IS NOT NULL THEN
    SELECT id INTO v_role_group_id
    FROM smartpages.opspages_groups
    WHERE role_level = p_role
    ORDER BY id ASC
    LIMIT 1;
    IF v_role_group_id IS NOT NULL THEN
      INSERT INTO smartpages.opspages_user_groups (user_id, group_id)
      VALUES (v_user_id, v_role_group_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  INSERT INTO smartpages.opspages_audit_logs (
    actor_email, action, resource_type, resource_id, diff_payload, ip_address
  ) VALUES (
    p_actor_email, 'CREATE_USER', 'user', v_user_id::text,
    jsonb_build_object('email', v_clean_email, 'username', v_clean_username, 'is_superuser', p_is_superuser)::text,
    '127.0.0.1'
  );

  RETURN smartpages.fn_serialize_user(v_user_id);
END;
$$;

-- 6. Grant Execute on RPCs and Enable RLS with Permissive Policies on smartpages.*
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA smartpages TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA smartpages TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA smartpages TO anon, authenticated, service_role, postgres;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'smartpages' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE smartpages.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS smartpages_full_access_%I ON smartpages.%I', t, t);
    EXECUTE format(
      'CREATE POLICY smartpages_full_access_%I ON smartpages.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END
$$;

NOTIFY pgrst, 'reload schema';
