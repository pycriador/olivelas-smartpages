import React, { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  Alert,
  Dropdown,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import {
  LockOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Layers, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTheme } from '../../theme/CopanThemeProvider';
import { useI18nStore } from '../../i18n/useTranslation';
import { Locale } from '../../i18n/translations';
import { extractErrorMessage } from '../../services/api';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, setShowLogin } = useAuthStore();
  const { theme } = useTheme();
  const { locale, setLocale } = useI18nStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(values.username.trim(), values.password);
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Falha na autenticação. Verifique suas credenciais.'));
    } finally {
      setLoading(false);
    }
  };

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
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: theme.primary,
          colorBgContainer: '#141A1E',
          colorBorder: '#28333B',
          colorText: '#F7FAFC',
          colorTextPlaceholder: '#718096',
          borderRadius: 10,
          controlHeightLG: 46,
        },
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E11] p-4 sm:p-6 lg:p-8 relative overflow-x-hidden selection:bg-[#F56738] selection:text-white box-border">
        {/* Ambient background glow with theme primary */}
        <div
          className="absolute w-[500px] h-[350px] blur-[120px] rounded-full pointer-events-none transition-colors duration-300"
          style={{ backgroundColor: `${theme.primary}25` }}
        />

        <div className="w-full max-w-md mx-auto relative z-10 flex flex-col box-border">
          {/* Top bar: Back button + Language selector */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="flex items-center gap-2 text-xs sm:text-sm text-[#A0AEC0] hover:text-white transition-colors bg-[#141A1E] hover:bg-[#1A2227] px-3.5 py-2 rounded-xl border border-[#22292E] shadow-sm cursor-pointer"
            >
              <ArrowLeftOutlined /> Voltar para Início
            </button>

            <Dropdown menu={{ items: languageMenuItems }} trigger={['click']}>
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-[#A0AEC0] hover:text-white transition-colors bg-[#141A1E] hover:bg-[#1A2227] px-3 py-2 rounded-xl border border-[#22292E] shadow-sm cursor-pointer"
              >
                <GlobalOutlined />
                <span>{getLanguageLabel()}</span>
                <DownOutlined className="text-[10px]" />
              </button>
            </Dropdown>
          </div>

          {/* Brand Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4 transition-colors duration-200"
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 8px 24px ${theme.primary}40`,
              }}
            >
              <Layers className="w-8 h-8 text-white" />
            </div>
            <Title level={2} style={{ color: '#FFFFFF', margin: 0, fontWeight: 700, fontSize: 26 }}>
              AIOps OpsPages
            </Title>
            <Text style={{ color: '#718096', fontSize: 13, marginTop: 4, display: 'block' }}>
              Plataforma de Hospedagem Estática &amp; Git /repos &bull; Loft
            </Text>
          </div>

          {/* Login Card */}
          <Card
            className="shadow-2xl bg-[#141A1E] border border-[#22292E] rounded-3xl"
            style={{ background: '#141A1E', borderRadius: 24, padding: '8px 4px' }}
          >
            <div className="mb-6 px-1">
              <Title level={4} style={{ color: '#FFFFFF', margin: 0, fontWeight: 600 }}>
                Acessar Console
              </Title>
              <Text style={{ color: '#718096', fontSize: 13, marginTop: 2, display: 'block' }}>
                Entre com suas credenciais corporativas para gerenciar projetos e builds
              </Text>
            </div>

            {errorMsg && (
              <Alert
                message={errorMsg}
                type="error"
                showIcon
                className="mb-5 rounded-xl"
                style={{ background: '#2D1B1B', border: '1px solid #CE4242', color: '#F8B4B4' }}
              />
            )}

            <Form
              form={form}
              name="login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
              requiredMark={false}
            >
              <Form.Item
                label={
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Usuário ou E-mail
                  </span>
                }
                name="username"
                rules={[{ required: true, message: 'Informe seu usuário ou e-mail' }]}
                className="mb-4"
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#718096', marginRight: 6 }} />}
                  placeholder="Informe seu e-mail corporativo"
                  className="rounded-xl"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Senha
                  </span>
                }
                name="password"
                rules={[{ required: true, message: 'Informe sua senha' }]}
                className="mb-5"
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#718096', marginRight: 6 }} />}
                  placeholder="Informe sua senha"
                  className="rounded-xl"
                />
              </Form.Item>

              <Form.Item className="mt-6 mb-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    background: theme.primary,
                    borderColor: theme.primary,
                    height: 48,
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: 12,
                    boxShadow: `0 8px 20px ${theme.primary}33`,
                  }}
                >
                  {loading ? 'Autenticando...' : 'Entrar na Plataforma'}
                </Button>
              </Form.Item>
            </Form>

            <div className="mt-5 pt-4 border-t border-[#20272D] flex items-center justify-between text-xs text-[#718096]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#20A483]" />
                Autenticação Segura JWT
              </span>
              <span>Git /repos Multi-Tenant</span>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};
