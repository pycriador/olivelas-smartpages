import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Tooltip } from 'antd';
import {
  DashboardOutlined,
  RocketOutlined,
  FolderOpenOutlined,
  BranchesOutlined,
  KeyOutlined,
  SafetyOutlined,
  BarChartOutlined,
  GlobalOutlined,
  HistoryOutlined,
  DownOutlined,
  PlusOutlined,
  LogoutOutlined,
  CheckCircleFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  BgColorsOutlined,
  LockFilled,
  ExportOutlined,
  CloudServerOutlined,
  ApiOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { NavSection, useProjectStore } from '../../stores/useProjectStore';
import { useTheme } from '../../theme/CopanThemeProvider';
import { useI18nStore } from '../../i18n/useTranslation';
import { Locale } from '../../i18n/translations';
import { ProjectDashboard } from '../../features/projects/ProjectDashboard';
import { DeploymentsManager } from '../../features/deployments/DeploymentsManager';
import { BuildFileExplorer } from '../../features/explorer/BuildFileExplorer';
import { GitVersionControl } from '../../features/git/GitVersionControl';
import { TokensManager } from '../../features/tokens/TokensManager';
import { IamManager } from '../../features/iam/IamManager';
import { QuotasManager } from '../../features/quotas/QuotasManager';
import { CorsManager } from '../../features/cors/CorsManager';
import { PublicConfigManager } from '../../features/config/PublicConfigManager';
import { AuditViewer } from '../../features/audit/AuditViewer';
import { ErrorsManager } from '../../features/errors/ErrorsManager';
import { SettingsPage } from '../../features/settings/SettingsPage';
import { CreateProjectModal } from '../../features/projects/CreateProjectModal';

const { Header, Sider, Content } = Layout;

const ALL_GROUP_KEYS = ['grp-hosting', 'grp-integration', 'grp-security', 'grp-operations'] as const;

const SECTION_TO_GROUP: Record<NavSection, string> = {
  dashboard: 'grp-hosting',
  deployments: 'grp-hosting',
  explorer: 'grp-hosting',
  git: 'grp-hosting',
  'public-config': 'grp-integration',
  cors: 'grp-integration',
  quotas: 'grp-integration',
  iam: 'grp-security',
  tokens: 'grp-security',
  audit: 'grp-operations',
  errors: 'grp-operations',
  settings: 'grp-operations',
};

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const {
    projects,
    activeProject,
    activeSection,
    setActiveSection,
    fetchProjects,
    selectProject,
  } = useProjectStore();
  const { theme, isDark } = useTheme();
  const { t, locale, setLocale } = useI18nStore();

  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('opspages-sidebar-collapsed') === 'true';
  });
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('opspages-sidebar-open-groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
    return [SECTION_TO_GROUP[activeSection] || 'grp-hosting'];
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const parentGroup = SECTION_TO_GROUP[activeSection];
    if (parentGroup && !openKeys.includes(parentGroup)) {
      const next = [...openKeys, parentGroup];
      setOpenKeys(next);
      localStorage.setItem('opspages-sidebar-open-groups', JSON.stringify(next));
    }
  }, [activeSection]);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
    localStorage.setItem('opspages-sidebar-open-groups', JSON.stringify(keys));
  };

  const toggleAllGroups = () => {
    const next = openKeys.length === ALL_GROUP_KEYS.length ? [SECTION_TO_GROUP[activeSection] || 'grp-hosting'] : [...ALL_GROUP_KEYS];
    setOpenKeys(next);
    localStorage.setItem('opspages-sidebar-open-groups', JSON.stringify(next));
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('opspages-sidebar-collapsed', String(next));
  };

  const menuItems = [
    {
      key: 'grp-hosting',
      icon: <CloudServerOutlined />,
      label: t('nav.group.hosting', 'Publicação & Git'),
      children: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: t('nav.dashboard', 'Visão Geral'),
        },
        {
          key: 'deployments',
          icon: <RocketOutlined />,
          label: t('nav.deployments', 'Deploys & Versões'),
        },
        {
          key: 'explorer',
          icon: <FolderOpenOutlined />,
          label: t('nav.explorer', 'Arquivos da Build'),
        },
        {
          key: 'git',
          icon: <BranchesOutlined />,
          label: t('nav.git', 'Git & /repos'),
        },
      ],
    },
    {
      key: 'grp-integration',
      icon: <ApiOutlined />,
      label: t('nav.group.integration', 'Integração & Rede'),
      children: [
        {
          key: 'public-config',
          icon: <ApiOutlined />,
          label: t('nav.publicConfig', 'Credenciais OpsBase (P-13)'),
        },
        {
          key: 'cors',
          icon: <GlobalOutlined />,
          label: t('nav.cors', 'CORS & Domínios'),
        },
        {
          key: 'quotas',
          icon: <BarChartOutlined />,
          label: t('nav.quotas', 'Quotas & Limites'),
        },
      ],
    },
    {
      key: 'grp-security',
      icon: <SafetyOutlined />,
      label: t('nav.group.security', 'Segurança & Acesso'),
      children: [
        {
          key: 'iam',
          icon: <SafetyOutlined />,
          label: t('nav.iam', 'IAM & Grupos (HBAC)'),
        },
        {
          key: 'tokens',
          icon: <KeyOutlined />,
          label: t('nav.tokens', 'Tokens de API'),
        },
      ],
    },
    {
      key: 'grp-operations',
      icon: <HistoryOutlined />,
      label: t('nav.group.operations', 'Governança & Sistema'),
      children: [
        {
          key: 'audit',
          icon: <HistoryOutlined />,
          label: t('nav.audit', 'Auditoria & Logs'),
        },
        {
          key: 'errors',
          icon: <BugOutlined />,
          label: t('nav.errors', 'Central de Erros (/errors)'),
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: t('nav.settings', 'Configurações & Temas'),
        },
      ],
    },
  ];

  const handleMenuClick = (key: string) => {
    setActiveSection(key as NavSection);
  };

  const projectMenuItems = [
    ...projects.map((p) => ({
      key: `proj-${p.id}`,
      label: (
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="font-semibold">{p.name}</span>
          <span className="text-xs font-mono text-gray-400">/repos/{p.slug}</span>
        </div>
      ),
      onClick: () => selectProject(p),
    })),
    { type: 'divider' as const },
    {
      key: 'new-project',
      icon: <PlusOutlined style={{ color: theme.primary }} />,
      label: (
        <span style={{ color: theme.primary, fontWeight: 600 }}>
          {t('header.newProject', 'Criar Novo Projeto')}
        </span>
      ),
      onClick: () => setCreateProjectModalOpen(true),
    },
  ];

  const languageMenuItems = [
    {
      key: 'pt-BR',
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span>🇧🇷</span>
          <span className={locale === 'pt-BR' ? 'font-bold' : ''}>Português (BR)</span>
        </div>
      ),
      onClick: () => setLocale('pt-BR' as Locale),
    },
    {
      key: 'en',
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span>🇺🇸</span>
          <span className={locale === 'en' ? 'font-bold' : ''}>English (US)</span>
        </div>
      ),
      onClick: () => setLocale('en' as Locale),
    },
    {
      key: 'es',
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span>🇪🇸</span>
          <span className={locale === 'es' ? 'font-bold' : ''}>Español (Latam)</span>
        </div>
      ),
      onClick: () => setLocale('es' as Locale),
    },
  ];

  const userMenuItems = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div className="py-1">
          <div className="font-semibold">{user?.full_name || user?.email}</div>
          <div className="text-xs text-gray-400">{user?.email}</div>
        </div>
      ),
    },
    { type: 'divider' as const },
    {
      key: 'go-settings',
      icon: <SettingOutlined />,
      label: t('nav.settings', 'Configurações'),
      onClick: () => setActiveSection('settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('header.logout', 'Sair da Conta'),
      onClick: logout,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ProjectDashboard onOpenCreateProject={() => setCreateProjectModalOpen(true)} />;
      case 'deployments':
        return <DeploymentsManager />;
      case 'explorer':
        return <BuildFileExplorer />;
      case 'git':
        return <GitVersionControl />;
      case 'tokens':
        return <TokensManager />;
      case 'iam':
        return <IamManager />;
      case 'quotas':
        return <QuotasManager />;
      case 'cors':
        return <CorsManager />;
      case 'public-config':
        return <PublicConfigManager />;
      case 'audit':
        return <AuditViewer />;
      case 'errors':
        return <ErrorsManager />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ProjectDashboard onOpenCreateProject={() => setCreateProjectModalOpen(true)} />;
    }
  };

  const getLanguageLabel = () => {
    switch (locale) {
      case 'en':
        return '🇺🇸 EN';
      case 'es':
        return '🇪🇸 ES';
      default:
        return '🇧🇷 PT';
    }
  };

  const sidebarContent = (isMobile: boolean = false) => {
    const isSidebarCollapsed = !isMobile && collapsed;
    const allExpanded = openKeys.length === ALL_GROUP_KEYS.length;

    return (
      <div
        className="flex flex-col h-screen overflow-hidden"
        style={{ backgroundColor: theme.bgSidebar }}
      >
        {/* Fixed Brand Header */}
        <div
          className={`h-16 shrink-0 flex items-center border-b ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-5 gap-3'
          }`}
          style={{ borderColor: isDark ? '#22292E' : '#2A3640' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md shrink-0 cursor-pointer"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 4px 12px ${theme.primary}40`,
            }}
            onClick={!isMobile ? toggleCollapsed : undefined}
            title={isSidebarCollapsed ? 'Expandir Menu' : 'AIOps OpsPages'}
          >
            ▲
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-white text-sm tracking-wide truncate">
                AIOps OpsPages
              </div>
              <div className="text-[10px] text-[#A0AEC0] truncate">
                Loft Static Hosting Platform
              </div>
            </div>
          )}
        </div>

        {/* Group Section Header with Expand/Collapse All */}
        {!isSidebarCollapsed && (
          <div className="px-5 pt-3 pb-1 shrink-0 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#718096]">
              Grupos do Menu
            </span>
            <button
              type="button"
              onClick={toggleAllGroups}
              className="text-[11px] font-medium text-[#A0AEC0] hover:text-white transition-colors bg-transparent border-0 p-0"
            >
              {allExpanded ? 'Recolher grupos' : 'Expandir tudo'}
            </button>
          </div>
        )}

        {/* Scrollable Grouped Navigation Menu */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden opspages-sidebar-scroll pb-3">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeSection]}
            openKeys={isSidebarCollapsed ? undefined : openKeys}
            onOpenChange={isSidebarCollapsed ? undefined : handleOpenChange}
            onClick={({ key }) => handleMenuClick(key)}
            items={menuItems}
            style={{ background: 'transparent', marginTop: 4, borderRight: 'none' }}
          />
        </div>

        {/* Fixed Collapse Footer Button */}
        {!isMobile && (
          <div
            className="p-3 shrink-0 border-t flex items-center justify-center"
            style={{ borderColor: isDark ? '#22292E' : '#2A3640' }}
          >
            <Tooltip
              title={collapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
              placement="right"
            >
              <Button
                type="text"
                onClick={toggleCollapsed}
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white"
                style={{ color: '#A0AEC0' }}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                {!collapsed && <span className="text-xs font-medium">Recolher Menu</span>}
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: theme.bgLayout }}>
      {/* Fixed Collapsible Sider with independent vertical scroll */}
      <Sider
        width={252}
        collapsedWidth={80}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme="dark"
        className="sticky top-0 h-screen shrink-0 transition-all duration-200"
        style={{
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 30,
          overflow: 'hidden',
          background: theme.bgSidebar,
          borderRight: `1px solid ${isDark ? '#22292E' : '#2A3640'}`,
        }}
      >
        {sidebarContent(false)}
      </Sider>

      {/* Main Layout Area */}
      <Layout className="w-full" style={{ backgroundColor: theme.bgLayout }}>
        {/* Top Header */}
        <Header
          className="px-3 sm:px-6 h-16 flex items-center justify-between border-b shadow-xs sticky top-0 z-20 transition-colors duration-200"
          style={{
            backgroundColor: theme.bgHeader,
            borderColor: theme.colorBorder,
          }}
        >
          {/* Left section: Project Selector & Live Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Dropdown menu={{ items: projectMenuItems }} trigger={['click']}>
              <Button className="flex items-center gap-1.5 sm:gap-2 h-9 font-semibold px-2 sm:px-3 max-w-[180px] sm:max-w-xs min-w-0">
                <CloudServerOutlined style={{ color: theme.primary, flexShrink: 0 }} />
                <span className="truncate min-w-0">
                  {activeProject ? activeProject.name : 'Selecionar Projeto...'}
                </span>
                <DownOutlined className="text-xs text-gray-400 ml-0.5 sm:ml-1 shrink-0" />
              </Button>
            </Dropdown>

            {activeProject && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                style={{
                  backgroundColor: `${theme.primary}15`,
                  borderColor: `${theme.primary}40`,
                  color: theme.primary,
                }}
              >
                {activeProject.is_locked ? <LockFilled /> : <CheckCircleFilled />}
                <span className="hidden md:inline">
                  {activeProject.is_locked
                    ? `Locked (${activeProject.locked_version || activeProject.active_version})`
                    : `/repos/${activeProject.slug} • ${activeProject.active_version || 'Ready'}`}
                </span>
                <span className="md:hidden">
                  {activeProject.active_version || 'Live'}
                </span>
              </div>
            )}

            {activeProject && activeProject.active_version && (
              <Button
                size="small"
                type="default"
                icon={<ExportOutlined />}
                href={`/pages/${activeProject.slug}/`}
                target="_blank"
                className="hidden md:inline-flex items-center gap-1 text-xs font-medium h-8"
              >
                Abrir Live
              </Button>
            )}
          </div>

          {/* Right section: Error Reporting Shortcut + Language Dropdown + Settings Shortcut + User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Tooltip title="Rota para informar erros e incidentes (/errors)">
              <Button
                size="small"
                danger={activeSection === 'errors'}
                type={activeSection === 'errors' ? 'primary' : 'default'}
                icon={<BugOutlined />}
                onClick={() => setActiveSection('errors')}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold h-8"
              >
                Informar Erro (/errors)
              </Button>
            </Tooltip>

            {/* Quick Language Switcher Dropdown */}
            <Dropdown menu={{ items: languageMenuItems }} trigger={['click']}>
              <Button
                size="small"
                className="font-semibold text-xs h-8 px-2 flex items-center gap-1"
              >
                <span>{getLanguageLabel()}</span>
                <DownOutlined className="text-[10px] text-gray-400" />
              </Button>
            </Dropdown>

            {/* Quick Theme/Settings Button */}
            <Tooltip title={t('nav.settings', 'Configurações & Temas')}>
              <Button
                type="text"
                icon={<BgColorsOutlined style={{ fontSize: 16, color: theme.primary }} />}
                onClick={() => setActiveSection('settings')}
                className="flex items-center justify-center h-8 w-8 rounded-full"
              />
            </Tooltip>

            {/* User Profile Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:opacity-80 transition-opacity p-1 sm:px-2 py-1 rounded-lg">
                <Avatar
                  style={{
                    backgroundColor: theme.primary,
                    verticalAlign: 'middle',
                    flexShrink: 0,
                    boxShadow: `0 2px 6px ${theme.primary}33`,
                  }}
                  size="default"
                >
                  {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <div className="flex flex-col text-left justify-center min-w-0">
                  <div
                    className="text-xs sm:text-sm font-semibold leading-normal truncate max-w-[140px] sm:max-w-[240px]"
                    style={{ color: theme.colorText }}
                    title={user?.full_name || user?.email}
                  >
                    {user?.full_name || user?.email}
                  </div>
                  <div
                    className="text-[11px] leading-tight truncate max-w-[140px] sm:max-w-[240px]"
                    style={{ color: theme.colorText, opacity: 0.65 }}
                  >
                    {user?.is_superuser
                      ? 'Superadmin'
                      : user?.groups?.[0]?.role_level || 'Membro'}
                  </div>
                </div>
                <DownOutlined
                  className="text-[10px] opacity-40 ml-0.5 hidden sm:inline-block"
                  style={{ color: theme.colorText }}
                />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Body */}
        <Content
          className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] overflow-x-hidden transition-colors duration-200"
          style={{ backgroundColor: theme.bgLayout }}
        >
          <div className="max-w-7xl mx-auto w-full">{renderContent()}</div>
        </Content>
      </Layout>

      <CreateProjectModal
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
      />
    </Layout>
  );
};
