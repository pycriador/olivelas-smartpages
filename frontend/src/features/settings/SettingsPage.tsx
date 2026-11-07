import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Input,
  Switch,
  Form,
  message,
} from 'antd';
import {
  SettingOutlined,
  CheckCircleFilled,
  BgColorsOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  SaveOutlined,
  DeleteOutlined,
  BranchesOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../theme/CopanThemeProvider';
import { LIGHT_THEMES, DARK_THEMES, ThemePalette } from '../../theme/themes';
import { useI18nStore } from '../../i18n/useTranslation';
import { Locale } from '../../i18n/translations';
import { api } from '../../services/api';
import { useProjectStore } from '../../stores/useProjectStore';

const { Title, Text, Paragraph } = Typography;

export const SettingsPage: React.FC = () => {
  const { currentThemeId, theme, setThemeId } = useTheme();
  const { locale, setLocale } = useI18nStore();
  const { activeProject, fetchProjects } = useProjectStore();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState('');

  useEffect(() => {
    if (!activeProject) return;
    form.setFieldsValue({
      name: activeProject.name || '',
      description: activeProject.description || '',
      spa_mode: Boolean(activeProject.spa_mode),
      auto_approval: Boolean(activeProject.auto_approval),
      is_public: Boolean(activeProject.is_public),
      github_repo_url: activeProject.github_repo_url || '',
      github_branch: activeProject.github_branch || 'main',
      github_subpath: activeProject.github_subpath || `/repos/${activeProject.slug}`,
      custom_domain: activeProject.custom_domain || '',
    });
    setConfirmDeleteSlug('');
  }, [activeProject?.id, form]);

  const handleSave = async (values: any) => {
    if (!activeProject) return;
    setSaving(true);
    try {
      await api.patch(`/projects/${activeProject.id}`, {
        name: values.name,
        description: values.description,
        spa_mode: Boolean(values.spa_mode),
        auto_approval: Boolean(values.auto_approval),
        is_public: Boolean(values.is_public),
        github_repo_url: values.github_repo_url || null,
        github_branch: values.github_branch || 'main',
        github_subpath: values.github_subpath || `/repos/${activeProject.slug}`,
        custom_domain: values.custom_domain || null,
      });
      await fetchProjects(activeProject.id);
      message.success('Configurações do projeto atualizadas com sucesso!');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Falha ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProject || confirmDeleteSlug !== activeProject.slug) return;
    try {
      await api.delete(`/projects/${activeProject.id}`);
      message.success(`Projeto ${activeProject.slug} excluído com sucesso`);
      await fetchProjects();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Falha ao remover projeto');
    }
  };

  const languageOptions: { key: Locale; label: string; flag: string; country: string }[] = [
    { key: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷', country: 'PT-BR' },
    { key: 'en', label: 'English (US)', flag: '🇺🇸', country: 'EN' },
    { key: 'es', label: 'Español (Latam)', flag: '🇪🇸', country: 'ES' },
  ];

  const renderThemeCard = (item: ThemePalette) => {
    const isCurrent = item.id === currentThemeId;

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
        <div
          onClick={() => setThemeId(item.id)}
          className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border-2 relative flex flex-col justify-between h-full ${
            isCurrent
              ? 'ring-2 ring-offset-2 shadow-md'
              : 'hover:shadow-md hover:border-gray-400'
          }`}
          style={{
            borderColor: isCurrent ? item.primary : item.colorBorder,
            backgroundColor: item.bgContainer,
            color: item.colorText,
          }}
        >
          {isCurrent && (
            <div className="absolute top-3 right-3">
              <Tag color={item.primary} className="font-semibold flex items-center gap-1 m-0">
                <CheckCircleFilled /> Ativo
              </Tag>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2 pr-20">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: item.primary }}
              />
              <span className="font-semibold text-sm truncate" style={{ color: item.colorText }}>
                {item.name}
              </span>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2 my-3 p-2 rounded-lg bg-black/5">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                  style={{ backgroundColor: item.primary }}
                  title="Primary Color"
                />
                <span className="text-[10px] text-gray-400 font-mono">Prim</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                  style={{ backgroundColor: item.bgSidebar }}
                  title="Sidebar Color"
                />
                <span className="text-[10px] text-gray-400 font-mono">Side</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                  style={{ backgroundColor: item.bgContainer }}
                  title="Container Color"
                />
                <span className="text-[10px] text-gray-400 font-mono">Card</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                  style={{ backgroundColor: item.bgLayout }}
                  title="Layout Color"
                />
                <span className="text-[10px] text-gray-400 font-mono">Fundo</span>
              </div>
            </div>
          </div>

          <Button
            size="small"
            type={isCurrent ? 'primary' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              setThemeId(item.id);
            }}
            style={{
              background: isCurrent ? item.primary : undefined,
              borderColor: isCurrent ? item.primary : undefined,
            }}
            className="w-full mt-2"
          >
            {isCurrent ? 'Ativo' : 'Ativar Tema'}
          </Button>
        </div>
      </Col>
    );
  };

  return (
    <div className="opspages-page">
      {/* Header Banner */}
      <Card
        variant="borderless"
        className="shadow-xs border"
        style={{ borderColor: theme.colorBorder, backgroundColor: theme.bgContainer }}
      >
        <Title level={4} className="flex items-center gap-2 mb-1!" style={{ margin: 0 }}>
          <SettingOutlined style={{ color: theme.primary }} />
          <span>Configurações da Plataforma & Projeto</span>
        </Title>
        <Text type="secondary" className="text-xs sm:text-sm block mt-1.5">
          Personalize temas visuais (10 Light & 10 Dark), idioma da interface e parâmetros de deploy do projeto ativo.
        </Text>
      </Card>

      {/* Project Configuration Section */}
      {activeProject && (
        <Card
          variant="borderless"
          className="shadow-xs border"
          style={{ borderColor: theme.colorBorder, backgroundColor: theme.bgContainer }}
          title={
            <div className="flex items-center gap-2">
              <BranchesOutlined style={{ color: theme.primary }} />
              <span>Configurações do Projeto Ativo: {activeProject.name}</span>
              <Tag color={theme.primary} className="font-mono text-xs m-0">
                /repos/{activeProject.slug}
              </Tag>
            </div>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Row gutter={20}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="Nome de Exibição"
                  rules={[{ required: true, message: 'Informe o nome do projeto' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={`Slug Imutável (Rota /pages/${activeProject.slug}/)`}>
                  <Input value={activeProject.slug} disabled className="font-mono" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Descrição">
              <Input.TextArea rows={2} />
            </Form.Item>

            <Row gutter={20}>
              <Col xs={24} md={12}>
                <Form.Item name="github_repo_url" label="GitHub Repository URL">
                  <Input
                    placeholder="https://github.com/pycriador/olivelas-smartpages.git"
                    className="font-mono text-xs"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item name="github_branch" label="Branch Principal">
                  <Input className="font-mono text-xs" />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item name="github_subpath" label="Caminho em /repos">
                  <Input className="font-mono text-xs" />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item name="custom_domain" label="Domínio Customizado">
                  <Input placeholder="pages.olivelas.com.br" className="font-mono text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[20, 20]}>
              <Col xs={24} md={8}>
                <div
                  className="p-4 rounded-xl border flex items-start justify-between gap-3 h-full"
                  style={{ borderColor: theme.colorBorder }}
                >
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <SafetyCertificateOutlined style={{ color: '#24B47E' }} />
                      Aprovação Automática
                    </div>
                    <Text type="secondary" className="text-xs block mt-1">
                      Novas builds entram em produção automaticamente quando não há Lock ativo.
                    </Text>
                  </div>
                  <Form.Item name="auto_approval" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div
                  className="p-4 rounded-xl border flex items-start justify-between gap-3 h-full"
                  style={{ borderColor: theme.colorBorder }}
                >
                  <div>
                    <div className="text-xs font-bold">SPA Fallback (React / Vite / Vue)</div>
                    <Text type="secondary" className="text-xs block mt-1">
                      Redireciona rotas internas não encontradas para o index.html da versão ativa.
                    </Text>
                  </div>
                  <Form.Item name="spa_mode" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div
                  className="p-4 rounded-xl border flex items-start justify-between gap-3 h-full"
                  style={{ borderColor: theme.colorBorder }}
                >
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <LockOutlined style={{ color: theme.primary }} />
                      Página Pública (/pages/{activeProject.slug}/)
                    </div>
                    <Text type="secondary" className="text-xs block mt-1">
                      Permite visualização direta da build estática no navegador sem autenticação.
                    </Text>
                  </div>
                  <Form.Item name="is_public" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Col>
            </Row>

            <div className="flex justify-end pt-5">
              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                Salvar Configurações do Projeto
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Language Section */}
      <Card
        variant="borderless"
        className="shadow-xs border"
        style={{ borderColor: theme.colorBorder, backgroundColor: theme.bgContainer }}
        title={
          <div className="flex items-center gap-2">
            <GlobalOutlined style={{ color: theme.primary }} />
            <span>Idioma e Região (Internacionalização)</span>
          </div>
        }
      >
        <Paragraph type="secondary" className="text-xs sm:text-sm mb-4">
          Selecione o idioma preferido para menus, botões, tabelas e mensagens do sistema.
        </Paragraph>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {languageOptions.map((opt) => {
            const isSelected = locale === opt.key;
            return (
              <div
                key={opt.key}
                onClick={() => setLocale(opt.key)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  isSelected ? 'shadow-xs ring-1 ring-offset-1' : 'hover:border-gray-400'
                }`}
                style={{
                  borderColor: isSelected ? theme.primary : theme.colorBorder,
                  backgroundColor: isSelected ? `${theme.primary}10` : theme.bgContainer,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.flag}</span>
                  <div>
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-400 font-mono">{opt.country}</div>
                  </div>
                </div>
                {isSelected && <CheckCircleFilled style={{ color: theme.primary, fontSize: 18 }} />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Themes Section */}
      <Card
        variant="borderless"
        className="shadow-xs border"
        style={{ borderColor: theme.colorBorder, backgroundColor: theme.bgContainer }}
        title={
          <div className="flex items-center gap-2">
            <BgColorsOutlined style={{ color: theme.primary }} />
            <span>Temas da Interface (10 Claros & 10 Escuros)</span>
          </div>
        }
      >
        <Paragraph type="secondary" className="text-xs sm:text-sm mb-4">
          Escolha o tema visual que melhor se adapta ao seu fluxo de trabalho. A preferência é salva automaticamente.
        </Paragraph>

        <Tabs
          defaultActiveKey={theme.type === 'dark' ? 'dark' : 'light'}
          items={[
            {
              key: 'light',
              label: <span className="font-medium text-sm">☀️ Temas Claros (10)</span>,
              children: (
                <Row gutter={[16, 16]} className="pt-2">
                  {LIGHT_THEMES.map(renderThemeCard)}
                </Row>
              ),
            },
            {
              key: 'dark',
              label: <span className="font-medium text-sm">🌙 Temas Escuros (10)</span>,
              children: (
                <Row gutter={[16, 16]} className="pt-2">
                  {DARK_THEMES.map(renderThemeCard)}
                </Row>
              ),
            },
          ]}
        />
      </Card>

      {/* Live Preview Card */}
      <Card
        variant="borderless"
        className="shadow-xs border"
        style={{ borderColor: theme.colorBorder, backgroundColor: theme.bgContainer }}
        title={
          <div className="flex items-center gap-2">
            <ThunderboltOutlined style={{ color: theme.primary }} />
            <span>Pré-visualização de Componentes</span>
            <Tag color={theme.primary} className="ml-2 font-mono text-xs">
              {theme.name}
            </Tag>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button type="primary" style={{ background: theme.primary, borderColor: theme.primary }}>
            Botão Primário
          </Button>
          <Button>Botão Secundário</Button>
          <Tag color="success">SUCCESS</Tag>
          <Tag color={theme.primary}>Tag de Exemplo</Tag>
          <Switch defaultChecked />
          <div className="w-full sm:w-64">
            <Input prefix={<SearchOutlined />} placeholder="Testar campo de busca..." />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      {activeProject && (
        <Card
          variant="borderless"
          className="shadow-xs border"
          style={{ borderColor: '#FCA5A5', backgroundColor: theme.bgContainer }}
          title={
            <div className="flex items-center gap-2 text-red-500">
              <DeleteOutlined />
              <span>Zona de Perigo — Excluir Projeto (/repos/{activeProject.slug})</span>
            </div>
          }
        >
          <Paragraph type="secondary" className="text-xs sm:text-sm mb-3">
            Esta ação removerá o projeto, todos os deployments e o diretório versionado em{' '}
            <Text code>/repos/{activeProject.slug}</Text>.
          </Paragraph>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={confirmDeleteSlug}
              onChange={(e) => setConfirmDeleteSlug(e.target.value)}
              placeholder={`Digite "${activeProject.slug}" para confirmar`}
              className="font-mono text-xs max-w-xs"
            />
            <Button
              danger
              type="primary"
              disabled={confirmDeleteSlug !== activeProject.slug}
              onClick={handleDeleteProject}
              icon={<DeleteOutlined />}
            >
              Excluir Projeto Permanentemente
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
