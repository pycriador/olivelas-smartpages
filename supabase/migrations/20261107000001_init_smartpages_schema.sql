-- =============================================================================
-- Migration 001: Isolated Schema `smartpages` & Core Structural Tables
-- Project: Olivelas SmartPages (Olivelas OpsPages Static Hosting & Governance)
-- Target Schema: smartpages (strictly isolated from public and other schemas)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Create isolated schema
CREATE SCHEMA IF NOT EXISTS smartpages;

-- 2. Grant schema access to Supabase PostgREST roles
GRANT USAGE ON SCHEMA smartpages TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA smartpages TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA smartpages TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA smartpages TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA smartpages
  GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA smartpages
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA smartpages
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

-- 3. Safely register `smartpages` in authenticator's PostgREST db_schemas
DO $$
DECLARE
  current_schemas text;
BEGIN
  SELECT coalesce(
    (SELECT split_part(unnest, '=', 2)
     FROM unnest((SELECT setconfig FROM pg_db_role_setting WHERE setrole = 'authenticator'::regrole AND setdatabase = 0))
     WHERE unnest LIKE 'pgrst.db_schemas=%'
     LIMIT 1),
    'public, storage, graphql_public'
  ) INTO current_schemas;

  IF position('smartpages' in current_schemas) = 0 THEN
    EXECUTE format('ALTER ROLE authenticator SET pgrst.db_schemas = %L', current_schemas || ', smartpages');
  END IF;
END
$$;

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- 4. Tables inside `smartpages` (100% aligned with SQLAlchemy meta_models.py)
-- =============================================================================

