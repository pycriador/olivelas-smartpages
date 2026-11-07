/**
 * Supabase Direct Bridge for Olivelas SmartPages (`smartpages` isolated schema).
 *
 * Allows the Frontend (including when hosted on GitHub Pages) to communicate
 * directly with the isolated `smartpages` schema in Supabase via PostgREST and RPCs,
 * using `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`.
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || 'https://flxcgbftpwjvxetqbtzq.supabase.co'
).replace(/\/+$/, '');

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_jPp_W2Vytr7M1FKHTZunWg_tl2BNtvM';

export const SUPABASE_SCHEMA = import.meta.env.VITE_SUPABASE_SCHEMA || 'smartpages';

function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Accept-Profile': SUPABASE_SCHEMA,
    'Content-Profile': SUPABASE_SCHEMA,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

async function pgFetch<T = any>(
  path: string,
  options: RequestInit = {},
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers: {
      ...getHeaders(extraHeaders),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      data?.message || data?.details || data?.hint || `Supabase error (${res.status})`;
    const err: any = new Error(msg);
    err.response = {
      status: res.status,
      data: { detail: msg, message: msg },
    };
    throw err;
  }

  return data as T;
}

async function pgRpc<T = any>(fnName: string, args: Record<string, any> = {}): Promise<T> {
  return pgFetch<T>(`rpc/${fnName}`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

function getCurrentStoredUser(): any | null {
  try {
    const raw = localStorage.getItem('opspages_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function loadUsersWithGroups(): Promise<any[]> {
  const [users, groups, userGroups] = await Promise.all([
    pgFetch<any[]>('opspages_users?select=id,username,email,full_name,is_active,is_superuser,preferred_theme,preferred_language,created_at,updated_at&order=id.asc'),
    pgFetch<any[]>('opspages_groups?select=*&order=id.asc'),
    pgFetch<any[]>('opspages_user_groups?select=*'),
  ]);

  const groupMap = new Map<number, any>(groups.map((g) => [g.id, g]));
  return users.map((u) => {
    const uGroups = userGroups
      .filter((ug) => ug.user_id === u.id)
      .map((ug) => groupMap.get(ug.group_id))
      .filter(Boolean);
    return {
      ...u,
      groups: uGroups,
    };
  });
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseBody(data: any): any {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

export async function handleSupabaseRequest(
  config: AxiosRequestConfig
): Promise<AxiosResponse> {
  const method = (config.method || 'GET').toUpperCase();
  const rawUrl = (config.url || '').replace(/^\/api\/v1/, '');
  const [pathname, searchPart] = rawUrl.split('?');
  const path = pathname.replace(/\/+$/, '') || '/';
  const body = parseBody(config.data);
  const currentUser = getCurrentStoredUser();

  const makeResponse = (data: any, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: config as any,
  });

  // =========================================================================
  // 1. AUTH & PLATFORM CONFIG
  // =========================================================================
  if (path === '/auth/bootstrap-status' && method === 'GET') {
    const data = await pgRpc('bootstrap_status');
    return makeResponse(data);
  }

  if (path === '/auth/platform-config' && method === 'GET') {
    const data = await pgRpc('bootstrap_status');
    return makeResponse(data);
  }

  if (path === '/auth/platform-config' && method === 'PUT') {
    if (currentUser?.id && (body.preferred_theme || body.preferred_language)) {
      const patch: Record<string, any> = {};
      if (body.preferred_theme) patch.preferred_theme = body.preferred_theme;
      if (body.preferred_language) patch.preferred_language = body.preferred_language;
      await pgFetch(`opspages_users?id=eq.${currentUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    }
    const data = await pgRpc('bootstrap_status');
    return makeResponse(data);
  }

  if (path === '/auth/register' && method === 'POST') {
    const data = await pgRpc('register_user', {
      p_email: body.email,
      p_full_name: body.full_name || '',
      p_password: body.password,
      p_username: body.username || null,
      p_role: body.role || 'viewer',
    });
    return makeResponse(data, 201);
  }

  if (path === '/auth/login' && method === 'POST') {
    const identifier = body.username || body.username_or_email || body.email || '';
    const data = await pgRpc('authenticate_user', {
      p_identifier: identifier,
      p_password: body.password,
    });
    return makeResponse(data);
  }

  if (path === '/auth/me' && method === 'GET') {
    const token = localStorage.getItem('opspages_access_token') || '';
    let userId = currentUser?.id;
    if (token.startsWith('sp_jwt_')) {
      const parts = token.split('_');
      if (parts.length >= 4) userId = Number(parts[2]);
    }
    if (!userId) {
      const err: any = new Error('Sessão expirada.');
      err.response = { status: 401, data: { detail: 'Sessão expirada.' } };
      throw err;
    }
    const users = await loadUsersWithGroups();
    const found = users.find((u) => Number(u.id) === Number(userId));
    if (!found) {
      const err: any = new Error('Usuário não encontrado.');
      err.response = { status: 401, data: { detail: 'Usuário não encontrado.' } };
      throw err;
    }
    return makeResponse(found);
  }

  if (path === '/auth/change-password' && method === 'POST') {
    if (!currentUser?.id) {
      throw new Error('Usuário não autenticado.');
    }
    const data = await pgRpc('change_user_password', {
      p_user_id: Number(currentUser.id),
      p_current_password: body.old_password || body.current_password || '',
      p_new_password: body.new_password,
      p_is_admin_override: false,
    });
    return makeResponse(data);
  }

  if (path === '/auth/system-info' && method === 'GET') {
    return makeResponse({
      dialect: 'postgresql (Supabase)',
      driver: 'postgrest-https',
      schema: SUPABASE_SCHEMA,
      connected: true,
      error: null,
      supported_engines: ['postgresql', 'sqlite', 'mariadb'],
      repos_root: `/repos (${SUPABASE_SCHEMA})`,
      supabase_url: SUPABASE_URL,
    });
  }

  // =========================================================================
  // 2. PUBLIC OVERVIEW (Landing Page)
  // =========================================================================
  if (path === '/public/overview' && method === 'GET') {
    const [projects, deployments, groups, users, bootstrap] = await Promise.all([
      pgFetch<any[]>('opspages_projects?select=*&order=created_at.desc'),
      pgFetch<any[]>('opspages_deployments?select=*&order=created_at.desc'),
      pgFetch<any[]>('opspages_groups?select=*&order=id.asc'),
      pgFetch<any[]>('opspages_users?select=id,email,is_superuser'),
      pgRpc('bootstrap_status'),
    ]);

    const publishedDeploys = deployments.filter((d) => d.status === 'published');
    return makeResponse({
      service: 'Olivelas SmartPages — Static Hosting & Governance',
      version: '1.0.0',
      schema: SUPABASE_SCHEMA,
      bootstrap_status: bootstrap,
      stats: {
        total_projects: projects.length,
        published_projects: projects.filter((p) => Boolean(p.active_version)).length,
        total_deployments: deployments.length,
        published_deployments: publishedDeploys.length,
        total_users: users.length,
        hbac_groups: groups.length,
      },
      hbac_roles: groups.map((g) => ({
        id: g.id,
        name: g.name,
        role_level: g.role_level,
        description: g.description,
      })),
      public_projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        framework: p.framework,
        active_version: p.active_version,
        is_locked: p.is_locked,
        spa_mode: p.spa_mode,
        live_url: `/pages/${p.slug}/`,
        repo_folder: `/repos/${p.slug}`,
        updated_at: p.updated_at,
      })),
    });
  }

  // =========================================================================
  // 3. USERS & GROUPS (IAM)
  // =========================================================================
  if (path === '/users' && method === 'GET') {
    const users = await loadUsersWithGroups();
    return makeResponse(users);
  }

  if (path === '/users' && method === 'POST') {
    const created = await pgRpc('admin_create_user', {
      p_username: body.username || (body.email || '').split('@')[0],
      p_email: body.email,
      p_full_name: body.full_name || '',
      p_password: body.password,
      p_is_superuser: Boolean(body.is_superuser || body.role === 'admin'),
      p_group_ids: body.group_ids || [],
      p_role: body.role || 'viewer',
      p_actor_email: currentUser?.email || 'admin',
    });
    return makeResponse(created, 201);
  }

  const userMatch = path.match(/^\/users\/(\d+)$/);
  if (userMatch) {
    const targetUserId = Number(userMatch[1]);
    if (method === 'PUT') {
      const patch: Record<string, any> = { updated_at: new Date().toISOString() };
      if (body.email !== undefined) patch.email = body.email.trim().toLowerCase();
      if (body.full_name !== undefined) patch.full_name = body.full_name.trim();
      if (body.is_active !== undefined) patch.is_active = body.is_active;
      if (body.is_superuser !== undefined) patch.is_superuser = body.is_superuser;
      if (body.preferred_theme !== undefined) patch.preferred_theme = body.preferred_theme;
      if (body.preferred_language !== undefined) patch.preferred_language = body.preferred_language;

      await pgFetch(`opspages_users?id=eq.${targetUserId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });

      if (body.password) {
        await pgRpc('change_user_password', {
          p_user_id: targetUserId,
          p_current_password: '',
          p_new_password: body.password,
          p_is_admin_override: true,
        });
      }

      if (body.role) {
        const groups = await pgFetch<any[]>(`opspages_groups?role_level=eq.${body.role}&order=id.asc`);
        if (groups.length > 0) {
          await pgFetch(`opspages_user_groups?user_id=eq.${targetUserId}`, { method: 'DELETE' });
          await pgFetch('opspages_user_groups', {
            method: 'POST',
            body: JSON.stringify({ user_id: targetUserId, group_id: groups[0].id }),
          });
        }
      }

      const users = await loadUsersWithGroups();
      return makeResponse(users.find((u) => u.id === targetUserId));
    }

    if (method === 'DELETE') {
      await pgFetch(`opspages_users?id=eq.${targetUserId}`, { method: 'DELETE' });
      return makeResponse({ success: true });
    }
  }

  if (path === '/groups' && method === 'GET') {
    const groups = await pgFetch<any[]>('opspages_groups?select=*&order=id.asc');
    return makeResponse(groups);
  }

  if (path === '/groups' && method === 'POST') {
    const rows = await pgFetch<any[]>('opspages_groups', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        description: body.description || '',
        role_level: body.role_level || 'editor',
      }),
    });
    return makeResponse(rows[0], 201);
  }

  // =========================================================================
  // 4. PROJECTS & GOVERNANCE
  // =========================================================================
  if (path === '/projects' && method === 'GET') {
    const projects = await pgFetch<any[]>('opspages_projects?select=*&order=created_at.desc');
    return makeResponse(
      projects.map((p) => ({
        ...p,
        repo_folder_name: `/repos/${p.slug}`,
        live_url: `/pages/${p.slug}/`,
      }))
    );
  }

  if (path === '/projects' && method === 'POST') {
    const slug = (body.slug || body.name || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const initialVersion = 'v1.0.0';
    const rows = await pgFetch<any[]>('opspages_projects', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        slug,
        description: body.description || '',
        framework: body.framework || 'react-vite',
        active_version: initialVersion,
        auto_approval: body.auto_approval ?? true,
        spa_mode: body.spa_mode ?? true,
        is_public: body.is_public ?? true,
        entry_file: body.entry_file || 'index.html',
        github_repo_url: body.github_repo_url || null,
        github_branch: body.github_branch || 'main',
        github_subpath: body.github_subpath || `/repos/${slug}`,
        created_by: currentUser?.id || null,
      }),
    });
    const project = rows[0];

    // Create default quota, CORS rule, public configs, and initial v1.0.0 deployment
    await Promise.all([
      pgFetch('opspages_project_quotas', {
        method: 'POST',
        body: JSON.stringify({
          project_id: project.id,
          max_build_size_mb: 250,
          max_storage_mb: 2048,
          max_deploys_per_day: 100,
          max_retained_versions: 50,
        }),
      }),
      pgFetch('opspages_cors_rules', {
        method: 'POST',
        body: JSON.stringify({
          project_id: project.id,
          origin: 'https://pycriador.github.io',
          allowed_methods: 'GET,HEAD,OPTIONS',
          allowed_headers: '*',
          allow_credentials: false,
          max_age_seconds: 3600,
          cache_control: 'public, max-age=3600',
          is_active: true,
          created_by_email: currentUser?.email || 'admin',
        }),
      }),
      pgFetch('opspages_public_configs', {
        method: 'POST',
        body: JSON.stringify([
          {
            project_id: project.id,
            environment: 'production',
            opsbase_url: `${SUPABASE_URL}/rest/v1`,
            opsbase_public_key: SUPABASE_KEY,
            opsbase_project_slug: slug,
            opsbase_schema_name: SUPABASE_SCHEMA,
            opsbase_key_status: 'active',
            scopes: 'public:read,data:query,auth:session',
            public_vars_json: JSON.stringify({ VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_SCHEMA: SUPABASE_SCHEMA }),
            inject_in_html: true,
            is_active: true,
          },
        ]),
      }),
    ]);

    const defaultHtml = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8" />\n  <title>${project.name}</title>\n</head>\n<body>\n  <h1>${project.name} (${initialVersion})</h1>\n  <p>${project.description || 'Publicado via Olivelas SmartPages'}</p>\n</body>\n</html>`;
    const checksum = await sha256Hex(defaultHtml);
    const depRows = await pgFetch<any[]>('opspages_deployments', {
      method: 'POST',
      body: JSON.stringify({
        project_id: project.id,
        version: initialVersion,
        git_commit_sha: checksum.slice(0, 12),
        git_tag: initialVersion,
        git_branch: project.github_branch || 'main',
        release_notes: 'Initial project bootstrap v1.0.0',
        status: 'published',
        source: 'seed',
        file_count: 1,
        size_bytes: defaultHtml.length,
        checksum_sha256: checksum,
        entry_file: 'index.html',
        created_by: currentUser?.id || null,
        created_by_email: currentUser?.email || 'admin',
        approved_by_email: currentUser?.email || 'admin',
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      }),
    });

    if (depRows[0]) {
      await pgFetch('opspages_release_files', {
        method: 'POST',
        body: JSON.stringify({
          deployment_id: depRows[0].id,
          project_id: project.id,
          relative_path: 'index.html',
          content_type: 'text/html',
          size_bytes: defaultHtml.length,
          content_text: defaultHtml,
        }),
      });
    }

    return makeResponse(
      {
        ...project,
        repo_folder_name: `/repos/${project.slug}`,
        live_url: `/pages/${project.slug}/`,
      },
      201
    );
  }

  const projectMatch = path.match(/^\/projects\/(\d+)(?:\/(.*))?$/);
  if (projectMatch) {
    const projectId = Number(projectMatch[1]);
    const subPath = projectMatch[2] || '';

    if (!subPath && method === 'GET') {
      const rows = await pgFetch<any[]>(`opspages_projects?id=eq.${projectId}`);
      if (!rows[0]) throw new Error('Projeto não encontrado.');
      return makeResponse({
        ...rows[0],
        repo_folder_name: `/repos/${rows[0].slug}`,
        live_url: `/pages/${rows[0].slug}/`,
      });
    }

    if (!subPath && method === 'PUT') {
      const rows = await pgFetch<any[]>(`opspages_projects?id=eq.${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
      });
      return makeResponse(rows[0]);
    }

    if (!subPath && method === 'DELETE') {
      await pgFetch(`opspages_projects?id=eq.${projectId}`, { method: 'DELETE' });
      return makeResponse({ success: true });
    }

    if (subPath === 'lock' && method === 'POST') {
      const rows = await pgFetch<any[]>(`opspages_projects?id=eq.${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_locked: true,
          locked_version: body.version || null,
          locked_by: currentUser?.email || 'admin',
          locked_reason: body.reason || 'Versão travada pelo administrador',
          updated_at: new Date().toISOString(),
        }),
      });
      return makeResponse(rows[0]);
    }

    if (subPath === 'unlock' && method === 'POST') {
      const rows = await pgFetch<any[]>(`opspages_projects?id=eq.${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_locked: false,
          locked_version: null,
          locked_by: null,
          locked_reason: null,
          updated_at: new Date().toISOString(),
        }),
      });
      return makeResponse(rows[0]);
    }

    // Deployments
    if (subPath === 'deployments' && method === 'GET') {
      const deps = await pgFetch<any[]>(
        `opspages_deployments?project_id=eq.${projectId}&order=created_at.desc`
      );
      return makeResponse(deps);
    }

    if (subPath === 'deployments/quick-build' && method === 'POST') {
      const htmlContent = body.html_content || body.index_html || '<h1>SmartPages Build</h1>';
      const cssContent = body.css_content || '';
      const jsContent = body.js_content || '';
      const version = body.version || `v1.0.${Date.now() % 1000}`;
      const checksum = await sha256Hex(htmlContent + cssContent + jsContent);

      const projRows = await pgFetch<any[]>(`opspages_projects?id=eq.${projectId}`);
      const proj = projRows[0];
      const statusVal = proj?.auto_approval && !proj?.is_locked ? 'published' : 'pending_approval';

      const depRows = await pgFetch<any[]>('opspages_deployments', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          version,
          git_commit_sha: checksum.slice(0, 12),
          git_tag: version,
          git_branch: proj?.github_branch || 'main',
          release_notes: body.release_notes || `Quick build ${version}`,
          status: statusVal,
          source: 'quick_build',
          file_count: 1 + (cssContent ? 1 : 0) + (jsContent ? 1 : 0),
          size_bytes: htmlContent.length + cssContent.length + jsContent.length,
          checksum_sha256: checksum,
          entry_file: 'index.html',
          created_by: currentUser?.id || null,
          created_by_email: currentUser?.email || 'admin',
          published_at: statusVal === 'published' ? new Date().toISOString() : null,
        }),
      });

      const dep = depRows[0];
      if (dep) {
        const filesPayload: any[] = [
          {
            deployment_id: dep.id,
            project_id: projectId,
            relative_path: 'index.html',
            content_type: 'text/html',
            size_bytes: htmlContent.length,
            content_text: htmlContent,
          },
        ];
        if (cssContent) {
          filesPayload.push({
            deployment_id: dep.id,
            project_id: projectId,
            relative_path: 'styles.css',
            content_type: 'text/css',
            size_bytes: cssContent.length,
            content_text: cssContent,
          });
        }
        if (jsContent) {
          filesPayload.push({
            deployment_id: dep.id,
            project_id: projectId,
            relative_path: 'app.js',
            content_type: 'application/javascript',
            size_bytes: jsContent.length,
            content_text: jsContent,
          });
        }
        await pgFetch('opspages_release_files', {
          method: 'POST',
          body: JSON.stringify(filesPayload),
        });

        if (statusVal === 'published') {
          await pgFetch(`opspages_projects?id=eq.${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify({ active_version: version, updated_at: new Date().toISOString() }),
          });
        }
      }
      return makeResponse(dep, 201);
    }

    const depActionMatch = subPath.match(/^deployments\/(\d+)\/(publish|approve|reject|rollback)$/);
    if (depActionMatch && method === 'POST') {
      const depId = Number(depActionMatch[1]);
      const action = depActionMatch[2];
      const depRows = await pgFetch<any[]>(`opspages_deployments?id=eq.${depId}`);
      const dep = depRows[0];
      if (!dep) throw new Error('Deployment não encontrado.');

      const nextStatus = action === 'reject' ? 'rejected' : 'published';
      const updated = await pgFetch<any[]>(`opspages_deployments?id=eq.${depId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          approved_by_email: currentUser?.email || 'admin',
          approved_at: new Date().toISOString(),
          published_at: nextStatus === 'published' ? new Date().toISOString() : dep.published_at,
        }),
      });

      if (nextStatus === 'published') {
        await pgFetch(`opspages_projects?id=eq.${projectId}`, {
          method: 'PATCH',
          body: JSON.stringify({ active_version: dep.version, updated_at: new Date().toISOString() }),
        });
      }
      return makeResponse(updated[0]);
    }

    // Git & Explorer endpoints
    if (subPath === 'git/status' && method === 'GET') {
      const [projRows, deps] = await Promise.all([
        pgFetch<any[]>(`opspages_projects?id=eq.${projectId}`),
        pgFetch<any[]>(`opspages_deployments?project_id=eq.${projectId}&order=created_at.desc`),
      ]);
      const proj = projRows[0] || {};
      return makeResponse({
        slug: proj.slug,
        repo_path: `/repos/${proj.slug}`,
        branch: proj.github_branch || 'main',
        active_version: proj.active_version,
        commit_count: deps.length,
        tag_count: deps.length,
        head_sha: deps[0]?.git_commit_sha || 'initial',
        github_repo_url: proj.github_repo_url,
      });
    }

    if (subPath === 'git/commits' && method === 'GET') {
      const deps = await pgFetch<any[]>(
        `opspages_deployments?project_id=eq.${projectId}&order=created_at.desc`
      );
      return makeResponse(
        deps.map((d) => ({
          sha: d.git_commit_sha || `v-${d.id}`,
          short_sha: (d.git_commit_sha || `v-${d.id}`).slice(0, 8),
          author: d.created_by_email || 'smartpages',
          date: d.created_at,
          message: `[${d.version}] ${d.release_notes || 'Release deployment'}`,
          version: d.version,
        }))
      );
    }

    if (subPath === 'git/tags' && method === 'GET') {
      const deps = await pgFetch<any[]>(
        `opspages_deployments?project_id=eq.${projectId}&order=created_at.desc`
      );
      return makeResponse(
        deps.map((d) => ({
          name: d.git_tag || d.version,
          sha: d.git_commit_sha || `v-${d.id}`,
          date: d.created_at,
          status: d.status,
        }))
      );
    }

    if (subPath === 'git/tree' && method === 'GET') {
      const files = await pgFetch<any[]>(
        `opspages_release_files?project_id=eq.${projectId}&order=relative_path.asc`
      );
      return makeResponse({
        files: files.map((f) => ({
          path: f.relative_path,
          name: f.relative_path.split('/').pop() || f.relative_path,
          size_bytes: f.size_bytes,
          content_type: f.content_type,
          is_binary: false,
        })),
      });
    }

    if (subPath === 'git/file' && method === 'GET') {
      const params = new URLSearchParams(searchPart || '');
      const filePath = params.get('path') || (config.params as any)?.path || 'index.html';
      const files = await pgFetch<any[]>(
        `opspages_release_files?project_id=eq.${projectId}&relative_path=eq.${encodeURIComponent(filePath)}&order=id.desc&limit=1`
      );
      const file = files[0];
      return makeResponse({
        path: filePath,
        content: file?.content_text || '',
        size_bytes: file?.size_bytes || 0,
        is_binary: false,
      });
    }

    // Permissions
    if (subPath === 'permissions' && method === 'GET') {
      const [perms, users, groups] = await Promise.all([
        pgFetch<any[]>(`opspages_project_permissions?project_id=eq.${projectId}`),
        pgFetch<any[]>('opspages_users?select=id,username,email'),
        pgFetch<any[]>('opspages_groups?select=id,name,role_level'),
      ]);
      const uMap = new Map(users.map((u) => [u.id, u]));
      const gMap = new Map(groups.map((g) => [g.id, g]));
      return makeResponse(
        perms.map((p) => ({
          ...p,
          username: uMap.get(p.user_id)?.username || null,
          user_email: uMap.get(p.user_id)?.email || null,
          group_name: gMap.get(p.group_id)?.name || null,
        }))
      );
    }

    if (subPath === 'permissions' && method === 'POST') {
      const rows = await pgFetch<any[]>('opspages_project_permissions', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          user_id: body.user_id || null,
          group_id: body.group_id || null,
          role: body.role || 'viewer',
        }),
      });
      return makeResponse(rows[0], 201);
    }

    const permDelMatch = subPath.match(/^permissions\/(\d+)$/);
    if (permDelMatch && method === 'DELETE') {
      await pgFetch(`opspages_project_permissions?id=eq.${permDelMatch[1]}`, { method: 'DELETE' });
      return makeResponse({ success: true });
    }

    // Tokens
    if (subPath === 'tokens' && method === 'GET') {
      const tokens = await pgFetch<any[]>(
        `opspages_api_tokens?project_id=eq.${projectId}&order=created_at.desc`
      );
      return makeResponse(tokens);
    }

    if (subPath === 'tokens' && method === 'POST') {
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const tokenType = body.token_type || 'deploy';
      const prefix = `opsp_${tokenType}_${rand.slice(0, 8)}`;
      const rawSecret = `${prefix}_${rand.slice(8)}`;
      const keyHash = await sha256Hex(rawSecret);

      const rows = await pgFetch<any[]>('opspages_api_tokens', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          name: body.name,
          token_prefix: prefix,
          key_hash: keyHash,
          token_type: tokenType,
          scopes: body.scopes || 'read,deploy',
          is_active: true,
          created_by: currentUser?.id || null,
        }),
      });
      return makeResponse({ ...rows[0], raw_secret: rawSecret }, 201);
    }

    const tokenDelMatch = subPath.match(/^tokens\/(\d+)$/);
    if (tokenDelMatch && method === 'DELETE') {
      await pgFetch(`opspages_api_tokens?id=eq.${tokenDelMatch[1]}`, { method: 'DELETE' });
      return makeResponse({ success: true });
    }

    // Quota
    if (subPath === 'quota' && method === 'GET') {
      const rows = await pgFetch<any[]>(`opspages_project_quotas?project_id=eq.${projectId}`);
      return makeResponse(
        rows[0] || {
          project_id: projectId,
          max_build_size_mb: 250,
          max_storage_mb: 2048,
          max_deploys_per_day: 100,
          max_retained_versions: 50,
          current_storage_mb: 0.1,
          deploys_today: 0,
        }
      );
    }

    if (subPath === 'quota' && method === 'PUT') {
      const rows = await pgFetch<any[]>(`opspages_project_quotas?project_id=eq.${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
      });
      return makeResponse(rows[0]);
    }

    // CORS & Security Headers
    if (subPath === 'cors' && method === 'GET') {
      const rules = await pgFetch<any[]>(
        `opspages_cors_rules?project_id=eq.${projectId}&order=id.asc`
      );
      return makeResponse(rules);
    }

    if (subPath === 'cors' && method === 'POST') {
      const rows = await pgFetch<any[]>('opspages_cors_rules', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          origin: body.origin,
          allowed_methods: body.allowed_methods || 'GET,HEAD,OPTIONS',
          allowed_headers: body.allowed_headers || '*',
          allow_credentials: Boolean(body.allow_credentials && body.origin !== '*'),
          max_age_seconds: body.max_age_seconds || 3600,
          cache_control: body.cache_control || 'public, max-age=3600',
          is_active: body.is_active ?? true,
          created_by_email: currentUser?.email || 'admin',
        }),
      });
      return makeResponse(rows[0], 201);
    }

    const corsItemMatch = subPath.match(/^cors\/(\d+)$/);
    if (corsItemMatch) {
      const ruleId = Number(corsItemMatch[1]);
      if (method === 'PUT' || method === 'PATCH') {
        const rows = await pgFetch<any[]>(`opspages_cors_rules?id=eq.${ruleId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
        });
        return makeResponse(rows[0]);
      }
      if (method === 'DELETE') {
        await pgFetch(`opspages_cors_rules?id=eq.${ruleId}`, { method: 'DELETE' });
        return makeResponse({ success: true });
      }
    }

    // Public Config
    if (subPath === 'public-config' && method === 'GET') {
      const configs = await pgFetch<any[]>(
        `opspages_public_configs?project_id=eq.${projectId}&order=id.asc`
      );
      return makeResponse(
        configs.map((c) => ({
          ...c,
          public_vars: (() => {
            try {
              return JSON.parse(c.public_vars_json || '{}');
            } catch {
              return {};
            }
          })(),
        }))
      );
    }

    if (subPath === 'public-config' && method === 'PUT') {
      const envName = body.environment || 'production';
      const existing = await pgFetch<any[]>(
        `opspages_public_configs?project_id=eq.${projectId}&environment=eq.${envName}`
      );
      const payload = {
        opsbase_url: body.opsbase_url || `${SUPABASE_URL}/rest/v1`,
        opsbase_public_key: body.opsbase_public_key || SUPABASE_KEY,
        opsbase_project_slug: body.opsbase_project_slug || '',
        opsbase_schema_name: body.opsbase_schema_name || SUPABASE_SCHEMA,
        scopes: body.scopes || 'public:read,data:query,auth:session',
        public_vars_json: JSON.stringify(body.public_vars || {}),
        inject_in_html: body.inject_in_html ?? true,
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      };
      if (existing[0]) {
        const rows = await pgFetch<any[]>(`opspages_public_configs?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        return makeResponse(rows[0]);
      } else {
        const rows = await pgFetch<any[]>('opspages_public_configs', {
          method: 'POST',
          body: JSON.stringify({ project_id: projectId, environment: envName, ...payload }),
        });
        return makeResponse(rows[0]);
      }
    }
  }

  // =========================================================================
  // 5. AUDIT LOGS & ERROR TELEMETRY
  // =========================================================================
  if (path === '/audit' && method === 'GET') {
    const logs = await pgFetch<any[]>('opspages_audit_logs?select=*&order=timestamp.desc&limit=200');
    return makeResponse(
      logs.map((l) => ({
        ...l,
        diff: (() => {
          try {
            return l.diff_payload ? JSON.parse(l.diff_payload) : null;
          } catch {
            return { raw: l.diff_payload };
          }
        })(),
      }))
    );
  }

  if (path === '/errors' && method === 'GET') {
    const errs = await pgFetch<any[]>('opspages_error_reports?select=*&order=created_at.desc&limit=100');
    return makeResponse({
      total: errs.length,
      open_count: errs.filter((e) => e.status === 'open').length,
      resolved_count: errs.filter((e) => e.status === 'resolved').length,
      items: errs,
    });
  }

  if (path === '/errors' && method === 'POST') {
    const rows = await pgFetch<any[]>('opspages_error_reports', {
      method: 'POST',
      body: JSON.stringify({
        project_slug: body.project_slug || null,
        page_url: body.page_url || window.location.href,
        route_path: body.route_path || '/',
        error_code: body.error_code || 'ERR_FRONTEND_RUNTIME',
        http_status: body.http_status || 500,
        severity: body.severity || 'error',
        title: body.title || 'Erro reportado',
        message: body.message || '',
        stack_trace: body.stack_trace || null,
        status: 'open',
      }),
    });
    return makeResponse(rows[0], 201);
  }

  const errItemMatch = path.match(/^\/errors\/(\d+)$/);
  if (errItemMatch) {
    const errId = Number(errItemMatch[1]);
    if (method === 'PATCH' || method === 'PUT') {
      const rows = await pgFetch<any[]>(`opspages_error_reports?id=eq.${errId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
      });
      return makeResponse(rows[0]);
    }
    if (method === 'DELETE') {
      await pgFetch(`opspages_error_reports?id=eq.${errId}`, { method: 'DELETE' });
      return makeResponse({ success: true });
    }
  }

  if (path === '/opsbase/status' && method === 'GET') {
    return makeResponse({
      connected: true,
      opsbase_url: SUPABASE_URL,
      schema: SUPABASE_SCHEMA,
      mode: 'supabase_isolated_schema',
    });
  }

  if (path === '/opsbase/projects' && method === 'GET') {
    return makeResponse({ items: [] });
  }

  return makeResponse({ ok: true });
}
