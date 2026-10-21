import React, { useEffect, useState } from 'react';
import { Card, Table, Form, Input, Switch, Button, Tag, Popconfirm, Empty, message } from 'antd';
import {
  GlobalOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { api, extractErrorMessage } from '../../services/api';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUrlTableState } from '../../utils/urlState';

export const CorsManager: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { page, pageSize, search, setPage, setSearch } = useUrlTableState({
    defaultPage: 1,
    defaultPageSize: 10,
  });
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      <Card>
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
          <div className="flex items-center gap-2.5">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar origem CORS..."
              className="w-60"
              allowClear
            />
            <Button icon={<ReloadOutlined spin={loading} />} onClick={loadRules}>
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title={
            <span className="text-sm font-bold flex items-center gap-2">
              <PlusOutlined className="text-[#FF774A]" />
              Nova Origem Permitida (CORS)
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
            <Form.Item
              name="allowed_origin"
              label="Allowed Origin (Correspondência Exata ou *)"
              extra="Apenas http:// ou https:// sem curingas no host nem path. '*' não pode usar Credentials."
              rules={[{ required: true, message: 'Informe a origem permitida' }]}
            >
              <Input placeholder="https://app.loft.com.br ou *" className="font-mono text-xs" />
            </Form.Item>

            <Form.Item name="allowed_methods" label="Allowed Methods">
              <Input className="font-mono text-xs" />
            </Form.Item>

            <Form.Item name="allowed_headers" label="Allowed Headers">
              <Input className="font-mono text-xs" />
            </Form.Item>

            <Form.Item
              name="allow_credentials"
              label="Permitir Credentials (Access-Control-Allow-Credentials)"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={submitting} block icon={<PlusOutlined />}>
              Adicionar Regra CORS
            </Button>
          </Form>
        </Card>

        <Card
          title={<span className="text-sm font-bold">Regras Ativas do Projeto ({filteredRules.length})</span>}
          className="lg:col-span-2 border-theme"
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filteredRules}
            pagination={{
              current: page,
              pageSize: Math.max(10, pageSize),
              total: filteredRules.length,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
            }}
            locale={{
              emptyText: <Empty description="Nenhuma regra CORS customizada cadastrada para este projeto." />,
            }}
            columns={[
              {
                title: 'Origin',
                dataIndex: 'allowed_origin',
                render: (val: string, row: any) => (
                  <span className="font-mono font-semibold text-[#FF774A]">{val || row.origin}</span>
                ),
              },
              {
                title: 'Métodos',
                dataIndex: 'allowed_methods',
                render: (val: string) => <Tag className="font-mono">{val}</Tag>,
              },
              {
                title: 'Headers',
                dataIndex: 'allowed_headers',
                render: (val: string) => <span className="font-mono text-xs text-slate-400">{val}</span>,
              },
              {
                title: 'Credentials',
                dataIndex: 'allow_credentials',
                render: (val: boolean) => (
                  <Tag color={val ? 'green' : 'default'}>{val ? 'Sim' : 'Não'}</Tag>
                ),
              },
              {
                title: 'Ações',
                align: 'right',
                render: (_: any, row: any) => (
                  <Popconfirm
                    title="Remover esta regra CORS?"
                    onConfirm={() => handleDeleteRule(row.id)}
                    okText="Remover"
                    cancelText="Cancelar"
                  >
                    <Button danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};
