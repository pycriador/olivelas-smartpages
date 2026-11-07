import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Switch,
  Tooltip,
  Popconfirm,
  Alert,
  Space,
  Select,
  message,
} from 'antd';
import {
  CloudUploadOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  RollbackOutlined,
  GlobalOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  BranchesOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useProjectStore, DeploymentItem } from '../../stores/useProjectStore';
import { api, extractErrorMessage } from '../../services/api';
import { useUrlTableState } from '../../utils/urlState';

const { Dragger } = Upload;

export const DeploymentsManager: React.FC = () => {
  const {
    activeProject,
    deployments,
    fetchProjects,
    fetchDeployments,
    setActiveSection,
    setSelectedVersionForExplorer,
  } = useProjectStore();
  const { page, pageSize, search, status, setPage, setSearch, setStatus } = useUrlTableState({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultStatus: 'all',
  });

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [suggestedVersion, setSuggestedVersion] = useState('v1.0.1');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [uploadForm] = Form.useForm();
  const [quickForm] = Form.useForm();

  const loadNextVersion = async () => {
    if (!activeProject) return;
    try {
      const res = await api.get(`/projects/${activeProject.id}/deployments/next-version`);
      const nextVer = res.data.next_version || 'v1.0.1';
      setSuggestedVersion(nextVer);
      uploadForm.setFieldsValue({ version: nextVer });
      quickForm.setFieldsValue({ version: nextVer });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNextVersion();
  }, [activeProject?.id, deployments.length]);

  if (!activeProject) return null;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleArchiveUpload = async (values: { version?: string; release_notes: string }) => {
    if (!selectedFile) {
      message.warning('Selecione um arquivo .zip ou .tar.gz contendo sua build estática.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (values.version) formData.append('version', values.version.trim());
      formData.append('release_notes', values.release_notes || 'Build enviada via Console Web');
      formData.append('source', 'web_upload');

      const res = await api.post(
        `/projects/${activeProject.id}/deployments/upload`,
        formData
      );
      const dep: DeploymentItem = res.data;
      if (dep.status === 'published') {
        message.success(`Build ${dep.version} publicada automaticamente em ${activeProject.live_url}!`);
      } else if (dep.status === 'pending_approval') {
        message.info(`Build ${dep.version} recebida e aguardando aprovação manual.`);
      } else {
        message.success(
          `Build ${dep.version} salva em /repos (Produção permanece travada em ${activeProject.locked_version}).`
        );
      }
      setUploadModalOpen(false);
      setSelectedFile(null);
      uploadForm.resetFields();
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Falha ao enviar arquivo de build.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickBuildSubmit = async (values: {
    version: string;
    release_notes: string;
    index_html: string;
    styles_css: string;
    app_js: string;
  }) => {
    setSubmitting(true);
    try {
      const filesMap: Record<string, string> = {
        'index.html': values.index_html,
      };
      if (values.styles_css?.trim()) filesMap['styles.css'] = values.styles_css;
      if (values.app_js?.trim()) filesMap['app.js'] = values.app_js;

      const res = await api.post(`/projects/${activeProject.id}/deployments/quick-build`, {
        version: values.version.trim(),
        release_notes: values.release_notes,
        files: filesMap,
      });
      const dep: DeploymentItem = res.data;
      message.success(`Build ${dep.version} gerada e versionada no Git (/repos/${activeProject.slug})!`);
      setQuickModalOpen(false);
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Falha ao gerar build rápida.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (dep: DeploymentItem) => {
    setActionLoadingId(`approve-${dep.version}`);
    try {
      await api.post(`/projects/${activeProject.id}/deployments/${dep.version}/approve`, {
        publish_immediately: true,
        notes: 'Aprovado via Console OpsPages',
      });
      message.success(
        activeProject.is_locked
          ? `Versão ${dep.version} aprovada (Produção travada em ${activeProject.locked_version}).`
          : `Versão ${dep.version} aprovada e publicada em produção!`
      );
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublishOrRollback = async (dep: DeploymentItem, lockVersion = false) => {
    setActionLoadingId(`pub-${dep.version}`);
    try {
      await api.post(`/projects/${activeProject.id}/deployments/${dep.version}/publish`, {
        lock_this_version: lockVersion,
        reason: lockVersion
          ? `Publicada e travada na versão ${dep.version}`
          : `Ativação/Rollback para ${dep.version}`,
      });
      message.success(
        lockVersion
          ? `Versão ${dep.version} ativada e TRAVADA em produção!`
          : `Produção atualizada para a versão ${dep.version}!`
      );
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLockSpecificVersion = async (version: string, lock: boolean) => {
    setActionLoadingId(`lock-${version}`);
    try {
      await api.post(`/projects/${activeProject.id}/lock`, {
        is_locked: lock,
        version,
        reason: lock ? `Travado manualmente na versão ${version}` : 'Destravado manualmente',
      });
      message.success(
        lock ? `Projeto travado na versão ${version}!` : 'Trava de versão removida com sucesso!'
      );
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteDeployment = async (version: string) => {
    setActionLoadingId(`del-${version}`);
    try {
      await api.delete(`/projects/${activeProject.id}/deployments/${version}`);
      message.success(`Versão ${version} removida.`);
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const openQuickBuilderWithTemplate = () => {
    const nextVer = suggestedVersion;
    quickForm.setFieldsValue({
      version: nextVer,
      release_notes: `Release ${nextVer} criada via Web Builder`,
      index_html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${activeProject.name} — ${nextVer}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="container">
    <span class="badge">Olivelas OpsPages • ${nextVer}</span>
    <h1>${activeProject.name}</h1>
    <p>Build estática hospedada e versionada em <code>/repos/${activeProject.slug}</code>.</p>
    <div id="app-status">Carregando runtime...</div>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      styles_css: `body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background: #0B131E;
  color: #F1F5F9;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
}
.container {
  max-width: 640px;
  padding: 40px;
  border-radius: 16px;
  background: #131D2B;
  border: 1px solid #223147;
  box-shadow: 0 20px 50px rgba(0,0,0,0.45);
}
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(245, 103, 56, 0.15);
  color: #FF774A;
  font-weight: 700;
  font-size: 12px;
}
h1 { margin: 16px 0 8px; font-size: 32px; }
p { color: #94A3B8; line-height: 1.6; }
code { color: #FF774A; }
#app-status {
  margin-top: 20px;
  padding: 12px;
  border-radius: 8px;
  background: #0B131E;
  color: #10B981;
  font-family: monospace;
}`,
      app_js: `document.getElementById('app-status').textContent = '✓ Build ' + '${nextVer}' + ' ativa em ' + new Date().toLocaleString('pt-BR');`,
    });
    setQuickModalOpen(true);
  };

  const columns = [
    {
      title: 'Versão / Tag Git',
      key: 'version',
      render: (_: any, record: DeploymentItem) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm">{record.version}</span>
          {record.is_live && (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              LIVE
            </Tag>
          )}
          {record.is_locked_version && (
            <Tag color="warning" icon={<LockOutlined />}>
              LOCKED
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Status de Governança',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'published') return <Tag color="success">PUBLICADA (PRODUÇÃO)</Tag>;
        if (status === 'pending_approval') return <Tag color="gold">AGUARDANDO APROVAÇÃO</Tag>;
        if (status === 'ready') return <Tag color="cyan">PRONTA (PREVIEW / ROLLBACK)</Tag>;
        return <Tag>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Commit Git (/repos)',
      key: 'git',
      render: (_: any, record: DeploymentItem) => (
        <div className="text-xs font-mono">
          <Tag color="orange">{record.git_commit_sha?.slice(0, 8) || 'local'}</Tag>
          <span className="text-slate-400">{record.git_branch}</span>
        </div>
      ),
    },
    {
      title: 'Release Notes & Origem',
      key: 'notes',
      render: (_: any, record: DeploymentItem) => (
        <div>
          <div className="text-xs font-medium">{record.release_notes}</div>
          <div className="text-[11px] text-slate-400">
            Origem: <code>{record.source}</code> • Por: {record.created_by_email || 'system'}
          </div>
        </div>
      ),
    },
    {
      title: 'Arquivos & Tamanho',
      key: 'size',
      render: (_: any, record: DeploymentItem) => (
        <span className="text-xs font-mono">
          {record.file_count} arq • {formatBytes(record.size_bytes)}
        </span>
      ),
    },
    {
      title: 'Ações & Controle de Versão',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: DeploymentItem) => (
        <Space size="small" wrap>
          <Tooltip title={`Abrir Preview desta versão (${record.preview_url})`}>
            <Button
              size="small"
              icon={<GlobalOutlined />}
              onClick={() => window.open(record.preview_url, '_blank')}
            >
              Preview
            </Button>
          </Tooltip>

          <Tooltip title="Baixar Build Estática (HTML, CSS, JS, IMG .zip) para rodar em servidor local">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              href={`/api/v1/public/projects/${activeProject.slug}/download-build?version=${encodeURIComponent(record.version)}`}
              target="_blank"
            >
              HTML (.zip)
            </Button>
          </Tooltip>

          <Tooltip title="Baixar Código-Fonte em TypeScript (.zip)">
            <Button
              size="small"
              icon={<CodeOutlined />}
              href={`/api/v1/public/projects/${activeProject.slug}/download-source?version=${encodeURIComponent(record.version)}`}
              target="_blank"
            >
              Fonte TS (.zip)
            </Button>
          </Tooltip>

          <Tooltip title="Inspecionar árvore de arquivos da build">
            <Button
              size="small"
              icon={<FolderOpenOutlined />}
              onClick={() => {
                setSelectedVersionForExplorer(record.version);
                setActiveSection('explorer');
              }}
            />
          </Tooltip>

          {record.status === 'pending_approval' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={actionLoadingId === `approve-${record.version}`}
              onClick={() => handleApprove(record)}
            >
              Aprovar & Publicar
            </Button>
          )}

          {!record.is_live && record.status !== 'pending_approval' && (
            <Tooltip
              title={
                activeProject.is_locked
                  ? 'Projeto travado: destrave primeiro ou clique em Travar nesta Versão'
                  : 'Ativar esta versão imediatamente em produção (Rollback / Promote)'
              }
            >
              <Button
                size="small"
                icon={<RollbackOutlined />}
                disabled={activeProject.is_locked}
                loading={actionLoadingId === `pub-${record.version}`}
                onClick={() => handlePublishOrRollback(record, false)}
              >
                Ativar Live
              </Button>
            </Tooltip>
          )}

          {record.is_locked_version ? (
            <Tooltip title="Destravar esta versão">
              <Button
                size="small"
                danger
                icon={<UnlockOutlined />}
                loading={actionLoadingId === `lock-${record.version}`}
                onClick={() => handleLockSpecificVersion(record.version, false)}
              >
                Destravar
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title={`Publicar e Travar produção na versão ${record.version}`}>
              <Button
                size="small"
                icon={<LockOutlined />}
                loading={actionLoadingId === `lock-${record.version}`}
                onClick={() => handleLockSpecificVersion(record.version, true)}
              >
                Travar Aqui
              </Button>
            </Tooltip>
          )}

          {!record.is_live && !record.is_locked_version && (
            <Popconfirm
              title={`Excluir a build ${record.version}?`}
              onConfirm={() => handleDeleteDeployment(record.version)}
              okText="Excluir"
              cancelText="Cancelar"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={actionLoadingId === `del-${record.version}`}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const filteredDeployments = deployments.filter((d) => {
    if (status && status !== 'all' && d.status !== status) return false;
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      String(d.version || '')
        .toLowerCase()
        .includes(term) ||
      String(d.release_notes || '')
        .toLowerCase()
        .includes(term) ||
      String(d.git_commit_sha || '')
        .toLowerCase()
        .includes(term) ||
      String(d.created_by_email || '')
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <div className="opspages-page">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold m-0 flex items-center gap-2">
                <BranchesOutlined className="text-[#FF774A]" />
                Gerenciador de Builds Estáticas & Releases (/repos/{activeProject.slug})
              </h3>
              <p className="text-xs text-slate-400 m-0 mt-1.5">
                Suba pacotes <code>.zip</code> / <code>.tar.gz</code>, gere builds pelo Editor Web (com suporte a binários Base64 • P-12) ou
                automatize via API CI/CD. Previews de versões pendentes são protegidos por autenticação (P-4).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button icon={<CodeOutlined />} onClick={openQuickBuilderWithTemplate}>
                Editor Rápido HTML/CSS/JS
              </Button>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => {
                  loadNextVersion();
                  setUploadModalOpen(true);
                }}
              >
                Upload de Build (.zip / .tar.gz)
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                prefix={<SearchOutlined className="text-slate-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar versão, commit ou nota..."
                className="w-64"
                allowClear
              />
              <Select
                value={status}
                onChange={(val) => setStatus(val)}
                className="w-48"
                options={[
                  { value: 'all', label: 'Todos os Status' },
                  { value: 'published', label: 'Publicada (Live)' },
                  { value: 'pending_approval', label: 'Aguardando Aprovação' },
                  { value: 'ready', label: 'Pronta (Rollback)' },
                  { value: 'rolled_back', label: 'Rolled Back' },
                ]}
              />
            </div>
            <span className="text-xs text-slate-400">
              Exibindo <strong>{filteredDeployments.length}</strong> de {deployments.length} releases
            </span>
          </div>
        </div>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          dataSource={filteredDeployments}
          columns={columns}
          pagination={{
            current: page,
            pageSize: Math.max(10, pageSize),
            total: filteredDeployments.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (tot, range) => `${range[0]}-${range[1]} de ${tot} releases`,
            onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
          }}
        />
      </Card>

      {/* Upload Archive Modal */}
      <Modal
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        footer={null}
        centered
        styles={{
          body: {
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        title={
          <div className="flex items-center gap-2">
            <CloudUploadOutlined className="text-[#FF774A]" />
            <span>Subir Nova Build Estática (.zip / .tar.gz)</span>
          </div>
        }
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleArchiveUpload}
          initialValues={{ version: suggestedVersion, release_notes: '' }}
        >
          <Alert
            type="info"
            showIcon
            className="mb-4 text-xs"
            message={
              activeProject.is_locked
                ? `Atenção: O projeto está TRAVADO na versão ${activeProject.locked_version}. Esta nova build será salva como READY (disponível em /v/{versao}) sem sobrescrever a produção.`
                : activeProject.auto_approval
                ? 'Auto-Aprovação ativa: Esta build será publicada automaticamente em produção assim que o commit Git em /repos concluir.'
                : 'Aprovação Manual ativa: Esta build ficará com status AGUARDANDO APROVAÇÃO até ser liberada.'
            }
          />

          <Form.Item
            name="version"
            label="Tag da Versão (Ex: v1.2.0)"
            rules={[{ required: true, message: 'Informe a versão' }]}
          >
            <Input placeholder="v1.0.1" className="font-mono" />
          </Form.Item>

          <Form.Item name="release_notes" label="Release Notes / Mensagem do Commit Git">
            <Input.TextArea rows={2} placeholder="Ex: Novo fluxo de checkout e otimização de assets" />
          </Form.Item>

          <Form.Item label="Pacote da Build Estática (.zip ou .tar.gz)">
            <Dragger
              multiple={false}
              accept=".zip,.tar.gz,.tgz,.tar"
              beforeUpload={(file) => {
                setSelectedFile(file);
                return false;
              }}
              onRemove={() => setSelectedFile(null)}
              fileList={selectedFile ? ([selectedFile] as any) : []}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-[#FF774A]" />
              </p>
              <p className="ant-upload-text text-sm">
                Clique ou arraste o arquivo <code>dist.zip</code> ou <code>build.tar.gz</code> aqui
              </p>
              <p className="ant-upload-hint text-xs">
                Se o arquivo tiver uma pasta raiz única (<code>dist/</code> ou <code>build/</code>), o
                OpsPages descompacta automaticamente para a raiz da versão em <code>/repos</code>.
              </p>
            </Dragger>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setUploadModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<CloudUploadOutlined />}>
              Enviar & Versionar em /repos
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Quick Web Builder Modal */}
      <Modal
        open={quickModalOpen}
        onCancel={() => setQuickModalOpen(false)}
        footer={null}
        centered
        width={820}
        styles={{
          body: {
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        title={
          <div className="flex items-center gap-2">
            <ThunderboltOutlined className="text-[#FF774A]" />
            <span>Editor Rápido de Build Estática (Gera Commit & Tag em /repos)</span>
          </div>
        }
      >
        <Form form={quickForm} layout="vertical" onFinish={handleQuickBuildSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item
              name="version"
              label="Versão / Tag Git"
              rules={[{ required: true, message: 'Informe a versão' }]}
            >
              <Input className="font-mono" />
            </Form.Item>
            <Form.Item
              name="release_notes"
              label="Mensagem do Commit / Release Notes"
              className="sm:col-span-2"
              rules={[{ required: true, message: 'Informe as notas da versão' }]}
            >
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            name="index_html"
            label="index.html"
            rules={[{ required: true, message: 'O arquivo index.html é obrigatório' }]}
          >
            <Input.TextArea rows={8} className="font-mono text-xs" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item name="styles_css" label="styles.css">
              <Input.TextArea rows={6} className="font-mono text-xs" />
            </Form.Item>
            <Form.Item name="app_js" label="app.js">
              <Input.TextArea rows={6} className="font-mono text-xs" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setQuickModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckCircleOutlined />}>
              Criar Release & Commit Git
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
