import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Tag,
  Button,
  Switch,
  Tabs,
  Typography,
  Tooltip,
  Alert,
  Row,
  Col,
  Divider,
  Spin,
  message,
} from 'antd';
import {
  GlobalOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  CloudUploadOutlined,
  KeyOutlined,
  FolderOpenOutlined,
  CodeOutlined,
  SafetyCertificateOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ApiOutlined,
  PlusOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../../stores/useProjectStore';
import { useTheme } from '../../theme/CopanThemeProvider';
import { api, extractErrorMessage } from '../../services/api';

const { Title, Text } = Typography;

interface ProjectDashboardProps {
  onOpenCreateProject?: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onOpenCreateProject }) => {
  const {
    activeProject,
    deployments,
    fetchProjects,
    setActiveSection,
    setSelectedVersionForExplorer,
  } = useProjectStore();
  const { theme, isDark } = useTheme();

  const [credentialsData, setCredentialsData] = useState<any>(null);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [revealingToken, setRevealingToken] = useState(false);
  const [showDeployToken, setShowDeployToken] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [togglingAutoApproval, setTogglingAutoApproval] = useState(false);

  const loadCredentials = useCallback(async (projectId: number) => {
    setLoadingCreds(true);
    try {
      const res = await api.get(`/projects/${projectId}/credentials`);
      setCredentialsData(res.data);
    } catch {
      setCredentialsData(null);
    } finally {
      setLoadingCreds(false);
    }
  }, []);

  useEffect(() => {
    setShowDeployToken(false);
    if (activeProject?.id) {
      loadCredentials(activeProject.id);
    } else {
      setCredentialsData(null);
    }
  }, [activeProject?.id, loadCredentials]);

  if (!activeProject) {
    return (
      <Card
        variant="borderless"
        className="shadow-xs border py-12 text-center"
        style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
      >
        <div className="max-w-md mx-auto space-y-4">
          <GlobalOutlined style={{ fontSize: 42, color: theme.primary }} />
          <Title level={4} style={{ margin: 0, color: theme.colorText }}>
            Nenhum projeto selecionado
          </Title>
          <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }} className="block text-sm">
            Selecione um projeto no menu superior ou crie um novo projeto de hospedagem estática versionada em{' '}
            <code className="font-mono">/repos</code>.
          </Text>
          {onOpenCreateProject && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreateProject}
              style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
            >
              Novo Projeto
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const copyText = (text: string, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    message.success(label ? `${label} copiado para a área de transferência!` : 'Copiado!');
  };

  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const nextLock = !activeProject.is_locked;
      await api.post(`/projects/${activeProject.id}/lock`, {
        is_locked: nextLock,
        version: activeProject.active_version,
        reason: nextLock
          ? `Versão ${activeProject.active_version} travada via Dashboard`
          : 'Destravado via Dashboard',
      });
      message.success(
        nextLock
          ? `Produção travada na versão ${activeProject.active_version}! Novas builds ficarão em modo Preview.`
          : 'Trava de versão removida!'
      );
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setTogglingLock(false);
    }
  };

  const handleToggleAutoApproval = async (checked: boolean) => {
    setTogglingAutoApproval(true);
    try {
      await api.put(`/projects/${activeProject.id}`, {
        auto_approval: checked,
      });
      message.success(
        checked
          ? 'Aprovação Automática ativada para novas builds!'
          : 'Modo de Aprovação Manual ativado! Novas builds aguardarão revisão.'
      );
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setTogglingAutoApproval(false);
    }
  };

  const handleUnmaskCredentials = async () => {
    if (showDeployToken && credentialsData?.deploy_token && !String(credentialsData.deploy_token).includes('•')) {
      setShowDeployToken(false);
      return;
    }
    setRevealingToken(true);
    try {
      const res = await api.post(`/projects/${activeProject.id}/credentials/reveal`, {});
      setCredentialsData(res.data);
      setShowDeployToken(true);
      message.success('Token CI/CD real revelado e registrado na auditoria forense.');
    } catch (err) {
      message.error(extractErrorMessage(err, 'Falha ao revelar token CI/CD.'));
    } finally {
      setRevealingToken(false);
    }
  };

  const boxStyle: React.CSSProperties = {
    backgroundColor: isDark ? theme.bgSidebar : '#F8FAFC',
    borderColor: theme.colorBorder,
    color: theme.colorText,
  };

  const labelStyle: React.CSSProperties = {
    color: isDark ? '#94A3B8' : '#64748B',
  };

  const pendingCount = deployments.filter((d) => d.status === 'pending_approval').length;
  const fullLiveUrl = `${window.location.origin}${activeProject.live_url}`;
  const uploadEndpoint = `${window.location.origin}/api/v1/projects/${activeProject.id}/deployments/upload`;
  const deployToken = credentialsData?.deploy_token || 'opspages_live_••••••••••••••••••••••••';
  const isTokenRevealed = Boolean(showDeployToken && deployToken && !String(deployToken).includes('•'));

  const envSnippet = `# ============================================================================
# Olivelas OpsPages — Credenciais CI/CD do Projeto: ${activeProject.name}
# Diretório Git /repos: /repos/${activeProject.slug}
# ============================================================================

VITE_OPSPAGES_LIVE_URL="${fullLiveUrl}"
OPSPAGES_API_URL="${window.location.origin}/api/v1"
OPSPAGES_PROJECT_ID="${activeProject.id}"
OPSPAGES_PROJECT_SLUG="${activeProject.slug}"
OPSPAGES_DEPLOY_TOKEN="${deployToken}"`;

  const curlSnippet =
    credentialsData?.curl_upload_example ||
    `# Empacotar e publicar nova build estática em /repos/${activeProject.slug}
zip -r build.zip dist/
curl -X POST "${uploadEndpoint}" \\
  -H "X-API-Key: ${deployToken}" \\
  -F "version=v1.0.1" \\
  -F "release_notes=Release automatizada via CI/CD" \\
  -F "file=@build.zip"`;

  const ghaSnippet =
    credentialsData?.github_actions_workflow ||
    `name: Deploy Static Build to Olivelas OpsPages
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Static Frontend
        run: |
          npm ci
          npm run build
          cd dist && zip -r ../build.zip .
      - name: Publish to OpsPages (/repos/${activeProject.slug})
        run: |
          curl -f -X POST "${uploadEndpoint}" \\
            -H "X-API-Key: \${{ secrets.OPSPAGES_DEPLOY_TOKEN }}" \\
            -F "version=v1.0.\${{ github.run_number }}" \\
            -F "git_commit_sha=\${{ github.sha }}" \\
            -F "release_notes=CI/CD build #\${{ github.run_number }}" \\
            -F "file=@build.zip"`;

  return (
    <div className="opspages-page">
      {/* Alerts if Locked or Pending Approval */}
      {activeProject.is_locked && (
        <Alert
          type="warning"
          showIcon
          icon={<LockOutlined />}
          message={
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span>
                <strong>Versão Travada em Produção ({activeProject.locked_version}):</strong> Novas builds
                enviadas via upload ou CI/CD serão armazenadas em <code>/repos/{activeProject.slug}</code> como{' '}
                <Tag color="processing">READY</Tag> sem alterar a URL principal.
              </span>
              <Button size="small" icon={<UnlockOutlined />} onClick={handleToggleLock} loading={togglingLock}>
                Destravar Versão
              </Button>
            </div>
          }
        />
      )}

      {pendingCount > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          message={
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span>
                Existem <strong>{pendingCount} build(s)</strong> aguardando aprovação manual antes de ir para
                produção.
              </span>
              <Button
                size="small"
                type="primary"
                onClick={() => setActiveSection('deployments')}
                style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
              >
                Revisar &amp; Aprovar Builds
              </Button>
            </div>
          }
        />
      )}

      {/* Top Banner (Exact aiops-opsbase style) */}
      <div
        className="p-4 sm:p-6 rounded-2xl border shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-colors"
        style={{
          backgroundColor: theme.bgContainer,
          borderColor: theme.colorBorder,
        }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Title
              level={3}
              style={{ margin: 0, fontWeight: 700, color: theme.colorText }}
              className="text-xl sm:text-2xl"
            >
              {activeProject.name}
            </Title>
            <Tag
              style={{
                backgroundColor: `${theme.primary}18`,
                color: theme.primary,
                borderColor: `${theme.primary}40`,
              }}
              className="font-mono text-xs font-semibold px-2.5 py-0.5 m-0"
            >
              /repos/{activeProject.slug}
            </Tag>
            <Tag color="orange" className="font-mono text-xs m-0">
              {activeProject.framework}
            </Tag>
            {activeProject.active_version && (
              <Tag color="success" icon={<CheckCircleOutlined />} className="font-mono font-semibold m-0">
                LIVE: {activeProject.active_version}
              </Tag>
            )}
            {activeProject.is_locked ? (
              <Tag color="warning" icon={<LockOutlined />} className="font-semibold m-0">
                LOCKED ({activeProject.locked_version})
              </Tag>
            ) : (
              <Tag color="default" icon={<UnlockOutlined />} className="m-0">
                UNLOCKED
              </Tag>
            )}
            <Tag color="blue" icon={<SafetyCertificateOutlined />} className="m-0 uppercase text-xs font-semibold">
              Role: {activeProject.effective_role || 'admin'}
            </Tag>
          </div>
          <Text style={labelStyle} className="mt-1.5 block text-xs sm:text-sm">
            {activeProject.description ||
              'Hospedagem estática corporativa com versionamento Git em /repos, trava de versão (Version Lock), aprovação de deploy e auditoria forense.'}
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Tooltip title="Baixar pacote HTML/CSS/JS/IMG pronto para rodar em qualquer servidor HTTP local">
            <Button
              icon={<DownloadOutlined />}
              href={`/api/v1/public/projects/${activeProject.slug}/download-build?version=${encodeURIComponent(activeProject.active_version || '1.0.0')}`}
              target="_blank"
              className="flex-1 sm:flex-initial font-medium"
            >
              Baixar HTML Estático (.zip)
            </Button>
          </Tooltip>
          <Tooltip title="Baixar código-fonte completo em TypeScript (src/, public/, tsconfig.json, package.json)">
            <Button
              icon={<CodeOutlined />}
              href={`/api/v1/public/projects/${activeProject.slug}/download-source?version=${encodeURIComponent(activeProject.active_version || '1.0.0')}`}
              target="_blank"
              className="flex-1 sm:flex-initial font-medium"
            >
              Baixar Fonte TS (.zip)
            </Button>
          </Tooltip>
          <Button
            icon={<CloudUploadOutlined />}
            onClick={() => setActiveSection('deployments')}
            className="flex-1 sm:flex-initial font-medium"
          >
            Subir Nova Build
          </Button>
          <Button
            icon={activeProject.is_locked ? <UnlockOutlined /> : <LockOutlined />}
            danger={activeProject.is_locked}
            loading={togglingLock}
            onClick={handleToggleLock}
            className="flex-1 sm:flex-initial font-medium"
          >
            {activeProject.is_locked ? 'Destravar Versão' : 'Travar Versão'}
          </Button>
          <Button
            type="primary"
            icon={<GlobalOutlined />}
            onClick={() => window.open(activeProject.live_url, '_blank')}
            style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
            className="flex-1 sm:flex-initial font-medium"
          >
            Abrir Página Live
          </Button>
        </div>
      </div>

      {/* Metrics Row (Exact aiops-opsbase 4-column layout) */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-xs border h-full"
            style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
          >
            <Text style={labelStyle} className="text-xs uppercase font-semibold">
              Versão Ativa em Produção
            </Text>
            <Title level={2} style={{ margin: '8px 0 0 0', color: theme.primary }} className="font-mono">
              {activeProject.active_version || 'Nenhuma'}
            </Title>
            <Text style={{ color: isDark ? '#64748B' : '#94A3B8' }} className="text-xs mt-1 block">
              Servida em <code className="font-mono">{activeProject.live_url}</code>
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-xs border h-full"
            style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
          >
            <Text style={labelStyle} className="text-xs uppercase font-semibold">
              Total de Releases (/repos)
            </Text>
            <Title level={2} style={{ margin: '8px 0 0 0', color: '#38BDF8' }}>
              {activeProject.total_deployments}
            </Title>
            <Text style={{ color: isDark ? '#64748B' : '#94A3B8' }} className="text-xs mt-1 block">
              Espaço utilizado: <strong>{formatBytes(activeProject.storage_bytes)}</strong>
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-xs border h-full"
            style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
          >
            <div className="flex items-center justify-between">
              <Text style={labelStyle} className="text-xs uppercase font-semibold">
                Política de Aprovação
              </Text>
              <Switch
                size="small"
                checked={activeProject.auto_approval}
                loading={togglingAutoApproval}
                onChange={handleToggleAutoApproval}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <SafetyCertificateOutlined
                style={{ color: activeProject.auto_approval ? '#10B981' : '#F59E0B', fontSize: 18 }}
              />
              <span className="font-semibold text-sm" style={{ color: theme.colorText }}>
                {activeProject.auto_approval ? 'Auto-Aprovação Ativa' : 'Aprovação Manual'}
              </span>
            </div>
            <Text style={{ color: isDark ? '#64748B' : '#94A3B8' }} className="text-xs mt-1 block">
              {activeProject.auto_approval
                ? 'Novas builds publicam imediatamente (se destravado)'
                : 'Builds exigem aprovação de Admin/Editor'}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-xs border h-full"
            style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
          >
            <div className="flex items-center justify-between">
              <Text style={labelStyle} className="text-xs uppercase font-semibold">
                Trava de Versão (Lock)
              </Text>
              <Switch
                size="small"
                checked={activeProject.is_locked}
                loading={togglingLock}
                onChange={handleToggleLock}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {activeProject.is_locked ? (
                <LockOutlined style={{ color: '#F59E0B', fontSize: 18 }} />
              ) : (
                <UnlockOutlined style={{ color: theme.primary, fontSize: 18 }} />
              )}
              <span className="font-mono font-semibold text-sm" style={{ color: theme.colorText }}>
                {activeProject.is_locked
                  ? `Travado em ${activeProject.locked_version}`
                  : 'Destravado (Dinâmico)'}
              </span>
            </div>
            <Text style={{ color: isDark ? '#64748B' : '#94A3B8' }} className="text-xs mt-1 block">
              {activeProject.is_locked
                ? `Travado por ${activeProject.locked_by || 'admin'}`
                : 'Permite atualização contínua de /pages'}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* SECTION 1: LIVE PREVIEW & RECENT RELEASES IN /REPOS */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: theme.colorText }}>
                  <GlobalOutlined style={{ color: theme.primary }} /> Preview Ao Vivo (
                  {activeProject.active_version || 'LIVE'})
                </span>
                <a
                  href={activeProject.live_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: theme.primary }}
                  className="text-xs font-medium hover:underline"
                >
                  Abrir em Nova Aba ↗
                </a>
              </div>
            }
            variant="borderless"
            className="shadow-xs border h-full"
            style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
            styles={{ body: { padding: 0 } }}
          >
            <iframe
              key={`${activeProject.slug}-${activeProject.active_version}`}
              src={activeProject.live_url}
              title="Live Static Build Preview"
              className="w-full h-[380px] border-0 rounded-b-xl bg-[#0B131E]"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: theme.colorText }}>
                  <BranchesOutlined style={{ color: theme.primary }} /> Últimas Releases em /repos
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setActiveSection('deployments')}
                  style={{ color: theme.primary }}
                >
                  Ver todas ({deployments.length})
                </Button>
              </div>
            }
            variant="borderless"
            className="shadow-xs border h-full"
            style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
          >
            <div className="flex flex-col gap-3">
              {deployments.slice(0, 10).map((dep) => (
                <div
                  key={dep.id}
                  className="p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors"
                  style={{
                    backgroundColor: isDark ? '#0F172A40' : '#F8FAFC',
                    borderColor: theme.colorBorder,
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-bold text-sm" style={{ color: theme.colorText }}>
                        {dep.version}
                      </span>
                      {dep.is_live && <Tag color="success" className="m-0">LIVE</Tag>}
                      {dep.is_locked_version && (
                        <Tag color="warning" icon={<LockOutlined />} className="m-0">
                          LOCKED
                        </Tag>
                      )}
                      {dep.status === 'pending_approval' && (
                        <Tag color="gold" className="m-0">AGUARDANDO APROVAÇÃO</Tag>
                      )}
                      {!dep.is_live && dep.status === 'ready' && (
                        <Tag color="cyan" className="m-0">READY</Tag>
                      )}
                    </div>
                    <div className="text-xs truncate mt-1" style={labelStyle}>
                      {dep.release_notes}
                    </div>
                    <div className="text-[11px] font-mono mt-0.5" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                      Commit: {dep.git_commit_sha?.slice(0, 8) || 'n/a'} • {dep.file_count} arq (
                      {formatBytes(dep.size_bytes)})
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip title="Explorar arquivos desta versão">
                      <Button
                        size="small"
                        icon={<FolderOpenOutlined />}
                        onClick={() => {
                          setSelectedVersionForExplorer(dep.version);
                          setActiveSection('explorer');
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={`Abrir preview de ${dep.version}`}>
                      <Button
                        size="small"
                        icon={<GlobalOutlined />}
                        onClick={() => window.open(dep.preview_url, '_blank')}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* SECTION 2: CI/CD & API CONNECTION SETTINGS (Exact aiops-opsbase style) */}
      <Card
        title={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ApiOutlined style={{ color: theme.primary, fontSize: 18 }} />
              <span style={{ color: theme.colorText, fontWeight: 600 }}>
                Configurações de Conexão CI/CD, Endpoints &amp; Deploy Tokens (/repos/{activeProject.slug})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag color={isTokenRevealed ? 'warning' : 'green'} className="m-0 text-xs">
                {isTokenRevealed ? 'Token Revelado (Auditado)' : 'Mascarado por Padrão'}
              </Tag>
              <Button
                size="small"
                type="primary"
                loading={revealingToken}
                icon={isTokenRevealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={handleUnmaskCredentials}
                style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
              >
                {isTokenRevealed ? 'Ocultar Token' : 'Revelar Token Real'}
              </Button>
            </div>
          </div>
        }
        variant="borderless"
        className="shadow-xs border"
        style={{ backgroundColor: theme.bgContainer, borderColor: theme.colorBorder }}
      >
        {loadingCreds ? (
          <div className="py-8 text-center">
            <Spin />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Row gutter={[20, 20]}>
              <Col xs={24} md={12}>
                <div className="flex justify-between items-center mb-1">
                  <Text strong className="text-xs" style={labelStyle}>
                    URL Pública de Produção (Live Hosting)
                  </Text>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(fullLiveUrl, 'URL Live')}
                    style={{ color: theme.primary }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="font-mono text-xs p-2.5 rounded-lg border break-all select-all" style={boxStyle}>
                  {fullLiveUrl}
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div className="flex justify-between items-center mb-1">
                  <Text strong className="text-xs" style={labelStyle}>
                    Endpoint de Upload CI/CD (REST API)
                  </Text>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(uploadEndpoint, 'Endpoint CI/CD')}
                    style={{ color: theme.primary }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="font-mono text-xs p-2.5 rounded-lg border break-all select-all" style={boxStyle}>
                  {uploadEndpoint}
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div className="flex justify-between items-center mb-1">
                  <Text strong className="text-xs" style={labelStyle}>
                    Project ID
                  </Text>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(String(activeProject.id), 'Project ID')}
                    style={{ color: theme.primary }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="font-mono text-xs p-2.5 rounded-lg border select-all" style={boxStyle}>
                  {activeProject.id}
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div className="flex justify-between items-center mb-1">
                  <Text strong className="text-xs" style={labelStyle}>
                    Project Slug
                  </Text>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(activeProject.slug, 'Project Slug')}
                    style={{ color: theme.primary }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="font-mono text-xs p-2.5 rounded-lg border select-all" style={boxStyle}>
                  {activeProject.slug}
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div className="flex justify-between items-center mb-1">
                  <Text strong className="text-xs" style={labelStyle}>
                    Diretório Físico Git (/repos)
                  </Text>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(activeProject.repo_disk_path, 'Diretório /repos')}
                    style={{ color: theme.primary }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="font-mono text-xs p-2.5 rounded-lg border truncate select-all" style={boxStyle}>
                  {activeProject.repo_disk_path}
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0', borderColor: theme.colorBorder }} />

            {/* Deploy Key Box */}
            <div
              className="p-4 rounded-xl border"
              style={{ backgroundColor: isDark ? '#0F172A40' : '#F8FAFC', borderColor: theme.colorBorder }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <KeyOutlined style={{ color: '#10B981' }} />
                  <Text strong style={{ color: theme.colorText }}>
                    Chave de Deploy CI/CD (X-API-Key)
                  </Text>
                  <Tag color="success" className="m-0 font-mono text-xs">
                    deploy_token
                  </Tag>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="small"
                    type="text"
                    icon={isTokenRevealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    loading={revealingToken}
                    onClick={handleUnmaskCredentials}
                  />
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(deployToken, 'Token de Deploy')}
                    style={{ color: theme.primary }}
                  >
                    Copiar
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setActiveSection('tokens')}
                    style={{ color: theme.primary }}
                  >
                    Gerenciar Tokens
                  </Button>
                </div>
              </div>
              <Text style={labelStyle} className="text-xs block mb-3">
                Utilize este token no cabeçalho <code className="font-mono">X-API-Key</code> em pipelines do GitHub
                Actions, GitLab CI ou cURL para publicar novas versões automaticamente em{' '}
                <code className="font-mono">/repos/{activeProject.slug}</code>.
              </Text>
              <div
                className="font-mono text-xs p-3 rounded-lg border break-all select-all"
                style={{
                  backgroundColor: theme.bgContainer,
                  borderColor: theme.colorBorder,
                  color: theme.colorText,
                }}
              >
                {deployToken}
              </div>
            </div>

            {/* Integration Snippets Tabs */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CodeOutlined style={{ color: theme.primary }} />
                <Text strong style={{ color: theme.colorText }}>
                  Snippets de Automação &amp; CI/CD (Preenchidos com os dados reais do projeto)
                </Text>
              </div>
              <Tabs
                size="small"
                items={[
                  {
                    key: 'gha',
                    label: 'GitHub Actions (.github/workflows/deploy.yml)',
                    children: (
                      <div>
                        <div className="flex justify-end mb-1">
                          <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(ghaSnippet, 'Workflow GitHub Actions')}
                            style={{ color: theme.primary }}
                          >
                            Copiar workflow YAML
                          </Button>
                        </div>
                        <pre
                          className="font-mono text-xs p-3.5 rounded-xl border overflow-x-auto m-0"
                          style={boxStyle}
                        >
                          {ghaSnippet}
                        </pre>
                      </div>
                    ),
                  },
                  {
                    key: 'curl',
                    label: 'cURL (Upload Automatizado de Build)',
                    children: (
                      <div>
                        <div className="flex justify-end mb-1">
                          <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(curlSnippet, 'Comando cURL')}
                            style={{ color: theme.primary }}
                          >
                            Copiar comando cURL
                          </Button>
                        </div>
                        <pre
                          className="font-mono text-xs p-3.5 rounded-xl border overflow-x-auto m-0"
                          style={boxStyle}
                        >
                          {curlSnippet}
                        </pre>
                      </div>
                    ),
                  },
                  {
                    key: 'env',
                    label: '.env (Variáveis de Ambiente)',
                    children: (
                      <div>
                        <div className="flex justify-end mb-1">
                          <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => copyText(envSnippet, 'Arquivo .env')}
                            style={{ color: theme.primary }}
                          >
                            Copiar .env completo
                          </Button>
                        </div>
                        <pre
                          className="font-mono text-xs p-3.5 rounded-xl border overflow-x-auto m-0"
                          style={boxStyle}
                        >
                          {envSnippet}
                        </pre>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
