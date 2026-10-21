import React, { useEffect, useState } from 'react';
import { Card, Table, Form, Input, Switch, Button, Tag, Popconfirm, Empty, Tooltip, message } from 'antd';
import {
  GlobalOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { api, extractErrorMessage } from '../../services/api';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUrlTableState } from '../../utils/urlState';

const METHOD_COLORS: Record<string, string> = {
  GET: 'blue',
  HEAD: 'cyan',
  OPTIONS: 'purple',
  POST: 'green',
  PUT: 'orange',
  PATCH: 'gold',
  DELETE: 'red',
};

export const CorsManager: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { page, pageSize, search, setPage, setSearch } = useUrlTableState({
    defaultPage: 1,
    defaultPageSize: 10,
  });
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncingOpsBaseCors, setSyncingOpsBaseCors] = useState(false);
  const [form] = Form.useForm();

  const loadRules = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get(`/projects/${activeProject.id}/cors`);
      setRules(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [activeProject?.id]);

  const handleAddRule = async (values: any) => {
    if (!activeProject) return;
    setSubmitting(true);
    try {
      await api.post(`/projects/${activeProject.id}/cors`, {
        allowed_origin: values.allowed_origin,
        allowed_methods: values.allowed_methods || 'GET,HEAD,OPTIONS',
        allowed_headers: values.allowed_headers || 'Authorization,Content-Type',
        allow_credentials: Boolean(values.allow_credentials),
        max_age_seconds: 3600,
        is_active: true,
      });
      message.success(`Regra CORS adicionada para ${values.allowed_origin}`);
      form.resetFields();
      await loadRules();
    } catch (err: any) {
      message.error(extractErrorMessage(err, 'Falha ao adicionar regra CORS'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncCorsWithOpsBase = async () => {
    if (!activeProject) return;
    setSyncingOpsBaseCors(true);
    try {
      await api.post(`/projects/${activeProject.id}/opsbase/cors-sync`, {
        custom_domain: activeProject.custom_domain || null,
      });
      message.success('Origens CORS alinhadas com o OpsPages e o OpsBase!');
      await loadRules();
    } catch (err: any) {
      message.error(extractErrorMessage(err, 'Falha ao alinhar origens CORS com o OpsBase'));
    } finally {
      setSyncingOpsBaseCors(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!activeProject) return;
    try {
      await api.delete(`/projects/${activeProject.id}/cors/${ruleId}`);
      message.success('Regra CORS removida');
      await loadRules();
    } catch (err: any) {
      message.error(extractErrorMessage(err, 'Falha ao remover regra CORS'));
    }
  };

  if (!activeProject) return null;

  const filteredRules = rules.filter((r) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      String(r.allowed_origin || r.origin || '')
        .toLowerCase()
        .includes(term) ||
      String(r.allowed_methods || '')
        .toLowerCase()
        .includes(term) ||
      String(r.allowed_headers || '')
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <div className="opspages-page">
      <Card className="border-theme">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold m-0 flex items-center gap-2">
              <GlobalOutlined className="text-[#FF774A]" />
              CORS & Headers para Páginas Estáticas (Validação Estrita • P-9)
            </h3>
            <p className="text-xs text-slate-400 m-0 mt-1.5">
              Configure domínios exatos autorizados (com <code>Vary: Origin</code>) para consumir assets de{' '}
              <span className="font-mono text-[#FF774A]">/pages/{activeProject.slug}/</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar origem, método ou header..."
              className="w-64"
              allowClear
            />
            <Tooltip title="Alinha automaticamente as origens do projeto (incluindo domínio próprio) no OpsPages e no OpsBase">
              <Button
                icon={<SyncOutlined spin={syncingOpsBaseCors} />}
                onClick={handleSyncCorsWithOpsBase}
                loading={syncingOpsBaseCors}
              >
                Alinhar CORS (OpsBase)
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined spin={loading} />} onClick={loadRules}>
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={
          <span className="text-sm font-bold flex items-center gap-2">
            <PlusOutlined className="text-[#FF774A]" />
            Nova Origem Permitida (CORS)
          </span>
        }
        extra={
          <span className="text-xs text-slate-400">
            Apenas <code>http://</code> ou <code>https://</code> sem curingas no host nem path. <code>*</code> não permite Credentials.
          </span>
        }
        className="border-theme"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            allowed_origin: 'https://app.loft.com.br',
            allowed_methods: 'GET,HEAD,OPTIONS',
            allowed_headers: 'Authorization,Content-Type',
            allow_credentials: false,
          }}
          onFinish={handleAddRule}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-4">
              <Form.Item
                name="allowed_origin"
                label="Allowed Origin (Correspondência Exata ou *)"
                rules={[{ required: true, message: 'Informe a origem permitida' }]}
                className="mb-0"
              >
                <Input placeholder="https://app.loft.com.br ou *" className="font-mono text-xs" />
              </Form.Item>
            </div>

            <div className="lg:col-span-3">
              <Form.Item name="allowed_methods" label="Allowed Methods" className="mb-0">
                <Input placeholder="GET,HEAD,OPTIONS" className="font-mono text-xs" />
              </Form.Item>
            </div>

            <div className="lg:col-span-3">
              <Form.Item name="allowed_headers" label="Allowed Headers" className="mb-0">
                <Input placeholder="Authorization,Content-Type" className="font-mono text-xs" />
              </Form.Item>
            </div>

            <div className="lg:col-span-2 flex flex-col justify-between">
              <Form.Item
                name="allow_credentials"
                label="Credentials"
                valuePropName="checked"
                className="mb-0"
              >
                <Switch checkedChildren="Permitir" unCheckedChildren="Bloquear" />
              </Form.Item>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <SafetyCertificateOutlined className="text-[#FF774A]" />
              Respostas incluem automaticamente <code>Vary: Origin</code> quando a origem bate com uma regra ativa.
            </span>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>
              Adicionar Regra CORS
            </Button>
          </div>
        </Form>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <GlobalOutlined className="text-[#FF774A]" />
            <span className="text-sm font-bold">Regras Ativas do Projeto ({filteredRules.length})</span>
          </div>
        }
        extra={
          <div className="flex items-center gap-2">
            <Tag color="geekblue" className="font-mono text-xs m-0">
              Vary: Origin
            </Tag>
            <Tag color="green" className="text-xs m-0">
              Validação Exata (P-9)
            </Tag>
          </div>
        }
        className="border-theme"
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredRules}
          scroll={{ x: 860 }}
          pagination={{
            current: page,
            pageSize: Math.max(10, pageSize),
            total: filteredRules.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (tot, range) => `${range[0]}-${range[1]} de ${tot} regras`,
            onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
          }}
          locale={{
            emptyText: <Empty description="Nenhuma regra CORS customizada cadastrada para este projeto." />,
          }}
          columns={[
            {
              title: 'Origin (Domínio Permitido)',
              dataIndex: 'allowed_origin',
              width: 270,
              render: (val: string, row: any) => {
                const originStr = String(val || row.origin || '').trim();
                const isHttps = originStr.startsWith('https://');
                const isLocal =
                  originStr.includes('localhost') || originStr.includes('127.0.0.1');
                const isWildcard = originStr === '*';

                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      {isHttps ? (
                        <LockOutlined className="text-emerald-500 text-xs shrink-0" />
                      ) : (
                        <GlobalOutlined className="text-[#FF774A] text-xs shrink-0" />
                      )}
                      <span className="font-mono font-semibold text-xs text-[#FF774A] whitespace-nowrap">
                        {originStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isWildcard ? (
                        <Tag color="gold" className="text-[10px] leading-4 px-1.5 py-0 m-0">
                          Público (*)
                        </Tag>
                      ) : isLocal ? (
                        <Tag color="default" className="text-[10px] leading-4 px-1.5 py-0 m-0">
                          Ambiente Local
                        </Tag>
                      ) : (
                        <Tag color="cyan" className="text-[10px] leading-4 px-1.5 py-0 m-0">
                          Domínio Externo / Custom
                        </Tag>
                      )}
                      <span className="font-mono text-[11px] text-slate-400">
                        max-age={row.max_age_seconds || 3600}s
                      </span>
                    </div>
                  </div>
                );
              },
            },
            {
              title: 'Métodos HTTP',
              dataIndex: 'allowed_methods',
              width: 200,
              render: (val: string) => {
                const methods = String(val || 'GET,HEAD,OPTIONS')
                  .split(',')
                  .map((m) => m.trim().toUpperCase())
                  .filter(Boolean);
                return (
                  <div className="flex flex-wrap gap-1">
                    {methods.map((method) => (
                      <Tag
                        key={method}
                        color={METHOD_COLORS[method] || 'default'}
                        className="font-mono text-[11px] font-semibold m-0"
                      >
                        {method}
                      </Tag>
                    ))}
                  </div>
                );
              },
            },
            {
              title: 'Headers Permitidos',
              dataIndex: 'allowed_headers',
              render: (val: string) => {
                const raw = String(val || '*').trim();
                if (raw === '*') {
                  return (
                    <Tag color="gold" className="font-mono text-xs m-0">
                      * (Todos os Headers)
                    </Tag>
                  );
                }
                const headers = raw
                  .split(',')
                  .map((h) => h.trim())
                  .filter(Boolean);
                return (
                  <div className="flex flex-wrap gap-1.5 max-w-xl">
                    {headers.map((header) => (
                      <Tag
                        key={header}
                        className="font-mono text-[11px] m-0 bg-slate-500/10 border-slate-500/30"
                      >
                        {header}
                      </Tag>
                    ))}
                  </div>
                );
              },
            },
            {
              title: 'Credentials',
              dataIndex: 'allow_credentials',
              width: 150,
              render: (val: boolean) =>
                val ? (
                  <Tag color="success" icon={<CheckCircleOutlined />} className="m-0">
                    Permitido (Sim)
                  </Tag>
                ) : (
                  <Tag color="default" className="m-0">
                    Desativado (Não)
                  </Tag>
                ),
            },
            {
              title: 'Status',
              dataIndex: 'is_active',
              width: 110,
              render: (active: boolean) =>
                active !== false ? (
                  <Tag color="green" className="m-0 font-semibold">
                    ATIVA
                  </Tag>
                ) : (
                  <Tag color="default" className="m-0">
                    INATIVA
                  </Tag>
                ),
            },
            {
              title: 'Ações',
              align: 'right',
              width: 120,
              render: (_: any, row: any) => (
                <Popconfirm
                  title="Remover esta regra CORS?"
                  description={`A origem ${row.allowed_origin || row.origin} deixará de ser autorizada.`}
                  onConfirm={() => handleDeleteRule(row.id)}
                  okText="Remover"
                  cancelText="Cancelar"
                >
                  <Button danger size="small" icon={<DeleteOutlined />}>
                    Remover
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