-- 4.1 Platform Settings & Customizations
CREATE TABLE IF NOT EXISTS smartpages.opspages_platform_settings (
  key VARCHAR(120) PRIMARY KEY,
  category VARCHAR(80) NOT NULL DEFAULT 'general',
  value_json TEXT NOT NULL DEFAULT '{}',
  description VARCHAR(500) NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Visual Themes Catalog (Light & Dark Customizations)
CREATE TABLE IF NOT EXISTS smartpages.opspages_themes (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'dark',
  is_dark BOOLEAN NOT NULL DEFAULT TRUE,
  primary_color VARCHAR(32) NOT NULL,
  primary_hover VARCHAR(32) NOT NULL,
  primary_active VARCHAR(32) NOT NULL,
  bg_layout VARCHAR(32) NOT NULL,
  bg_container VARCHAR(32) NOT NULL,
  bg_sidebar VARCHAR(32) NOT NULL,
  bg_header VARCHAR(32) NOT NULL,
  color_text VARCHAR(32) NOT NULL,
  color_border VARCHAR(32) NOT NULL,
  badge_tag VARCHAR(32) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 Users (starts empty; first registered user becomes Global Admin automatically)
CREATE TABLE IF NOT EXISTS smartpages.opspages_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_theme VARCHAR(80) NOT NULL DEFAULT 'loft-obsidian',
  preferred_language VARCHAR(16) NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_smartpages_users_username ON smartpages.opspages_users(username);
CREATE INDEX IF NOT EXISTS ix_smartpages_users_email ON smartpages.opspages_users(email);

-- 4.4 HBAC Groups
CREATE TABLE IF NOT EXISTS smartpages.opspages_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) NOT NULL DEFAULT '',
  role_level VARCHAR(50) NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_smartpages_groups_name ON smartpages.opspages_groups(name);

-- 4.5 User <-> Group Association
CREATE TABLE IF NOT EXISTS smartpages.opspages_user_groups (
  user_id INTEGER NOT NULL REFERENCES smartpages.opspages_users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES smartpages.opspages_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

-- 4.6 Static Hosting Projects (starts empty)
CREATE TABLE IF NOT EXISTS smartpages.opspages_projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  framework VARCHAR(80) NOT NULL DEFAULT 'react-vite',
  active_version VARCHAR(80) NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_version VARCHAR(80) NULL,
  locked_by VARCHAR(255) NULL,
  locked_reason VARCHAR(500) NULL,
  auto_approval BOOLEAN NOT NULL DEFAULT TRUE,
  spa_mode BOOLEAN NOT NULL DEFAULT TRUE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  entry_file VARCHAR(150) NOT NULL DEFAULT 'index.html',
  custom_domain VARCHAR(255) NULL,
  html_cache_control VARCHAR(255) NOT NULL DEFAULT 'no-cache, max-age=0, must-revalidate',
  hashed_asset_cache_control VARCHAR(255) NOT NULL DEFAULT 'public, max-age=31536000, immutable',
  asset_cache_control VARCHAR(255) NOT NULL DEFAULT 'public, max-age=3600',
  csp_policy TEXT NOT NULL DEFAULT 'default-src ''self''; script-src ''self'' ''unsafe-inline'' ''unsafe-eval''; style-src ''self'' ''unsafe-inline'' https://fonts.googleapis.com; img-src ''self'' data: blob: https: http:; font-src ''self'' data: https://fonts.gstatic.com https:; connect-src ''self'' http://localhost:* http://127.0.0.1:* https: ws: wss:; frame-ancestors ''self''; base-uri ''self''; object-src ''none''',
  x_frame_options VARCHAR(50) NOT NULL DEFAULT 'SAMEORIGIN',
  referrer_policy VARCHAR(100) NOT NULL DEFAULT 'strict-origin-when-cross-origin',
  hsts_max_age INTEGER NOT NULL DEFAULT 31536000,
  nosniff_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  permissions_policy VARCHAR(255) NOT NULL DEFAULT 'camera=(), microphone=(), geolocation=()',
  github_repo_url VARCHAR(500) NULL,
  github_branch VARCHAR(100) NOT NULL DEFAULT 'main',
  github_subpath VARCHAR(255) NOT NULL DEFAULT '/repos',
  github_token_encrypted TEXT NULL,
  auto_sync_github BOOLEAN NOT NULL DEFAULT FALSE,
  opsbase_project_id INTEGER NULL,
  opsbase_project_slug VARCHAR(150) NULL,
  opsbase_schema_name VARCHAR(150) NULL,
  opsbase_linked_at TIMESTAMPTZ NULL,
  opsbase_last_synced_at TIMESTAMPTZ NULL,
  opsbase_key_status VARCHAR(40) NOT NULL DEFAULT 'active',
  opsbase_key_prefix VARCHAR(80) NULL,
  opsbase_cors_synced BOOLEAN NOT NULL DEFAULT FALSE,
  opsbase_allowed_origins_json TEXT NOT NULL DEFAULT '[]',
  opsbase_auto_provisioned BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER NULL REFERENCES smartpages.opspages_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_smartpages_projects_slug ON smartpages.opspages_projects(slug);

-- 4.7 Immutable Release Deployments
CREATE TABLE IF NOT EXISTS smartpages.opspages_deployments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES smartpages.opspages_projects(id) ON DELETE CASCADE,
  version VARCHAR(80) NOT NULL,
  git_commit_sha VARCHAR(64) NULL,
  git_tag VARCHAR(100) NULL,
  git_branch VARCHAR(100) NOT NULL DEFAULT 'main',
  release_notes TEXT NOT NULL DEFAULT '',
  status VARCHAR(40) NOT NULL DEFAULT 'ready',
  source VARCHAR(50) NOT NULL DEFAULT 'web_upload',
  file_count INTEGER NOT NULL DEFAULT 0,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  checksum_sha256 VARCHAR(64) NULL,
  entry_file VARCHAR(150) NOT NULL DEFAULT 'index.html',
  created_by INTEGER NULL REFERENCES smartpages.opspages_users(id) ON DELETE SET NULL,
  created_by_email VARCHAR(255) NULL,
  approved_by_email VARCHAR(255) NULL,
  approved_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_opspages_project_version UNIQUE (project_id, version)
);
CREATE INDEX IF NOT EXISTS ix_smartpages_deployments_project_id ON smartpages.opspages_deployments(project_id);

-- 4.8 Release Artifact Files (for Static Build Explorer & Serverless Preview)
CREATE TABLE IF NOT EXISTS smartpages.opspages_release_files (
  id SERIAL PRIMARY KEY,
  deployment_id INTEGER NOT NULL REFERENCES smartpages.opspages_deployments(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES smartpages.opspages_projects(id) ON DELETE CASCADE,
  relative_path VARCHAR(512) NOT NULL,
  content_type VARCHAR(120) NOT NULL DEFAULT 'text/plain',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  content_text TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_opspages_deployment_relpath UNIQUE (deployment_id, relative_path)
);
CREATE INDEX IF NOT EXISTS ix_smartpages_release_files_deployment ON smartpages.opspages_release_files(deployment_id);

-- 4.9 Project HBAC Permissions
CREATE TABLE IF NOT EXISTS smartpages.opspages_project_permissions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES smartpages.opspages_projects(id) ON DELETE CASCADE,
  user_id INTEGER NULL REFERENCES smartpages.opspages_users(id) ON DELETE CASCADE,
  group_id INTEGER NULL REFERENCES smartpages.opspages_groups(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_opspages_project_user_perm UNIQUE (project_id, user_id),
  CONSTRAINT uq_opspages_project_group_perm UNIQUE (project_id, group_id)
);

-- 4.10 Scoped CI/CD API Tokens
CREATE TABLE IF NOT EXISTS smartpages.opspages_api_tokens (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES smartpages.opspages_projects(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  token_prefix VARCHAR(50) NOT NULL,
  key_hash VARCHAR(128) NOT NULL UNIQUE,
  encrypted_secret TEXT NULL,
  token_type VARCHAR(50) NOT NULL DEFAULT 'deploy',
  scopes VARCHAR(255) NOT NULL DEFAULT 'read,deploy',
  expires_at TIMESTAMPTZ NULL,
  last_used_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER NULL REFERENCES smartpages.opspages_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_smartpages_api_tokens_key_hash ON smartpages.opspages_api_tokens(key_hash);

-- 4.11 Project Quotas & Guardrails
CREATE TABLE IF NOT EXISTS smartpages.opspages_project_quotas (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL UNIQUE REFERENCES smartpages.opspages_projects(id) ON DELETE CASCADE,
  max_build_size_mb INTEGER NOT NULL DEFAULT 250,
  max_storage_mb INTEGER NOT NULL DEFAULT 2048,
  max_deploys_per_day INTEGER NOT NULL DEFAULT 100,
  max_retained_versions INTEGER NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.12 Dynamic CORS & CSP Rules
CREATE TABLE IF NOT EXISTS smartpages.opspages_cors_rules (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES smartpages.opspages_projects(id) ON DELETE CASCADE,
  origin VARCHAR(255) NOT NULL,
  allowed_methods VARCHAR(255) NOT NULL DEFAULT 'GET,HEAD,OPTIONS',
  allowed_headers VARCHAR(255) NOT NULL DEFAULT '*',
  allow_credentials BOOLEAN NOT NULL DEFAULT FALSE,
  max_age_seconds INTEGER NOT NULL DEFAULT 3600,
  cache_control VARCHAR(255) NOT NULL DEFAULT 'public, max-age=3600',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_email VARCHAR(255) NULL,
  updated_by_email VARCHAR(255) NULL
);

-- 4.13 Public Configuration & Runtime Environment Variables
CREATE TABLE IF NOT EXISTS smartpages.opspages_public_configs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES smartpages.opspages_projects(id) ON DELETE CASCADE,
  environment VARCHAR(50) NOT NULL DEFAULT 'production',
  opsbase_url VARCHAR(500) NOT NULL DEFAULT 'https://flxcgbftpwjvxetqbtzq.supabase.co/rest/v1',
  opsbase_public_key VARCHAR(500) NOT NULL DEFAULT '',
  opsbase_project_id INTEGER NULL,
  opsbase_project_slug VARCHAR(150) NOT NULL DEFAULT '',
  opsbase_schema_name VARCHAR(150) NULL,
  opsbase_key_prefix VARCHAR(80) NULL,
  opsbase_key_status VARCHAR(40) NOT NULL DEFAULT 'active',
  opsbase_data_plane_url VARCHAR(500) NULL,
  opsbase_auth_url VARCHAR(500) NULL,
  opsbase_rls_enforced BOOLEAN NULL,
  key_source VARCHAR(50) NOT NULL DEFAULT 'opsbase_discovery',
  last_synced_at TIMESTAMPTZ NULL,
  scopes VARCHAR(500) NOT NULL DEFAULT 'public:read,data:query,auth:session',
  public_vars_json TEXT NOT NULL DEFAULT '{}',
  inject_in_html BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by_email VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_opspages_project_env_config UNIQUE (project_id, environment)
);

-- 4.14 Client-Side Error Telemetry Reports
CREATE TABLE IF NOT EXISTS smartpages.opspages_error_reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NULL REFERENCES smartpages.opspages_projects(id) ON DELETE SET NULL,
  project_slug VARCHAR(100) NULL,
  page_url VARCHAR(1000) NOT NULL,
  route_path VARCHAR(500) NOT NULL DEFAULT '/',
  error_code VARCHAR(100) NOT NULL DEFAULT 'ERR_FRONTEND_RUNTIME',
  http_status INTEGER NULL,
  severity VARCHAR(40) NOT NULL DEFAULT 'error',
  title VARCHAR(300) NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  stack_trace TEXT NULL,
  version VARCHAR(80) NULL,
  environment VARCHAR(50) NOT NULL DEFAULT 'production',
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  reporter_email VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  resolution_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.15 Immutable Governance Audit Logs
CREATE TABLE IF NOT EXISTS smartpages.opspages_audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id INTEGER NULL,
  actor_email VARCHAR(255) NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NULL,
  project_id INTEGER NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  diff_payload TEXT NULL
);
CREATE INDEX IF NOT EXISTS ix_smartpages_audit_logs_timestamp ON smartpages.opspages_audit_logs(timestamp);

-- =============================================================================
-- 5. First-User Global Admin Enforcement Triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION smartpages.fn_before_user_insert_first_global_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
BEGIN
  -- Normalize email and username
  NEW.email := lower(trim(NEW.email));
  IF NEW.username IS NULL OR trim(NEW.username) = '' THEN
    NEW.username := split_part(NEW.email, '@', 1);
  ELSE
    NEW.username := lower(trim(NEW.username));
  END IF;

  -- If no users exist yet in smartpages.opspages_users, the very first user is promoted to Global Admin
  IF NOT EXISTS (SELECT 1 FROM smartpages.opspages_users) THEN
    NEW.is_superuser := TRUE;
    NEW.is_active := TRUE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_before_user_insert_global_admin ON smartpages.opspages_users;
CREATE TRIGGER trg_before_user_insert_global_admin
BEFORE INSERT ON smartpages.opspages_users
FOR EACH ROW
EXECUTE FUNCTION smartpages.fn_before_user_insert_first_global_admin();


CREATE OR REPLACE FUNCTION smartpages.fn_after_user_insert_assign_default_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = smartpages, public, extensions
AS $$
DECLARE
  v_admin_group_id INTEGER;
  v_total_users INTEGER;
BEGIN
  SELECT count(*) INTO v_total_users FROM smartpages.opspages_users;

  IF NEW.is_superuser THEN
    SELECT id INTO v_admin_group_id
    FROM smartpages.opspages_groups
    WHERE role_level = 'admin'
    ORDER BY id ASC
    LIMIT 1;

    IF v_admin_group_id IS NOT NULL THEN
      INSERT INTO smartpages.opspages_user_groups (user_id, group_id)
      VALUES (NEW.id, v_admin_group_id)
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_total_users = 1 THEN
      INSERT INTO smartpages.opspages_audit_logs (
        actor_id, actor_email, action, resource_type, resource_id, diff_payload, ip_address
      ) VALUES (
        NEW.id,
        NEW.email,
        'BOOTSTRAP_GLOBAL_ADMIN',
        'user',
        NEW.id::text,
        jsonb_build_object(
          'email', NEW.email,
          'username', NEW.username,
          'is_superuser', true,
          'role', 'Global Admin (Primeiro Cadastro na Plataforma)'
        )::text,
        '127.0.0.1'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_user_insert_assign_group ON smartpages.opspages_users;
CREATE TRIGGER trg_after_user_insert_assign_group
AFTER INSERT ON smartpages.opspages_users
FOR EACH ROW
EXECUTE FUNCTION smartpages.fn_after_user_insert_assign_default_group();
