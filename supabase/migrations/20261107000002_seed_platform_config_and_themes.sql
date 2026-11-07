-- =============================================================================
-- Migration 002: Seed Platform Configurations, HBAC Role Groups & 20 Themes
-- Project: Olivelas SmartPages (Olivelas OpsPages Static Hosting & Governance)
-- Note: Zero users and zero projects are seeded here by design.
--       The first user registered will automatically become Global Admin.
-- =============================================================================

-- 0. Ensure server-side DEFAULT NOW() on timestamp columns in case SQLAlchemy created tables first
ALTER TABLE smartpages.opspages_platform_settings ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE smartpages.opspages_themes ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE smartpages.opspages_groups ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE smartpages.opspages_users ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE smartpages.opspages_users ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE smartpages.opspages_users ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE smartpages.opspages_users ALTER COLUMN is_superuser SET DEFAULT FALSE;
ALTER TABLE smartpages.opspages_users ALTER COLUMN preferred_theme SET DEFAULT 'loft-obsidian';
ALTER TABLE smartpages.opspages_users ALTER COLUMN preferred_language SET DEFAULT 'pt-BR';
ALTER TABLE smartpages.opspages_audit_logs ALTER COLUMN timestamp SET DEFAULT NOW();

-- 1. Seed Default HBAC Role Groups (admin, editor, viewer)
INSERT INTO smartpages.opspages_groups (name, description, role_level, created_at)
VALUES
  (
    'Platform Admins',
    'Acesso administrativo total à plataforma Olivelas SmartPages (Global Admin)',
    'admin',
    NOW()
  ),
  (
    'Frontend Editors',
    'Upload de builds, aprovação, rollback, versionamento Git e gestão de páginas',
    'editor',
    NOW()
  ),
  (
    'Project Viewers',
    'Acesso de visualização às builds, histórico Git, arquivos e páginas publicadas',
    'viewer',
    NOW()
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  role_level = EXCLUDED.role_level;

-- 2. Seed Platform Configurations & Personalization Defaults
INSERT INTO smartpages.opspages_platform_settings (key, category, value_json, description, updated_at)
VALUES
  (
    'platform.identity',
    'branding',
    '{"app_name":"Olivelas SmartPages — Static Hosting & Governance","short_name":"SmartPages","organization":"Olivelas Engineering","tagline":"Plataforma Corporativa de Publicação Estática, Versionamento Git e Governança HBAC","repository_url":"https://github.com/pycriador/olivelas-smartpages","schema":"smartpages"}',
    'Identidade institucional e metadados da plataforma',
    NOW()
  ),
  (
    'platform.appearance',
    'personalization',
    '{"default_theme_id":"loft-obsidian","default_light_theme_id":"loft-classic","default_dark_theme_id":"loft-obsidian","default_language":"pt-BR","supported_languages":["pt-BR","en-US","es-ES"],"allow_user_theme_override":true,"allow_user_language_override":true}',
    'Personalizações visuais padrão (tema claro/escuro e internacionalização i18n)',
    NOW()
  ),
  (
    'platform.auth_policy',
    'security',
    '{"first_user_is_global_admin":true,"allow_self_registration":true,"default_self_register_role":"viewer","jwt_expire_minutes":1440,"min_password_length":6}',
    'Políticas de autenticação e promoção automática do primeiro cadastro para Global Admin',
    NOW()
  ),
  (
    'platform.default_quotas',
    'governance',
    '{"max_build_size_mb":250,"max_storage_mb":2048,"max_deploys_per_day":100,"max_retained_versions":50,"default_spa_mode":true,"default_auto_approval":true}',
    'Quotas e limites operacionais padrão aplicados a novos projetos',
    NOW()
  ),
  (
    'platform.default_cors_csp',
    'security',
    '{"origin":"*","allowed_methods":"GET,HEAD,OPTIONS","allowed_headers":"*","allow_credentials":false,"x_frame_options":"SAMEORIGIN","referrer_policy":"strict-origin-when-cross-origin"}',
    'Regras padrão de CORS e Content-Security-Policy para projetos publicados',
    NOW()
  )
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  value_json = EXCLUDED.value_json,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 3. Seed All 20 Visual Themes (10 Light + 10 Dark)
INSERT INTO smartpages.opspages_themes (
  id, name, type, is_dark,
  primary_color, primary_hover, primary_active,
  bg_layout, bg_container, bg_sidebar, bg_header,
  color_text, color_border, badge_tag,
  is_default, sort_order
)
VALUES
  -- 10 Light Themes
  ('loft-classic', 'Olivelas Classic (Laranja Copan)', 'light', FALSE, '#F56738', '#D94616', '#B83208', '#F4F7F9', '#FFFFFF', '#121619', '#FFFFFF', '#1A2024', '#E1E9EF', '#F56738', FALSE, 1),
  ('emerald-supabase', 'Emerald Supabase', 'light', FALSE, '#24B47E', '#1EA06E', '#17855B', '#F6FBF8', '#FFFFFF', '#0E1E17', '#FFFFFF', '#182C23', '#D2EDE0', '#24B47E', FALSE, 2),
  ('sapphire-tech', 'Sapphire Tech (Azul Corporativo)', 'light', FALSE, '#1677FF', '#4096FF', '#0958D9', '#F4F8FC', '#FFFFFF', '#0A1626', '#FFFFFF', '#102A45', '#D0E2FF', '#1677FF', FALSE, 3),
  ('royal-violet', 'Royal Violet (Roxo Real)', 'light', FALSE, '#722ED1', '#9254DE', '#531DAB', '#F8F6FD', '#FFFFFF', '#1A0E2E', '#FFFFFF', '#22075E', '#EFDBFF', '#722ED1', FALSE, 4),
  ('sunset-coral', 'Sunset Coral (Coral Vibrante)', 'light', FALSE, '#FF5722', '#FF7043', '#E64A19', '#FFF7F4', '#FFFFFF', '#26120D', '#FFFFFF', '#2B130E', '#FFDCCF', '#FF5722', FALSE, 5),
  ('nordic-teal', 'Nordic Teal (Turquesa Nórdico)', 'light', FALSE, '#13C2C2', '#36CFC9', '#08979C', '#F2FCFC', '#FFFFFF', '#092121', '#FFFFFF', '#002329', '#B5F5EC', '#13C2C2', FALSE, 6),
  ('rose-berry', 'Rose Berry (Rosa Moderno)', 'light', FALSE, '#EB2F96', '#F759AB', '#C41D7F', '#FDF4F8', '#FFFFFF', '#260B1B', '#FFFFFF', '#3B0A26', '#FFD6E7', '#EB2F96', FALSE, 7),
  ('amber-gold', 'Amber Gold (Dourado Âmbar)', 'light', FALSE, '#FAAD14', '#FFC53D', '#D48806', '#FDFBF2', '#FFFFFF', '#241D09', '#FFFFFF', '#362602', '#FFE58F', '#FAAD14', FALSE, 8),
  ('forest-mint', 'Forest Mint (Verde Floresta)', 'light', FALSE, '#52C41A', '#73D13D', '#389E0D', '#F6FCF2', '#FFFFFF', '#102409', '#FFFFFF', '#132B09', '#D9F7BE', '#52C41A', FALSE, 9),
  ('slate-graphite', 'Slate Graphite (Grafite Executivo)', 'light', FALSE, '#4A5568', '#718096', '#2D3748', '#F7FAFC', '#FFFFFF', '#1A202C', '#FFFFFF', '#1A202C', '#E2E8F0', '#4A5568', FALSE, 10),

  -- 10 Dark Themes
  ('loft-obsidian', 'Olivelas Obsidian (Escuro Copan)', 'dark', TRUE, '#F56738', '#FF8155', '#D94616', '#0E1216', '#141A1E', '#0A0D10', '#141A1E', '#F0F4F8', '#2A3640', '#F56738', TRUE, 11),
  ('supabase-midnight', 'Supabase Midnight', 'dark', TRUE, '#24B47E', '#33D998', '#1EA06E', '#121212', '#1C1C1C', '#0D0D0D', '#1C1C1C', '#EDEDED', '#2E2E2E', '#24B47E', FALSE, 12),
  ('cyberpunk-neon', 'Cyberpunk Neon', 'dark', TRUE, '#00F0FF', '#38F4FF', '#00C3CF', '#0B0F19', '#111827', '#070A11', '#111827', '#F3F4F6', '#1F2937', '#00F0FF', FALSE, 13),
  ('synthwave-violet', 'Synthwave Violet', 'dark', TRUE, '#BD34FE', '#D369FF', '#9A15DC', '#130B24', '#1E1235', '#0C0617', '#1E1235', '#F5F3FF', '#341E5C', '#BD34FE', FALSE, 14),
  ('tokyo-night', 'Tokyo Night', 'dark', TRUE, '#7AA2F7', '#96B7FA', '#5485E8', '#1A1B26', '#24283B', '#13141C', '#24283B', '#C0CAF5', '#2F354D', '#7AA2F7', FALSE, 15),
  ('dracula-classic', 'Dracula Classic', 'dark', TRUE, '#FF79C6', '#FF94D2', '#E05AA7', '#21222C', '#282A36', '#191A21', '#282A36', '#F8F8F2', '#44475A', '#FF79C6', FALSE, 16),
  ('nord-deep-sea', 'Nord Deep Sea', 'dark', TRUE, '#88C0D0', '#A3D4E2', '#6CA8B9', '#242933', '#2E3440', '#1B1F27', '#2E3440', '#ECEFF4', '#434C5E', '#88C0D0', FALSE, 17),
  ('matrix-green', 'Matrix Terminal', 'dark', TRUE, '#00FF66', '#33FF85', '#00D655', '#0A0E0C', '#101713', '#060907', '#101713', '#D1FADF', '#1A2920', '#00FF66', FALSE, 18),
  ('catppuccin-mocha', 'Catppuccin Mocha', 'dark', TRUE, '#F5C2E7', '#FAD8F0', '#E5A4D4', '#181825', '#1E1E2E', '#11111B', '#1E1E2E', '#CDD6F4', '#313244', '#F5C2E7', FALSE, 19),
  ('monokai-amber', 'Monokai Amber', 'dark', TRUE, '#F59E0B', '#FBBF24', '#D97706', '#141416', '#1D1E22', '#0C0D0E', '#1D1E22', '#F3F4F6', '#33353D', '#F59E0B', FALSE, 20)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  is_dark = EXCLUDED.is_dark,
  primary_color = EXCLUDED.primary_color,
  primary_hover = EXCLUDED.primary_hover,
  primary_active = EXCLUDED.primary_active,
  bg_layout = EXCLUDED.bg_layout,
  bg_container = EXCLUDED.bg_container,
  bg_sidebar = EXCLUDED.bg_sidebar,
  bg_header = EXCLUDED.bg_header,
  color_text = EXCLUDED.color_text,
  color_border = EXCLUDED.color_border,
  badge_tag = EXCLUDED.badge_tag,
  is_default = EXCLUDED.is_default,
  sort_order = EXCLUDED.sort_order;
