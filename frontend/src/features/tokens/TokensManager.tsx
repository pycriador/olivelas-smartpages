import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  Alert,
  Typography,
  message,
} from 'antd';
import {
  KeyOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../../stores/useProjectStore';
import { api, extractErrorMessage } from '../../services/api';
import { useUrlTableState } from '../../utils/urlState';

const { Paragraph } = Typography;

export const TokensManager: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { page, pageSize, search, status, setPage, setSearch, setStatus } = useUrlTableState({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultStatus: 'all',
  });
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadTokens = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get(`/projects/${activeProject.id}/tokens`);
      setTokens(res.data || []);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, [activeProject?.id]);

  const handleCreate = async (values: any) => {
    if (!activeProject) return;
    setCreating(true);
    try {
      const res = await api.post(`/projects/${activeProject.id}/tokens`, values);
      setNewlyCreatedSecret(res.data.raw_secret);
      message.success('Token CI/CD gerado com sucesso!');
      form.resetFields();
      await loadTokens();
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tokenId: number) => {
    if (!activeProject) return;
    try {
      await api.delete(`/projects/${activeProject.id}/tokens/${tokenId}`);
      message.success('Token revogado com sucesso.');
      await loadTokens();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  if (!activeProject) return null;

  const filteredTokens = tokens.filter((t) => {
    if (status === 'active' && !t.is_active) return false;
    if (status === 'revoked' && t.is_active) return false;
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      String(t.name || '')
        .toLowerCase()
        .includes(term) ||
      String(t.key_prefix || t.token_prefix || '')
        .toLowerCase()
        .includes(term) ||
      String(t.token_type || '')
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold m-0 flex items-center gap-2">
              <KeyOutlined className="text-[#FF774A]" />
              Tokens de API & Automação de Deploy CI/CD ({activeProject.slug})
            </h3>
            <p className="text-xs text-slate-400 m-0 mt-1">
              Autentique pipelines GitHub Actions, GitLab CI ou scripts CLI exclusivamente via Header{' '}
              <code>Authorization: Bearer ...</code> ou <code>X-API-Key: opsp_deploy_...</code> (P-8: Tokens na URL são bloqueados)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar token ou prefixo..."
              className="w-56"
              allowClear
            />
            <Select
              value={status}
              onChange={(v) => setStatus(v)}
              className="w-36"
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'active', label: 'Ativos' },
                { value: 'revoked', label: 'Revogados' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setNewlyCreatedSecret(null);
                setModalOpen(true);
              }}
            >
              Novo Token CI/CD
            </Button>
          </div>
        </div>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredTokens}
          pagination={{
            current: page,
            pageSize: Math.max(10, pageSize),
            total: filteredTokens.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
          }}
          columns={[
            {
              title: 'Nome do Token',
              dataIndex: 'name',
              key: 'name',
              render: (name: string) => <span className="font-semibold text-xs">{name}</span>,
            },
            {
              title: 'Prefixo',
              dataIndex: 'key_prefix',
              key: 'key_prefix',
              render: (p: string) => (
                <Tag color="orange" className="font-mono text-xs m-0">
                  {p}_••••••••
                </Tag>
              ),
            },
            {
              title: 'Escopo',
              dataIndex: 'token_type',
              key: 'token_type',
              render: (t: string) => (
                <Tag color={t === 'deploy' ? 'orange' : 'cyan'}>{t.toUpperCase()}</Tag>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'is_active',
              key: 'is_active',
              render: (active: boolean) =>
                active ? <Tag color="success">ATIVO</Tag> : <Tag color="error">REVOGADO</Tag>,
            },
            {
              title: 'Expira em',
              dataIndex: 'expires_at',
              key: 'expires_at',
              render: (d: string | null) =>
                d ? new Date(d).toLocaleDateString('pt-BR') : 'Sem expiração',
            },
            {
              title: 'Ações',
              key: 'actions',
              align: 'right' as const,
              render: (_: any, r: any) =>
                r.is_active ? (
                  <Popconfirm
                    title="Revogar este token de API?"
                    onConfirm={() => handleRevoke(r.id)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Revogar
                    </Button>
                  </Popconfirm>
                ) : null,
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setNewlyCreatedSecret(null);
        }}
        footer={null}
        centered
        styles={{
          body: {
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        title="Gerar Novo Token de Deploy CI/CD"
      >
        {newlyCreatedSecret ? (
          <div className="space-y-4">
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="Token gerado com sucesso! Copie a chave abaixo:"
            />
            <Paragraph
              copyable={{ text: newlyCreatedSecret }}
              className="mb-0! font-mono text-xs p-3 rounded-lg bg-[#0B131E] border border-[#223147] text-emerald-400 break-all"
            >
              {newlyCreatedSecret}
            </Paragraph>
            <div className="flex justify-end">
              <Button type="primary" onClick={() => setModalOpen(false)}>
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            initialValues={{ token_type: 'deploy', expires_in_days: 90 }}
          >
            <Form.Item
              name="name"
              label="Identificação do Token"
              rules={[{ required: true, message: 'Informe um nome' }]}
            >
              <Input placeholder="Ex: GitHub Actions Production Pipeline" />
            </Form.Item>
            <Form.Item name="token_type" label="Escopo do Token">
              <Select
                options={[
                  { value: 'deploy', label: 'Deploy & Release (Editor - pode enviar builds)' },
                  { value: 'preview', label: 'Preview Read-Only (Visualizador)' },
                ]}
              />
            </Form.Item>
            <Form.Item name="expires_in_days" label="Validade (Dias)">
              <InputNumber min={1} max={3650} className="w-full" />
            </Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                Gerar Token
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};
