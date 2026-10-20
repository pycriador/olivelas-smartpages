import React, { useEffect, useState } from 'react';
import { Button, Tag, Dropdown, Spin, Empty } from 'antd';
import {
  RocketOutlined,
  KeyOutlined,
  HistoryOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  CodeOutlined,
  DashboardOutlined,
  LockOutlined,
  DownOutlined,
  FolderOpenOutlined,
  BranchesOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { ShieldCheck, Layers, Terminal, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTheme } from '../../theme/CopanThemeProvider';
import { useI18nStore } from '../../i18n/useTranslation';
import { Locale } from '../../i18n/translations';
import { api } from '../../services/api';

interface PublicOverviewData {
  platform: string;
  version: string;
  stats: {
    total_projects: number;
    public_projects: number;
    total_deployments: number;
    repos_root: string;
  };
  featured_project: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    active_version?: string;
    is_locked: boolean;
    locked_version?: string;
    auto_approval: boolean;
    spa_mode: boolean;
    github_subpath?: string;
    live_url: string;
    deployments: Array<{
      id: number;
      version: string;
      status: string;
      git_commit_sha?: string;
      git_tag?: string;
      file_count: number;
      uncompressed_size_bytes: number;
      release_notes?: string;
      preview_url: string;
    }>;
    git_status: {
      initialized: boolean;
      branch?: string;
      latest_sha?: string;
      tags: Array<{ tag: string; sha: string; date?: string; subject?: string }>;
      commits: Array<{ sha: string; short_sha?: string; author?: string; date?: string; message: string }>;
    };
  } | null;
  public_projects: Array<{
    id: number;
    name: string;
    slug: string;
    active_version?: string;
    is_locked: boolean;
    live_url: string;
  }>;
}

