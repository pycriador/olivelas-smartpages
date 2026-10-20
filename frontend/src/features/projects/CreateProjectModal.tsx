import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Alert,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  RocketOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { api, extractErrorMessage } from '../../services/api';
import { useProjectStore } from '../../stores/useProjectStore';

const { Paragraph } = Typography;

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const { fetchProjects, setActiveSection } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    id: number;
    name: string;
    slug: string;
    live_url: string;
    repo_disk_path: string;
    initial_deploy_token?: string;
    initial_deploy_token_prefix?: string;
  } | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const slugified = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    form.setFieldsValue({
      slug: slugified,
      github_subpath: slugified ? `/repos/${slugified}` : '/repos',
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await api.post('/projects', {
        ...values,
        seed_initial_build: true,
      });
      setCreatedResult(res.data);
      await fetchProjects(res.data.id);
      message.success(`Projeto '${res.data.name}' criado e inicializado em /repos/${res.data.slug}!`);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Erro ao criar projeto.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatedResult(null);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={680}
      styles={{
        body: {
          maxHeight: 'calc(85vh - 140px)',
          overflowY: 'auto',
          paddingRight: 8,
        },
      }}
      title={
        <div className="flex items-center gap-2">
          <RocketOutlined className="text-[#FF774A]" />
          <span>{createdResult ? 'Projeto Criado com Sucesso!' : 'Novo Projeto de Páginas Estáticas (/repos)'}</span>
        </div>
      }
    >
      {createdResult ? (
        <div className="space-y-4 pt-2">
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={`Repositório Git e Release inicial v1.0.0 provisionados em /repos/${createdResult.slug}`}
            description={
              <div className="text-xs mt-1 space-y-1">
                <div>
                  <strong>URL Live:</strong>{' '}
                  <a
                    href={createdResult.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF774A] underline font-mono"
                  >
                    {createdResult.live_url}
                  </a>
                </div>
                <div>
                  <strong>Diretório físico:</strong>{' '}
                  <code className="font-mono">{createdResult.repo_disk_path}</code>
                </div>
              </div>
            }
          />

          {createdResult.initial_deploy_token && (
            <div className="p-4 rounded-xl bg-[#0B131E] border border-[#223147] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FF774A] uppercase tracking-wider">
                  Token de Deploy CI/CD Inicial (opsp_deploy_)
                </span>
                <Tag color="warning">Copie agora</Tag>
              </div>
              <Paragraph
                copyable={{ text: createdResult.initial_deploy_token }}
                className="mb-0! font-mono text-xs bg-[#131D2B] p-2.5 rounded-sm border border-[#223147] text-emerald-400 break-all"
              >
                {createdResult.initial_deploy_token}
              </Paragraph>
              <div className="text-[11px] text-slate-400">
                Use este token no header <code>X-API-Key</code> em pipelines GitHub Actions ou CLI para subir novas builds automaticamente.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              onClick={() => {
                handleClose();
                setActiveSection('deployments');
              }}
            >
              Ir para Builds & Releases
            </Button>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={() => {
                window.open(createdResult.live_url, '_blank');
                handleClose();
              }}
            >
              Abrir Página Publicada (v1.0.0)
            </Button>
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            framework: 'react-vite',
            entry_file: 'index.html',
            spa_mode: true,
            is_public: true,
            auto_approval: true,
            github_branch: 'main',
            github_subpath: '/repos',
            auto_sync_github: false,
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Nome do Projeto"
              rules={[{ required: true, message: 'Informe o nome do projeto' }]}
            >
              <Input placeholder="Ex: Loft Design System" onChange={handleNameChange} />
            </Form.Item>

            <Form.Item
              name="slug"
              label="Slug (Subpath da URL e pasta em /repos)"
              rules={[
                { required: true, message: 'Informe o slug' },
                { pattern: /^[a-z0-9][a-z0-9-_]*[a-z0-9]$/, message: 'Use apenas letras minúsculas, números e hífens' },
              ]}
            >
              <Input addonBefore="/pages/" placeholder="loft-design-system" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Descrição Técnica">
            <Input.TextArea rows={2} placeholder="Portal estático hospedado no OpsPages com versionamento Git em /repos..." />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item name="framework" label="Framework / Gerador">
              <Select
                options={[
                  { value: 'react-vite', label: 'React + Vite (SPA)' },
                  { value: 'nextjs-static', label: 'Next.js Static Export' },
                  { value: 'vue-vite', label: 'Vue 3 + Vite' },
                  { value: 'astro', label: 'Astro / Docs' },
                  { value: 'angular', label: 'Angular Static' },
                  { value: 'html-static', label: 'HTML5 / CSS / JS Puro' },
                ]}
              />
            </Form.Item>

            <Form.Item name="entry_file" label="Arquivo de Entrada">
              <Input placeholder="index.html" />
            </Form.Item>

            <Form.Item name="custom_domain" label="Domínio Customizado (Opcional)">
              <Input placeholder="pages.internal.loft.com.br" />
            </Form.Item>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B131E] border border-[#223147] mb-4">
            <div className="text-xs font-semibold text-[#FF774A] mb-3 flex items-center gap-1.5">
              <BranchesOutlined /> Configuração Git & Repositório (/repos)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Form.Item name="github_repo_url" label="GitHub Remote URL (Opcional)" className="sm:col-span-2 mb-0!">
                <Input placeholder="https://github.com/loft-br/meu-frontend.git" />
              </Form.Item>
              <Form.Item name="github_branch" label="Branch Padrão" className="mb-0!">
                <Input placeholder="main" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Form.Item name="github_subpath" label="Pasta no Repositório (/repos)" className="mb-0!">
                <Input placeholder="/repos/meu-projeto" />
              </Form.Item>
              <Form.Item name="github_token" label="GitHub Personal Access Token (Opcional)" className="mb-0!">
                <Input.Password placeholder="ghp_••••••••••••" />
              </Form.Item>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0B131E] border border-[#223147] mb-5">
            <Form.Item
              name="auto_approval"
              label="Aprovação Automática"
              valuePropName="checked"
              tooltip="Quando ativo, novas builds entram em produção automaticamente (a menos que a versão esteja travada)."
              className="mb-0!"
            >
              <Switch checkedChildren="Automática" unCheckedChildren="Manual" />
            </Form.Item>

            <Form.Item
              name="spa_mode"
              label="SPA Router Fallback"
              valuePropName="checked"
              tooltip="Redireciona rotas profundas (ex: /dashboard/users) para index.html."
              className="mb-0!"
            >
              <Switch checkedChildren="SPA Ativo" unCheckedChildren="Estático" />
            </Form.Item>

            <Form.Item
              name="auto_sync_github"
              label="Auto-Sync GitHub"
              valuePropName="checked"
              className="mb-0!"
            >
              <Switch checkedChildren="Ativo" unCheckedChildren="Manual" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<RocketOutlined />}>
              Criar Projeto & Gerar v1.0.0
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};
