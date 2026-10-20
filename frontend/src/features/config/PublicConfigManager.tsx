import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Button,
  Tag,
  Alert,
  Select,
  InputNumber,
  message,
  Tooltip,
} from 'antd';
import {
  ApiOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  ReloadOutlined,
  CopyOutlined,
  KeyOutlined,
  ThunderboltOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { api, extractErrorMessage } from '../../services/api';
import { useProjectStore } from '../../stores/useProjectStore';

export interface PublicConfigItem {
  id: number;
  project_id: number;
  project_slug: string;
  environment: 'production' | 'staging' | 'development' | 'preview';
  opsbase_url: string;
  opsbase_public_key: string;
  opsbase_project_slug: string;
  scopes: string;
  public_vars: Record<string, any>;
  inject_in_html: boolean;
  is_active: boolean;
  env_script_url: string;
  public_api_url: string;
  updated_by_email?: string | null;
  updated_at?: string | null;
}

export const PublicConfigManager: React.FC = () => {
  const { activeProject, fetchProjects } = useProjectStore();
  const [configs, setConfigs] = useState<PublicConfigItem[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string>('production');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingHeaders, setSavingHeaders] = useState(false);

  const [envForm] = Form.useForm();
  const [headersForm] = Form.useForm();

  const loadConfigs = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<PublicConfigItem[]>(`/projects/${activeProject.id}/public-config`);
      const list = res.data || [];
      setConfigs(list);
      const current = list.find((c) => c.environment === selectedEnv) || list[0];
      if (current) {
        envForm.setFieldsValue({
          opsbase_url: current.opsbase_url,
          opsbase_public_key: current.opsbase_public_key,
          opsbase_project_slug: current.opsbase_project_slug,
          scopes: current.scopes,
          inject_in_html: current.inject_in_html,
          is_active: current.is_active,
          public_vars_json: JSON.stringify(current.public_vars || {}, null, 2),
        });
      }
    } catch (err) {
      message.error(extractErrorMessage(err, 'Falha ao carregar configurações públicas.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadConfigs();
      headersForm.setFieldsValue({
        custom_domain: activeProject.custom_domain || '',
        html_cache_control:
          activeProject.html_cache_control || 'no-cache, max-age=0, must-revalidate',
        hashed_asset_cache_control:
          activeProject.hashed_asset_cache_control || 'public, max-age=31536000, immutable',
        asset_cache_control: activeProject.asset_cache_control || 'public, max-age=3600',
        csp_policy:
          activeProject.csp_policy ||
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http:; font-src 'self' data: https://fonts.gstatic.com https:; connect-src 'self' http://localhost:* http://127.0.0.1:* https: ws: wss:; frame-ancestors 'self';",
        x_frame_options: activeProject.x_frame_options || 'SAMEORIGIN',
        referrer_policy:
          activeProject.referrer_policy || 'strict-origin-when-cross-origin',
        hsts_max_age: activeProject.hsts_max_age ?? 31536000,
        nosniff_enabled: activeProject.nosniff_enabled ?? true,
        permissions_policy:
          activeProject.permissions_policy ||
          'camera=(), microphone=(), geolocation=(), payment=()',
      });
    }
  }, [activeProject?.id, selectedEnv]);

  const handleSavePublicConfig = async (rotateKey = false) => {
    if (!activeProject) return;
    try {
      const values = await envForm.validateFields();
      let parsedVars: Record<string, any> = {};
      if (values.public_vars_json) {
        try {
          parsedVars = JSON.parse(values.public_vars_json);
        } catch {
          message.error('O JSON de variáveis públicas adicionais é inválido.');
          return;
        }
      }
      setSaving(true);
      await api.put(`/projects/${activeProject.id}/public-config/${selectedEnv}`, {
        environment: selectedEnv,
        opsbase_url: values.opsbase_url,
        opsbase_public_key: values.opsbase_public_key,
        opsbase_project_slug: values.opsbase_project_slug,
        scopes: values.scopes,
        public_vars: parsedVars,
        inject_in_html: values.inject_in_html,
        is_active: values.is_active,
        rotate_public_key: rotateKey,
      });
      message.success(
        rotateKey
          ? `Nova chave pública Opsbase gerada para ${selectedEnv.toUpperCase()}!`
          : `Configuração pública (${selectedEnv.toUpperCase()}) salva com sucesso!`
      );
      await loadConfigs();
    } catch (err) {
      message.error(extractErrorMessage(err, 'Erro ao salvar configuração pública.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHeadersAndCache = async () => {
    if (!activeProject) return;
    try {
      const values = await headersForm.validateFields();
      setSavingHeaders(true);
      await api.patch(`/projects/${activeProject.id}`, {
        custom_domain: values.custom_domain || null,
        html_cache_control: values.html_cache_control,
        hashed_asset_cache_control: values.hashed_asset_cache_control,
        asset_cache_control: values.asset_cache_control,
        csp_policy: values.csp_policy || null,
        x_frame_options: values.x_frame_options,
        referrer_policy: values.referrer_policy,
        hsts_max_age: values.hsts_max_age,
        nosniff_enabled: values.nosniff_enabled,
        permissions_policy: values.permissions_policy,
      });
      message.success('Políticas de Cache Diferenciado (P-1) e Headers de Segurança (P-2) atualizadas!');
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Erro ao atualizar políticas de segurança e cache.'));
    } finally {
      setSavingHeaders(false);
    }
  };

  if (!activeProject) {
    return (
      <Card className="border-theme">
        <div className="text-center py-8 text-slate-400">
          Selecione um projeto para gerenciar as Credenciais Públicas (Opsbase) e Políticas de Cache/Segurança.
        </div>
      </Card>
    );
  }

  const currentCfg = configs.find((c) => c.environment === selectedEnv);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ApiOutlined className="text-[#FF774A]" />
            Credenciais Públicas (Opsbase Runtime • P-13) & Segurança/Cache (P-1, P-2)
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Injeção automática de configuração pública por ambiente (<code>window.__OPSPAGES_CONFIG__</code> e{' '}
            <code>/pages/{activeProject.slug}/env-config.js</code>) sem gravar chaves sensíveis no bundle estático.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<CodeOutlined />}
            href={`/pages/${activeProject.slug}/env-config.js`}
            target="_blank"
          >
            Ver env-config.js
          </Button>
          <Button icon={<ReloadOutlined spin={loading} />} onClick={loadConfigs}>
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs
        defaultActiveKey="public-config"
        items={[
          {
            key: 'public-config',
            label: (
              <span className="flex items-center gap-1.5">
                <KeyOutlined />
                Credenciais Públicas & Integração Opsbase (P-13)
              </span>
            ),
            children: (
              <div className="space-y-4">
                <Alert
                  type="info"
                  showIcon
                  message="Como funciona a injeção de configuração pública no AIOps OpsPages (P-13)"
                  description={
                    <div className="text-xs space-y-1 mt-1">
                      <div>
                        1. O OpsPages injeta automaticamente{' '}
                        <code>&lt;script id="opspages-runtime-config"&gt;</code> no{' '}
                        <code>index.html</code> definindo <code>window.__OPSPAGES_CONFIG__</code> e{' '}
                        <code>window.__OPSBASE_CONFIG__</code>.
                      </div>
                      <div>
                        2. Também disponibiliza o script virtual{' '}
                        <code>/pages/{activeProject.slug}/env-config.js?env={selectedEnv}</code> e o endpoint JSON{' '}
                        <code>/api/v1/public/projects/{activeProject.slug}/config?env={selectedEnv}</code>.
                      </div>
                    </div>
                  }
                />

                <Card className="border-theme">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-slate-400">
                        Ambiente Selecionado:
                      </span>
                      {(['production', 'staging', 'development', 'preview'] as const).map((env) => (
                        <Button
                          key={env}
                          size="small"
                          type={selectedEnv === env ? 'primary' : 'default'}
                          onClick={() => setSelectedEnv(env)}
                        >
                          {env.toUpperCase()}
                        </Button>
                      ))}
                    </div>

                    {currentCfg && (
                      <div className="flex items-center gap-2">
                        <Tag color="green">Ativo</Tag>
                        <Tooltip title="Rotacionar chave pública com escopo deste ambiente">
                          <Button
                            size="small"
                            icon={<KeyOutlined />}
                            onClick={() => handleSavePublicConfig(true)}
                            loading={saving}
                          >
                            Rotacionar Chave Pública
                          </Button>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  <Form form={envForm} layout="vertical">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        label="URL do AIOps Opsbase (por Ambiente)"
                        name="opsbase_url"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="http://localhost:8000" />
                      </Form.Item>

                      <Form.Item
                        label="Slug do Projeto no Opsbase"
                        name="opsbase_project_slug"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder={activeProject.slug} />
                      </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        label="Chave Pública com Escopo (Opsbase Public Key)"
                        name="opsbase_public_key"
                      >
                        <Input
                          className="font-mono text-xs"
                          suffix={
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                const val = envForm.getFieldValue('opsbase_public_key');
                                if (val) {
                                  navigator.clipboard.writeText(val);
                                  message.success('Chave pública copiada!');
                                }
                              }}
                            />
                          }
                        />
                      </Form.Item>

                      <Form.Item
                        label="Escopos Públicos Permitidos (Separados por vírgula)"
                        name="scopes"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="public:read,data:query,realtime:subscribe" />
                      </Form.Item>
                    </div>

                    <Form.Item
                      label="Variáveis Públicas Adicionais (JSON injetado em window.__OPSPAGES_CONFIG__.env)"
                      name="public_vars_json"
                    >
                      <Input.TextArea rows={5} className="font-mono text-xs" />
                    </Form.Item>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-6">
                        <Form.Item
                          name="inject_in_html"
                          valuePropName="checked"
                          className="mb-0"
                        >
                          <Switch checkedChildren="Injetar no HTML" unCheckedChildren="Apenas via env-config.js" />
                        </Form.Item>

                        <Form.Item name="is_active" valuePropName="checked" className="mb-0">
                          <Switch checkedChildren="Ambiente Ativo" unCheckedChildren="Inativo" />
                        </Form.Item>
                      </div>

                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={() => handleSavePublicConfig(false)}
                      >
                        Salvar Configuração ({selectedEnv.toUpperCase()})
                      </Button>
                    </div>
                  </Form>
                </Card>
              </div>
            ),
          },
          {
            key: 'security-cache',
            label: (
              <span className="flex items-center gap-1.5">
                <SafetyCertificateOutlined />
                Cache Diferenciado (P-1) & Security Headers (P-2)
              </span>
            ),
            children: (
              <Card className="border-theme">
                <Form form={headersForm} layout="vertical">
                  <div className="mb-4 font-semibold text-sm text-[#FF774A] flex items-center gap-2">
                    <ThunderboltOutlined />
                    Políticas de Cache-Control Diferenciadas por Tipo de Arquivo (P-1 & P-3)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                      label="Cache-Control para HTML & env-config.js"
                      name="html_cache_control"
                      extra="Evita que o navegador retenha index.html antigo após deploy ou rollback."
                    >
                      <Input className="font-mono text-xs" />
                    </Form.Item>
                    <Form.Item
                      label="Cache-Control para Assets com Hash (/assets/*)"
                      name="hashed_asset_cache_control"
                      extra="Assets imutáveis gerados pelo Vite/Webpack com hash no nome."
                    >
                      <Input className="font-mono text-xs" />
                    </Form.Item>
                    <Form.Item
                      label="Cache-Control para Demais Arquivos Estáticos"
                      name="asset_cache_control"
                      extra="Imagens, fontes ou ícones sem hash no nome."
                    >
                      <Input className="font-mono text-xs" />
                    </Form.Item>
                  </div>

                  <div className="my-4 pt-4 border-t border-white/10 font-semibold text-sm text-[#FF774A] flex items-center gap-2">
                    <SafetyCertificateOutlined />
                    Headers de Segurança HTTP Configuráveis por Projeto (P-2 & P-9)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                      label="Domínio Próprio do Projeto (Custom Domain • P-9)"
                      name="custom_domain"
                    >
                      <Input placeholder="https://app.loft.com.br" />
                    </Form.Item>
                    <Form.Item label="X-Frame-Options" name="x_frame_options">
                      <Select
                        options={[
                          { value: 'SAMEORIGIN', label: 'SAMEORIGIN' },
                          { value: 'DENY', label: 'DENY' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Referrer-Policy" name="referrer_policy">
                      <Select
                        options={[
                          {
                            value: 'strict-origin-when-cross-origin',
                            label: 'strict-origin-when-cross-origin',
                          },
                          { value: 'no-referrer', label: 'no-referrer' },
                          { value: 'same-origin', label: 'same-origin' },
                        ]}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item label="Content-Security-Policy (CSP)" name="csp_policy">
                    <Input.TextArea rows={2} className="font-mono text-xs" />
                  </Form.Item>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <Form.Item label="Strict-Transport-Security (HSTS max-age)" name="hsts_max_age">
                      <InputNumber className="w-full" min={0} max={63072000} />
                    </Form.Item>
                    <Form.Item label="Permissions-Policy" name="permissions_policy">
                      <Input className="font-mono text-xs" />
                    </Form.Item>
                    <Form.Item
                      label="X-Content-Type-Options: nosniff"
                      name="nosniff_enabled"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="nosniff Ativo" unCheckedChildren="Desativado" />
                    </Form.Item>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={savingHeaders}
                      onClick={handleSaveHeadersAndCache}
                    >
                      Salvar Políticas de Cache & Segurança
                    </Button>
                  </div>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};