export const LandingPage: React.FC = () => {
  const { setShowLogin } = useAuthStore();
  const { theme } = useTheme();
  const { locale, setLocale } = useI18nStore();

  const [activeTab, setActiveTab] = useState<'releases' | 'git' | 'tokens'>('releases');
  const [overview, setOverview] = useState<PublicOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/overview');
      setOverview(res.data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const featured = overview?.featured_project;

  const languageMenuItems = [
    {
      key: 'pt-BR',
      label: '🇧🇷 Português',
      onClick: () => setLocale('pt-BR' as Locale),
    },
    {
      key: 'en',
      label: '🇺🇸 English',
      onClick: () => setLocale('en' as Locale),
    },
    {
      key: 'es',
      label: '🇪🇸 Español',
      onClick: () => setLocale('es' as Locale),
    },
  ];

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

  return (
    <div className="min-h-screen bg-[#0E1216] text-[#F7FAFC] flex flex-col selection:bg-[#F56738] selection:text-white">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#0E1216]/90 backdrop-blur-md border-b border-[#22292E] px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white text-base sm:text-lg shadow-lg"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 8px 24px ${theme.primary}40`,
            }}
          >
            ▲
          </div>
          <div>
            <div className="font-bold text-white text-base sm:text-lg tracking-wide leading-none flex items-center gap-1.5 sm:gap-2">
              AIOps OpsPages
              <Tag
                className="border-0 font-mono text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 m-0"
                style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
              >
                v{overview?.version || '1.0'}
              </Tag>
            </div>
            <div className="text-[11px] sm:text-xs text-[#718096] mt-0.5">
              Loft Static Hosting Platform &bull; GitHub Pages / Vercel-like
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#A0AEC0]">
          <a href="#recursos" className="hover:text-white transition-colors">
            Recursos
          </a>
          <a href="#arquitetura" className="hover:text-white transition-colors">
            Arquitetura
          </a>
          <a href="#governanca" className="hover:text-white transition-colors">
            Governança &amp; HBAC
          </a>
          <a href="#integracao" className="hover:text-white transition-colors">
            Integração CI/CD
          </a>
          <a
            href="/errors"
            className="transition-colors flex items-center gap-1 hover:text-white text-amber-400"
          >
            Informar Erros (/errors)
          </a>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors flex items-center gap-1 hover:text-white"
            style={{ color: theme.primary }}
          >
            <CodeOutlined /> API Docs
          </a>
        </nav>

        {/* Actions: Language selector + Login button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Dropdown menu={{ items: languageMenuItems }} trigger={['click']}>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-[#A0AEC0] hover:text-white transition-colors bg-[#141A1E] hover:bg-[#1A2227] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#22292E] shadow-xs cursor-pointer"
            >
              <GlobalOutlined />
              <span>{getLanguageLabel()}</span>
              <DownOutlined className="text-[10px]" />
            </button>
          </Dropdown>

          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => setShowLogin(true)}
            style={{
              background: theme.primary,
              borderColor: theme.primary,
              height: 38,
              padding: '0 16px',
              fontWeight: 600,
              borderRadius: 8,
            }}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Acessar Console</span>
            <span className="sm:hidden">Entrar</span>
          </Button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Glow Effects in Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[300px] bg-[#F56738]/15 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />

        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A2024] border border-[#2D3748] text-xs text-[#E2E8F0] mb-6 sm:mb-8 shadow-xs max-w-full">
          <Sparkles className="w-3.5 h-3.5 text-[#F56738] shrink-0" />
          <span className="truncate">Hospedagem Estática GitHub Pages-like da Loft</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#20A483] shrink-0" />
          <span className="text-[#20A483] font-medium hidden sm:inline">
            Versionamento Git em /repos
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl leading-[1.15] mb-5 sm:mb-6">
          O GitHub Pages das Builds Estáticas da{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#F56738] via-[#FF8A65] to-[#F56738]">
            Loft
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-[#A0AEC0] max-w-3xl mb-8 sm:mb-10 leading-relaxed font-normal">
          Publique builds estáticas em repositórios isolados dentro de{' '}
          <code className="text-[#E2E8F0] bg-[#1A2024] px-1.5 py-0.5 rounded-sm border border-[#2D3748]">
            /repos/&#123;slug&#125;
          </code>{' '}
          em segundos. Tenha controle de versionamento via Git e interface web, trava de versão (
          <code className="text-[#E2E8F0] bg-[#1A2024] px-1.5 py-0.5 rounded-sm border border-[#2D3748]">
            version lock
          </code>
          ), aprovação automática ou manual, tokens de deploy{' '}
          <code className="text-[#E2E8F0] bg-[#1A2024] px-1.5 py-0.5 rounded-sm border border-[#2D3748]">
            opsp_deploy_
          </code>{' '}
          e governança hierárquica (HBAC).
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full sm:w-auto">
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => setShowLogin(true)}
            style={{
              background: theme.primary,
              borderColor: theme.primary,
              height: 48,
              padding: '0 28px',
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              boxShadow: `0 10px 25px -5px ${theme.primary}66`,
            }}
            className="w-full sm:w-auto"
          >
            Acessar Plataforma OpsPages
          </Button>

          <Button
            size="large"
            href="/docs"
            target="_blank"
            style={{
              height: 48,
              padding: '0 24px',
              fontSize: 15,
              background: '#1A2024',
              borderColor: '#2D3748',
              color: '#FFFFFF',
              borderRadius: 10,
            }}
            className="w-full sm:w-auto"
          >
            Ver Swagger API Docs
          </Button>
        </div>

        {/* Metrics Strip */}
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6 rounded-2xl bg-[#141A1E]/80 border border-[#22292E] backdrop-blur-xs shadow-xl">
          <div className="text-left px-2 sm:px-4 border-r border-[#22292E]/60">
            <div className="text-xl sm:text-3xl font-extrabold text-[#F56738] font-mono truncate">
              /repos/&#123;slug&#125;
            </div>
            <div className="text-[11px] sm:text-xs text-[#718096] uppercase tracking-wider font-semibold mt-1">
              {overview ? `${overview.stats.total_projects} Projetos Ativos` : 'Multi-Tenant'}
            </div>
            <div className="text-[11px] sm:text-xs text-[#A0AEC0] mt-0.5 hidden sm:block">
              Repositórios Git dedicados
            </div>
          </div>

          <div className="text-left px-2 sm:px-4 md:border-r border-[#22292E]/60">
            <div className="text-xl sm:text-3xl font-extrabold text-white font-mono">
              {overview ? `${overview.stats.total_deployments} Builds` : 'Zero-Downtime'}
            </div>
            <div className="text-[11px] sm:text-xs text-[#718096] uppercase tracking-wider font-semibold mt-1">
              Releases &amp; Tags
            </div>
            <div className="text-[11px] sm:text-xs text-[#A0AEC0] mt-0.5 hidden sm:block">
              Snapshots imutáveis com SHA
            </div>
          </div>

          <div className="text-left px-2 sm:px-4 border-r border-[#22292E]/60">
            <div className="text-xl sm:text-3xl font-extrabold text-[#20A483] font-mono">
              3 Níveis
            </div>
            <div className="text-[11px] sm:text-xs text-[#718096] uppercase tracking-wider font-semibold mt-1">
              HBAC
            </div>
            <div className="text-[11px] sm:text-xs text-[#A0AEC0] mt-0.5 hidden sm:block">
              Admin, Editor, Visualizador
            </div>
          </div>

          <div className="text-left px-2 sm:px-4">
            <div className="text-xl sm:text-3xl font-extrabold text-blue-400 font-mono">
              100%
            </div>
            <div className="text-[11px] sm:text-xs text-[#718096] uppercase tracking-wider font-semibold mt-1">
              Auditoria
            </div>
            <div className="text-[11px] sm:text-xs text-[#A0AEC0] mt-0.5 hidden sm:block">
              Diff JSON &amp; Git Commit Log
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Pillars / Feature Grid */}
      <section id="recursos" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <Tag
            color="orange"
            className="border-0 bg-[#F56738]/20 text-[#F56738] font-mono text-xs uppercase px-2 py-0.5"
          >
            Recursos da Plataforma
          </Tag>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            Tudo o que sua squad precisa para publicar e versionar builds
          </h2>
          <p className="text-base text-[#A0AEC0] max-w-2xl mx-auto mt-3">
            Construído seguindo o padrão corporativo AIOps da Loft (FastAPI, SQLAlchemy 2.0, Git Engine, Vite e Ant Design Copan).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E] hover:border-[#F56738]/50 transition-all hover:shadow-lg hover:shadow-[#F56738]/5 group">
            <div className="w-12 h-12 rounded-xl bg-[#F56738]/10 text-[#F56738] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Versionamento Git em /repos/&#123;slug&#125;
            </h3>
            <p className="text-sm text-[#A0AEC0] leading-relaxed">
              Cada projeto possui seu repositório Git dedicado em <code>/repos/&#123;slug&#125;</code>. Cada upload de build cria automaticamente um commit, tag semântica e snapshot imutável.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E] hover:border-[#F56738]/50 transition-all hover:shadow-lg hover:shadow-[#F56738]/5 group">
            <div className="w-12 h-12 rounded-xl bg-[#20A483]/10 text-[#20A483] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <LockOutlined style={{ fontSize: 22 }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Trava de Versão &amp; Auto-Aprovação
            </h3>
            <p className="text-sm text-[#A0AEC0] leading-relaxed">
              Trave uma versão estável em produção (<code>version lock</code>) para evitar sobrescritas acidentais ou configure aprovação automática/manual antes de promover novas builds.
            </p>
          </div>

          {/* Card 3 */}
          <div
            id="governanca"
            className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E] hover:border-[#F56738]/50 transition-all hover:shadow-lg hover:shadow-[#F56738]/5 group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">HBAC &amp; Gestão de Grupos</h3>
            <p className="text-sm text-[#A0AEC0] leading-relaxed">
              Controle de acesso hierárquico com 3 perfis: <strong>Admin</strong>, <strong>Editor</strong> e <strong>Visualizador</strong>, além de script CLI de backend para gestão de usuários e permissões.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E] hover:border-[#F56738]/50 transition-all hover:shadow-lg hover:shadow-[#F56738]/5 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <FolderOpenOutlined style={{ fontSize: 22 }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Explorador de Arquivos da Build
            </h3>
            <p className="text-sm text-[#A0AEC0] leading-relaxed">
              Inspecione os artefatos estáticos extraídos (HTML, CSS, JS, JSON, SVG, manifestos) de qualquer release diretamente pelo navegador com visualizador de código integrado.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E] hover:border-[#F56738]/50 transition-all hover:shadow-lg hover:shadow-[#F56738]/5 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <DashboardOutlined style={{ fontSize: 22 }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Quotas de Armazenamento &amp; Tokens CI/CD
            </h3>
            <p className="text-sm text-[#A0AEC0] leading-relaxed">
              Tokens <code>opsp_deploy_</code>, <code>opsp_admin_</code> e <code>opsp_read_</code> com hash SHA-256 para automação via GitHub Actions, além de limites de armazenamento e retenção.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E] hover:border-[#F56738]/50 transition-all hover:shadow-lg hover:shadow-[#F56738]/5 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <HistoryOutlined style={{ fontSize: 22 }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Auditoria Completa &amp; CORS</h3>
            <p className="text-sm text-[#A0AEC0] leading-relaxed">
              Trilha de auditoria imutável com diff JSON antes/depois para cada deploy, rollback, lock ou alteração de permissão, além de gestão de origens CORS autorizadas.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive Interface Preview (Real Backend Telemetry) */}
      <section className="py-20 px-6 lg:px-12 bg-[#121619] border-y border-[#22292E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Tag
              color="green"
              className="border-0 bg-[#20A483]/20 text-[#20A483] font-mono text-xs uppercase px-2 py-0.5"
            >
              Telemetria em Tempo Real da API
            </Tag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Interface Completa para Desenvolvedores &amp; DevOps
            </h2>
            <p className="text-base text-[#A0AEC0] max-w-2xl mx-auto mt-2">
              Dados reais consultados ao vivo de{' '}
              <code>GET /api/v1/public/overview</code> mostrando os repositórios hospedados em{' '}
              <code>/repos</code>.
            </p>
          </div>

          <div className="bg-[#141A1E] rounded-2xl border border-[#22292E] shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-[#22292E] pb-4 mb-6 gap-3 overflow-x-auto">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('releases')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'releases'
                      ? 'bg-[#F56738] text-white shadow-md shadow-[#F56738]/30'
                      : 'text-[#A0AEC0] hover:text-white bg-[#0E1216]'
                  }`}
                >
                  <RocketOutlined /> Releases &amp; Builds Ativas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('git')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'git'
                      ? 'bg-[#F56738] text-white shadow-md shadow-[#F56738]/30'
                      : 'text-[#A0AEC0] hover:text-white bg-[#0E1216]'
                  }`}
                >
                  <Terminal className="w-4 h-4" /> Git /repos Commit Log
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tokens')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'tokens'
                      ? 'bg-[#F56738] text-white shadow-md shadow-[#F56738]/30'
                      : 'text-[#A0AEC0] hover:text-white bg-[#0E1216]'
                  }`}
                >
                  <KeyOutlined /> Chaves de Deploy &amp; Páginas Públicas
                </button>
              </div>

              <Button
                size="small"
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchOverview}
                style={{ background: '#0E1216', borderColor: '#22292E', color: '#A0AEC0' }}
              >
                Atualizar
              </Button>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <Spin />
              </div>
            ) : !featured ? (
              <Empty description="Nenhum projeto público encontrado" />
            ) : (
              <>
                {activeTab === 'releases' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex flex-wrap items-center justify-between bg-[#0E1216] p-3 rounded-lg border border-[#22292E] gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[#F56738] font-bold">
                          projeto: {featured.name}
                        </span>
                        <Tag color="blue">repo: /repos/{featured.slug}</Tag>
                        <span className="text-[#718096]">
                          {featured.deployments.length} releases registradas
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <a
                          href={`/api/v1/public/projects/${featured.slug}/download-build?version=${featured.active_version || '1.0.0'}`}
                          className="text-[#F56738] hover:underline font-semibold flex items-center gap-1"
                        >
                          <DownloadOutlined /> Baixar HTML Estático (.zip)
                        </a>
                        <a
                          href={`/api/v1/public/projects/${featured.slug}/download-source?version=${featured.active_version || '1.0.0'}`}
                          className="text-sky-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <CodeOutlined /> Baixar Fonte TS (.zip)
                        </a>
                        <a
                          href={featured.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline font-semibold"
                        >
                          Abrir Build Live ({featured.live_url}) ↗
                        </a>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-[#22292E]">
                        <thead className="bg-[#0E1216] text-[#A0AEC0] border-b border-[#22292E]">
                          <tr>
                            <th className="p-3 whitespace-nowrap">versão</th>
                            <th className="p-3 whitespace-nowrap">status</th>
                            <th className="p-3 whitespace-nowrap">git_commit_sha</th>
                            <th className="p-3 whitespace-nowrap">arquivos</th>
                            <th className="p-3 whitespace-nowrap">release_notes</th>
                            <th className="p-3 whitespace-nowrap">downloads</th>
                            <th className="p-3 whitespace-nowrap">preview_url</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#22292E] text-[#E2E8F0]">
                          {featured.deployments.map((dep) => {
                            const isLive = dep.version === featured.active_version;
                            return (
                              <tr key={dep.id}>
                                <td className="p-3 whitespace-nowrap text-[#F56738] font-bold">
                                  {dep.version}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  {isLive ? (
                                    <Tag color="green">LIVE PRODUCTION</Tag>
                                  ) : (
                                    <Tag color="blue">{dep.status}</Tag>
                                  )}
                                  {featured.is_locked &&
                                    featured.locked_version === dep.version && (
                                      <Tag color="orange">LOCKED</Tag>
                                    )}
                                </td>
                                <td className="p-3 whitespace-nowrap text-gray-400">
                                  {dep.git_commit_sha ? dep.git_commit_sha.slice(0, 8) : '-'}
                                </td>
                                <td className="p-3 whitespace-nowrap text-emerald-400">
                                  {dep.file_count} arquivos
                                </td>
                                <td className="p-3 whitespace-nowrap text-gray-300">
                                  {dep.release_notes || 'Release estática'}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <a
                                      href={`/api/v1/public/projects/${featured.slug}/download-build?version=${dep.version}`}
                                      className="text-[#F56738] hover:underline flex items-center gap-1"
                                    >
                                      <DownloadOutlined /> HTML (.zip)
                                    </a>
                                    <a
                                      href={`/api/v1/public/projects/${featured.slug}/download-source?version=${dep.version}`}
                                      className="text-sky-400 hover:underline flex items-center gap-1"
                                    >
                                      <CodeOutlined /> Fonte TS (.zip)
                                    </a>
                                  </div>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <a
                                    href={isLive ? featured.live_url : dep.preview_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#F56738] hover:underline"
                                  >
                                    {isLive ? featured.live_url : dep.preview_url} ↗
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'git' && (
                  <div className="bg-[#0E1216] p-4 rounded-xl border border-[#22292E] font-mono text-xs space-y-2">
                    <div className="text-gray-400 mb-2">
                      // Histórico real do repositório Git em /repos/{featured.slug}/git_repo
                    </div>
                    <div className="text-[#F56738] font-semibold flex items-center gap-2">
                      <BranchesOutlined />
                      <span>
                        $ git -C /repos/{featured.slug}/git_repo log --oneline --decorate
                      </span>
                    </div>
                    {(featured.git_status?.commits || []).map((c) => (
                      <div key={c.sha} className="text-white pl-4 truncate">
                        <span className="text-[#38BDF8]">
                          {(c.short_sha || c.sha).slice(0, 7)}
                        </span>{' '}
                        <span className="text-[#E2E8F0]">{c.message}</span>{' '}
                        {c.author && <span className="text-gray-500">({c.author})</span>}
                      </div>
                    ))}
                    <div className="mt-4 pt-3 border-t border-[#22292E] flex justify-between items-center text-[#20A483]">
                      <span>
                        ✓ Branch ativa: {featured.git_status?.branch || 'main'}
                      </span>
                      <span>
                        {(featured.git_status?.tags || []).length} tag(s) Git registradas
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'tokens' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-[#0E1216] rounded-lg border border-[#22292E] flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <div className="text-white font-semibold flex items-center gap-2">
                          <Tag color="orange">DEPLOY KEY</Tag> Chave de Automação para GitHub Actions / CI
                        </div>
                        <div className="text-gray-500 mt-1 font-mono text-xs">
                          opsp_deploy_&lt;hash_sha256_do_projeto&gt;
                        </div>
                      </div>
                      <Tag color="green">Escopo: upload &amp; release</Tag>
                    </div>

                    <div className="p-3 bg-[#0E1216] rounded-lg border border-[#22292E] flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <div className="text-white font-semibold flex items-center gap-2">
                          <Tag color="blue">LIVE PAGES</Tag> Diretório Público de Projetos Ativos
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(overview?.public_projects || []).map((p) => (
                            <a
                              key={p.id}
                              href={p.live_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-sm bg-[#141A1E] border border-[#22292E] hover:border-[#F56738] text-[#F56738]"
                            >
                              {p.name} ({p.live_url}) ↗
                            </a>
                          ))}
                        </div>
                      </div>
                      <Tag color="cyan">Servido por FastAPI Static Engine</Tag>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* 5. Code Integration Examples */}
      <section id="integracao" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <Tag
            color="blue"
            className="border-0 bg-blue-500/20 text-blue-400 font-mono text-xs uppercase px-2 py-0.5"
          >
            Exemplos de Integração
          </Tag>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            Automatize o Deploy da sua Build em Poucas Linhas
          </h2>
          <p className="text-base text-[#A0AEC0] max-w-2xl mx-auto mt-2">
            Publique novas versões via cURL / GitHub Actions ou gerencie permissões pelo CLI do backend.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Box 1: CI/CD Upload */}
          <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-white flex items-center gap-2">
                <CodeOutlined style={{ color: theme.primary }} /> GitHub Actions / CLI Upload (cURL)
              </span>
              <Tag color="orange">X-API-Key: opsp_deploy_*</Tag>
            </div>
            <pre className="bg-[#0E1216] p-4 rounded-xl text-xs font-mono text-[#E2E8F0] overflow-x-auto leading-relaxed border border-[#22292E]">
{`# Empacote sua build estática (Vite / React / Next export)
zip -r dist.zip dist/

