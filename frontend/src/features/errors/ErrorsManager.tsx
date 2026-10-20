import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Modal,
  Form,
  InputNumber,
  Empty,
  message,
  Switch,
  Badge,
} from 'antd';
import {
  BugOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LinkOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { api, extractErrorMessage } from '../../services/api';
import { useProjectStore } from '../../stores/useProjectStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { syncRouteAndParams, useUrlTableState } from '../../utils/urlState';

export interface ErrorReportItem {
  id: number;
  project_id?: number | null;
  project_slug?: string | null;
  page_url: string;
  route_path?: string | null;
  error_code?: string | null;
  http_status?: number | null;
  severity: 'critical' | 'error' | 'warning' | 'info';
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  title: string;
  message: string;
  stack_trace?: string | null;
  user_agent?: string | null;
  reporter_email?: string | null;
  metadata?: Record<string, any>;
  resolved_at?: string | null;
  created_at: string;
}

interface ErrorsManagerProps {
  standalone?: boolean;
  onBackToHome?: () => void;
}

export const ErrorsManager: React.FC<ErrorsManagerProps> = ({ standalone = false, onBackToHome }) => {
  const { activeProject, projects } = useProjectStore();
  const { isAuthenticated, user } = useAuthStore();

  const {
    page,
    pageSize,
    search,
    status,
    extra,
    setPage,
    setSearch,
    setStatus,
    setExtra,
    resetFilters,
  } = useUrlTableState({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultStatus: 'all',
    defaultExtra: { severity: 'all', scope: 'all' },
  });

  const [items, setItems] = useState<ErrorReportItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorReportItem | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const projectOnly = extra.scope === 'project';
  const severityFilter = extra.severity || 'all';

  const loadErrors = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: 1,
        page_size: 200,
      };
      if (projectOnly && activeProject) {
        params.project_slug = activeProject.slug;
      }
      if (search.trim()) {
        params.q = search.trim();
      }
      if (status && status !== 'all') {
        params.status = status;
      }
      if (severityFilter && severityFilter !== 'all') {
        params.severity = severityFilter;
      }
      const res = await api.get('/errors', { params });
      const list: ErrorReportItem[] = Array.isArray(res.data)
        ? res.data
        : res.data?.items || [];
      setItems(list);
      setTotal(res.data?.total ?? list.length);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, [search, status, severityFilter, projectOnly, activeProject?.slug]);

  const handleOpenReportModal = () => {
    form.setFieldsValue({
      project_slug: activeProject?.slug || projects[0]?.slug || 'aiops-crud',
      page_url:
        typeof window !== 'undefined'
          ? window.location.href
          : 'http://localhost:8005/pages/aiops-crud/',
      route_path: typeof window !== 'undefined' ? window.location.pathname : '/errors',
      error_code: 'OPSPAGES-CLIENT-ERR',
      http_status: 500,
      severity: 'error',
      title: '',
      message: '',
      stack_trace: '',
      reporter_email: user?.email || '',
    });
    setReportModalOpen(true);
  };

  const handleSubmitError = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/errors/report', {
        project_slug: values.project_slug || activeProject?.slug || null,
        page_url: values.page_url,
        route_path: values.route_path || '/errors',
        error_code: values.error_code || 'OPSPAGES-REPORT',
        http_status: values.http_status || null,
        severity: values.severity || 'error',
        title: values.title,
        message: values.message,
        stack_trace: values.stack_trace || null,
        reporter_email: values.reporter_email || user?.email || null,
        metadata: {
          reported_from_route: typeof window !== 'undefined' ? window.location.pathname : '/errors',
          browser_url: typeof window !== 'undefined' ? window.location.href : '',
        },
      });
      message.success('Erro reportado e registrado com sucesso na Central de Diagnóstico (/errors)!');
      setReportModalOpen(false);
      form.resetFields();
      loadErrors();
    } catch (err) {
      message.error(extractErrorMessage(err, 'Falha ao registrar reporte de erro.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (errorId: number, nextStatus: string) => {
    try {
      await api.patch(`/errors/${errorId}/status`, null, {
        params: { new_status: nextStatus },
      });
      message.success(`Status atualizado para ${nextStatus.toUpperCase()}`);
      loadErrors();
      if (selectedError && selectedError.id === errorId) {
        setSelectedError({ ...selectedError, status: nextStatus as any });
      }
    } catch (err) {
      message.error(extractErrorMessage(err, ' Faça login para alterar o status do incidente.'));
    }
  };

  const getSeverityTag = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <Tag color="magenta">CRÍTICO</Tag>;
      case 'error':
        return <Tag color="error">ERRO</Tag>;
      case 'warning':
        return <Tag color="warning">ALERTA</Tag>;
      default:
        return <Tag color="processing">INFO</Tag>;
    }
  };

  const getStatusTag = (st: string) => {
    switch (st) {
      case 'resolved':
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            RESOLVIDO
          </Tag>
        );
      case 'investigating':
        return (
          <Tag icon={<WarningOutlined />} color="warning">
            EM ANÁLISE
          </Tag>
        );
      case 'ignored':
        return <Tag color="default">IGNORADO</Tag>;
      default:
        return <Tag color="volcano">ABERTO</Tag>;
    }
  };

  const openCount = items.filter((i) => i.status === 'open' || i.status === 'investigating').length;
  const resolvedCount = items.filter((i) => i.status === 'resolved').length;

  return (
    <div className={standalone ? 'min-h-screen bg-[#0D1117] text-white p-6 md:p-10' : 'space-y-6'}>
      {standalone && (
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                if (onBackToHome) onBackToHome();
                else syncRouteAndParams('/', {}, true);
              }}
            >
              Voltar ao Portal
            </Button>
            <span className="font-mono text-xs text-[#FF774A] bg-[#FF774A]/10 px-2.5 py-1 rounded border border-[#FF774A]/30">
              ROTA OFICIAL DE REPORTE DE ERROS • /errors
            </span>
          </div>
          {!isAuthenticated && (
            <Button
              type="primary"
              onClick={() => syncRouteAndParams('/login', {}, true)}
            >
              Entrar no Console
            </Button>
          )}
        </div>
      )}

      <div className={standalone ? 'max-w-7xl mx-auto space-y-6' : 'space-y-6'}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BugOutlined className="text-[#FF774A]" />
              Central de Erros & Diagnóstico de Rotas ({total} ocorrências)
            </h2>
            <p className="text-xs text-theme-muted mt-0.5">
              Rota dedicada (<code>/errors</code> e <code>POST /api/v1/errors/report</code>) para informar e auditar erros de páginas, CORS, cache, preview e integrações Opsbase.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge count={openCount} offset={[-4, 4]} color="#f5222d">
              <Tag color="red" className="px-2.5 py-1 text-xs">
                Em Aberto / Análise: {openCount}
              </Tag>
            </Badge>
            <Tag color="green" className="px-2.5 py-1 text-xs">
              Corrigidos / Verificados: {resolvedCount}
            </Tag>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenReportModal}
            >
              Informar Erro por Aqui
            </Button>
          </div>
        </div>

        {/* Filter & URL Pagination Bar */}
        <Card className="border-theme" size="small">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                prefix={<SearchOutlined className="text-slate-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por código (ex: P-13), URL, rota ou mensagem..."
                className="w-72"
                allowClear
              />
              <Select
                value={status}
                onChange={(val) => setStatus(val)}
                className="w-40"
                options={[
                  { value: 'all', label: 'Todos os Status' },
                  { value: 'open', label: 'Abertos' },
                  { value: 'investigating', label: 'Em Análise' },
                  { value: 'resolved', label: 'Resolvidos' },
                  { value: 'ignored', label: 'Ignorados' },
                ]}
              />
              <Select
                value={severityFilter}
                onChange={(val) => setExtra('severity', val)}
                className="w-40"
                options={[
                  { value: 'all', label: 'Todas Severidades' },
                  { value: 'critical', label: 'Crítico' },
                  { value: 'error', label: 'Erro' },
                  { value: 'warning', label: 'Alerta' },
                  { value: 'info', label: 'Info' },
                ]}
              />
              {activeProject && (
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-theme">
                  <Switch
                    size="small"
                    checked={projectOnly}
                    onChange={(checked) => setExtra('scope', checked ? 'project' : 'all')}
                  />
                  <span>Apenas {activeProject.slug}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button size="small" onClick={resetFilters}>
                Limpar Filtros
              </Button>
              <Button
                size="small"
                icon={<ReloadOutlined spin={loading} />}
                onClick={loadErrors}
              >
                Atualizar
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border-theme">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            pagination={{
              current: page,
              pageSize: Math.max(10, pageSize),
              total: items.length,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (tot, range) => `${range[0]}-${range[1]} de ${tot} registros (URL ?page=${page}&page_size=${Math.max(10, pageSize)})`,
              onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
            }}
            locale={{
              emptyText: <Empty description="Nenhum erro encontrado para os filtros informados na URL." />,
            }}
            columns={[
              {
                title: 'Código',
                dataIndex: 'error_code',
                width: 110,
                render: (val: string) => (
                  <span className="font-mono text-xs font-bold text-[#FF774A]">
                    {val || 'ERR-GEN'}
                  </span>
                ),
              },
              {
                title: 'Severidade',
                dataIndex: 'severity',
                width: 110,
                render: (sev: string) => getSeverityTag(sev),
              },
              {
                title: 'Projeto / Rota URL',
                render: (_: any, row: ErrorReportItem) => (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {row.project_slug && (
                        <Tag color="blue" className="m-0 text-[10px]">
                          {row.project_slug}
                        </Tag>
                      )}
                      <span className="font-mono text-xs text-slate-300">
                        {row.route_path || '/'}
                      </span>
                      {row.http_status && (
                        <Tag color={row.http_status >= 400 ? 'volcano' : 'geekblue'} className="m-0 text-[10px]">
                          HTTP {row.http_status}
                        </Tag>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs" title={row.page_url}>
                      <LinkOutlined className="mr-1" />
                      {row.page_url}
                    </div>
                  </div>
                ),
              },
              {
                title: 'Título & Diagnóstico',
                render: (_: any, row: ErrorReportItem) => (
                  <div className="max-w-md">
                    <div className="font-semibold text-xs">{row.title}</div>
                    <div className="text-xs text-slate-400 line-clamp-2">{row.message}</div>
                  </div>
                ),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                width: 140,
                render: (st: string) => getStatusTag(st),
              },
              {
                title: 'Data',
                dataIndex: 'created_at',
                width: 145,
                render: (val: string) => (
                  <span className="font-mono text-xs text-slate-400">
                    {val ? new Date(val).toLocaleString('pt-BR') : '-'}
                  </span>
                ),
              },
              {
                title: 'Ações',
                align: 'right',
                width: 180,
                render: (_: any, row: ErrorReportItem) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {isAuthenticated && row.status !== 'resolved' && (
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        onClick={() => handleUpdateStatus(row.id, 'resolved')}
                      >
                        Resolver
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedError(row)}
                    >
                      Detalhes
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* Modal para Informar Erro */}
      <Modal
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <BugOutlined className="text-[#FF774A]" />
            <span>Informar Erro na Página / Rota</span>
          </div>
        }
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Registrar Erro"
        cancelText="Cancelar"
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitError} className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item label="Projeto" name="project_slug">
              <Select
                allowClear
                placeholder="Selecione o projeto"
                options={[
                  ...projects.map((p) => ({ value: p.slug, label: `${p.name} (${p.slug})` })),
                  ...(projects.length === 0
                    ? [
                        { value: 'aiops-crud', label: 'aiops-crud' },
                        { value: 'portal-loft', label: 'portal-loft' },
                      ]
                    : []),
                ]}
              />
            </Form.Item>
            <Form.Item
              label="Severidade"
              name="severity"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'critical', label: 'Crítico (Indispensável / Segurança)' },
                  { value: 'error', label: 'Erro (Funcional / HTTP 4xx-5xx)' },
                  { value: 'warning', label: 'Alerta (Cache / Performance)' },
                  { value: 'info', label: 'Informativo' },
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Form.Item
              label="URL Completa da Página"
              name="page_url"
              className="sm:col-span-2"
              rules={[{ required: true, message: 'Informe a URL onde o erro ocorreu' }]}
            >
              <Input placeholder="http://localhost:8005/pages/aiops-crud/" />
            </Form.Item>
            <Form.Item label="Rota (Path)" name="route_path">
              <Input placeholder="/pages/aiops-crud/" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Form.Item label="Código do Erro" name="error_code">
              <Input placeholder="Ex: P-13, CORS-ERR, HTTP-404" />
            </Form.Item>
            <Form.Item label="Status HTTP (Opcional)" name="http_status">
              <InputNumber className="w-full" min={100} max={599} placeholder="Ex: 404, 500" />
            </Form.Item>
            <Form.Item label="E-mail / Autor (Opcional)" name="reporter_email">
              <Input placeholder="qa@loft.com.br" />
            </Form.Item>
          </div>

          <Form.Item
            label="Título Resumido do Problema"
            name="title"
            rules={[{ required: true, message: 'Descreva o título do erro' }]}
          >
            <Input placeholder="Ex: Falha ao carregar asset JS após rollback de versão" />
          </Form.Item>

          <Form.Item
            label="Descrição Detalhada (Observado vs Esperado)"
            name="message"
            rules={[{ required: true, message: 'Descreva o comportamento observado e o esperado' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Descreva os passos para reproduzir, o comportamento observado e o esperado..."
            />
          </Form.Item>

          <Form.Item label="Stack Trace / Evidência Técnica (Opcional)" name="stack_trace">
            <Input.TextArea
              rows={2}
              className="font-mono text-xs"
              placeholder="Cole headers HTTP, erro do console ou stack trace..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Detalhes do Erro */}
      <Modal
        open={Boolean(selectedError)}
        onCancel={() => setSelectedError(null)}
        footer={null}
        width={700}
        title={
          selectedError ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#FF774A]">{selectedError.error_code || `#${selectedError.id}`}</span>
              <span>— {selectedError.title}</span>
            </div>
          ) : null
        }
      >
        {selectedError && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {getSeverityTag(selectedError.severity)}
              {getStatusTag(selectedError.status)}
              {selectedError.project_slug && <Tag color="blue">Projeto: {selectedError.project_slug}</Tag>}
              {selectedError.http_status && <Tag color="purple">HTTP {selectedError.http_status}</Tag>}
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/10 space-y-1 font-mono">
              <div>
                <span className="text-slate-400">URL: </span>
                <span className="text-[#FF774A] break-all">{selectedError.page_url}</span>
              </div>
              <div>
                <span className="text-slate-400">Rota: </span>
                <span>{selectedError.route_path || '/'}</span>
              </div>
              <div>
                <span className="text-slate-400">Registrado em: </span>
                <span>{new Date(selectedError.created_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-1 text-slate-300">Diagnóstico / Mensagem:</div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 leading-relaxed">
                {selectedError.message}
              </div>
            </div>

            {selectedError.stack_trace && (
              <div>
                <div className="font-semibold mb-1 text-slate-300">Stack Trace / Evidência:</div>
                <pre className="p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] overflow-x-auto">
                  {selectedError.stack_trace}
                </pre>
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-slate-400">Atualizar status do incidente:</span>
                <div className="flex items-center gap-2">
                  {(['open', 'investigating', 'resolved', 'ignored'] as const).map((st) => (
                    <Button
                      key={st}
                      size="small"
                      type={selectedError.status === st ? 'primary' : 'default'}
                      onClick={() => handleUpdateStatus(selectedError.id, st)}
                    >
                      {st.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
