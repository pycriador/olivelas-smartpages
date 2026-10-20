import { create } from 'zustand';
import { api } from '../services/api';
import { getQueryParams, resolveSectionFromPathname, syncRouteAndParams } from '../utils/urlState';

export type NavSection =
  | 'dashboard'
  | 'deployments'
  | 'explorer'
  | 'git'
  | 'tokens'
  | 'iam'
  | 'quotas'
  | 'cors'
  | 'public-config'
  | 'audit'
  | 'errors'
  | 'settings';

export interface ProjectItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  framework: string;
  custom_domain?: string | null;
  entry_file: string;
  spa_mode: boolean;
  is_public: boolean;
  auto_approval: boolean;
  is_locked: boolean;
  locked_version?: string | null;
  locked_by?: string | null;
  locked_reason?: string | null;
  active_version?: string | null;
  github_repo_url?: string | null;
  github_branch: string;
  github_subpath: string;
  auto_sync_github: boolean;
  html_cache_control?: string;
  hashed_asset_cache_control?: string;
  asset_cache_control?: string;
  csp_policy?: string | null;
  x_frame_options?: string;
  referrer_policy?: string;
  hsts_max_age?: number;
  nosniff_enabled?: boolean;
  permissions_policy?: string;
  repo_disk_path: string;
  live_url: string;
  total_deployments: number;
  storage_bytes: number;
  effective_role?: 'admin' | 'editor' | 'viewer' | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentItem {
  id: number;
  project_id: number;
  version: string;
  git_commit_sha?: string | null;
  git_tag?: string | null;
  git_branch: string;
  release_notes: string;
  status: 'published' | 'ready' | 'pending_approval' | 'archived' | 'failed' | 'rolled_back' | 'rejected';
  source: string;
  file_count: number;
  size_bytes: number;
  checksum_sha256?: string | null;
  entry_file: string;
  created_by_email?: string | null;
  approved_by_email?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  created_at: string;
  preview_url: string;
  is_live: boolean;
  is_locked_version: boolean;
}

interface ProjectState {
  projects: ProjectItem[];
  activeProject: ProjectItem | null;
  deployments: DeploymentItem[];
  selectedVersionForExplorer: string | null;
  activeSection: NavSection;
  loading: boolean;
  setActiveSection: (sec: NavSection, pushHistory?: boolean) => void;
  setSelectedVersionForExplorer: (ver: string | null) => void;
  fetchProjects: (selectId?: number) => Promise<void>;
  selectProject: (project: ProjectItem) => Promise<void>;
  fetchDeployments: (projectId?: number) => Promise<void>;
}

const getInitialSection = (): NavSection => {
  if (typeof window === 'undefined') return 'dashboard';
  const resolved = resolveSectionFromPathname(window.location.pathname);
  if (resolved === 'landing' || resolved === 'login') {
    return 'dashboard';
  }
  return resolved;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  deployments: [],
  selectedVersionForExplorer: null,
  activeSection: getInitialSection(),
  loading: false,

  setActiveSection: (sec: NavSection, pushHistory: boolean = true) => {
    set({ activeSection: sec });
    if (typeof window !== 'undefined') {
      const activeProj = get().activeProject;
      syncRouteAndParams(
        `/${sec}`,
        {
          project: activeProj?.slug || getQueryParams().get('project') || undefined,
          page: 1,
          page_size: 10,
          q: null,
          status: null,
        },
        pushHistory
      );
    }
  },

  setSelectedVersionForExplorer: (ver: string | null) => {
    set({ selectedVersionForExplorer: ver });
    if (typeof window !== 'undefined' && ver) {
      syncRouteAndParams(undefined, { version: ver }, false);
    }
  },

  fetchProjects: async (selectId?: number) => {
    set({ loading: true });
    try {
      const res = await api.get<ProjectItem[]>('/projects');
      const list = res.data || [];
      const current = get().activeProject;
      const slugFromUrl = getQueryParams().get('project');
      const nextActive =
        (selectId ? list.find((p) => p.id === selectId) : null) ||
        (slugFromUrl ? list.find((p) => p.slug === slugFromUrl) : null) ||
        (current ? list.find((p) => p.id === current.id) : null) ||
        list[0] ||
        null;

      set({ projects: list, activeProject: nextActive, loading: false });
      if (nextActive) {
        syncRouteAndParams(undefined, { project: nextActive.slug }, false);
        await get().fetchDeployments(nextActive.id);
      } else {
        set({ deployments: [] });
      }
    } catch {
      set({ loading: false });
    }
  },

  selectProject: async (project: ProjectItem) => {
    set({
      activeProject: project,
      selectedVersionForExplorer: project.active_version || null,
    });
    syncRouteAndParams(undefined, { project: project.slug, page: 1 }, false);
    await get().fetchDeployments(project.id);
  },

  fetchDeployments: async (projectId?: number) => {
    const pid = projectId || get().activeProject?.id;
    if (!pid) return;
    try {
      const res = await api.get<DeploymentItem[]>(`/projects/${pid}/deployments`);
      const deps = res.data || [];
      const activeVer = get().activeProject?.active_version || deps[0]?.version || null;
      set({
        deployments: deps,
        selectedVersionForExplorer: get().selectedVersionForExplorer || activeVer,
      });
    } catch {
      set({ deployments: [] });
    }
  },
}));