# Envie para o OpsPages versionando automaticamente em /repos
curl -X POST "${window.location.origin}/api/v1/projects/1/deployments/upload" \\
  -H "X-API-Key: $OPSPAGES_DEPLOY_TOKEN" \\
  -F "version=v1.4.0" \\
  -F "release_notes=Deploy automático via GitHub Actions" \\
  -F "file=@dist.zip"`}
            </pre>
          </div>

          {/* Box 2: Backend CLI Management */}
          <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-white flex items-center gap-2">
                <GlobalOutlined style={{ color: '#20A483' }} /> Python Backend CLI (manage_users.py)
              </span>
              <Tag color="cyan">Admin / Editor / Viewer</Tag>
            </div>
            <pre className="bg-[#0E1216] p-4 rounded-xl text-xs font-mono text-[#E2E8F0] overflow-x-auto leading-relaxed border border-[#22292E]">
{`# Listar usuários e papéis HBAC cadastrados
python -m app.cli.manage_users list

# Alterar permissão de um usuário (admin | editor | viewer)
python -m app.cli.manage_users set-role \\
  --email dev@loft.com.br \\
  --role editor`}
            </pre>
          </div>
        </div>
      </section>

      {/* 6. Architecture & Security */}
      <section id="arquitetura" className="py-20 px-6 lg:px-12 bg-[#121619] border-t border-[#22292E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Tag
              color="purple"
              className="border-0 bg-purple-500/20 text-purple-400 font-mono text-xs uppercase px-2 py-0.5"
            >
              Topologia do Sistema
            </Tag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Arquitetura de Isolamento &amp; Versionamento Loft
            </h2>
            <p className="text-base text-[#A0AEC0] max-w-2xl mx-auto mt-2">
              Segurança em camadas, validação contra Zip-Slip, tokens com hash SHA-256 e compatibilidade com SQLite, PostgreSQL e MariaDB.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E]">
              <div className="text-[#F56738] font-bold text-lg mb-2">
                1. Pipelines CI/CD &amp; Console Web
              </div>
              <p className="text-xs text-[#A0AEC0] leading-relaxed">
                Squads da Loft enviam artefatos estáticos (React, Vite, Vue, documentações) via upload drag-and-drop ou pipelines automatizados usando tokens de escopo restrito.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E]">
              <div className="text-[#20A483] font-bold text-lg mb-2">
                2. AIOps OpsPages Control Plane
              </div>
              <p className="text-xs text-[#A0AEC0] leading-relaxed">
                Autentica via JWT e API Keys SHA-256, valida cotas, verifica regras de Lock de versão e Auto-Approval, aplica HBAC e registra tudo na auditoria forense.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#141A1E] border border-[#22292E]">
              <div className="text-blue-400 font-bold text-lg mb-2">
                3. Storage Git /repos &amp; Live Router
              </div>
              <p className="text-xs text-[#A0AEC0] leading-relaxed">
                Armazena cada versão em <code>/repos/&#123;slug&#125;/releases/&#123;version&#125;</code>, sincroniza o repositório Git local/remoto e serve com suporte nativo a SPA fallback em <code>/pages/&#123;slug&#125;/</code>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="py-20 px-6 lg:px-12 text-center max-w-4xl mx-auto">
        <div className="p-10 rounded-3xl bg-linear-to-b from-[#1C2329] to-[#121619] border border-[#2D3748] shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Pronto para publicar e versionar as builds do seu projeto?
          </h2>
          <p className="text-[#A0AEC0] text-base mb-8 max-w-xl mx-auto">
            Acesse o AIOps OpsPages agora mesmo e gerencie seus repositórios estáticos em /repos com governança completa.
          </p>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => setShowLogin(true)}
            style={{
              background: theme.primary,
              borderColor: theme.primary,
              height: 52,
              padding: '0 36px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 10,
              boxShadow: `0 10px 25px -5px ${theme.primary}66`,
            }}
          >
            Entrar no OpsPages
          </Button>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto py-8 px-6 lg:px-12 border-t border-[#22292E] text-xs text-[#718096] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-[#F56738] flex items-center justify-center font-bold text-white text-[10px]">
            ▲
          </div>
          <span>
            &copy; {new Date().getFullYear()} Loft &bull; AIOps OpsPages Platform. Todos os direitos reservados.
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Documentação OpenAPI
          </a>
          <a
            href="/health"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Status da API
          </a>
        </div>
      </footer>
    </div>
  );
};
