import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  Alert,
  Dropdown,
  ConfigProvider,
  Segmented,
  Tag,
  message,
  theme as antdTheme,
} from 'antd';
import {
  LockOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  GlobalOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { Layers, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTheme } from '../../theme/CopanThemeProvider';
import { useI18nStore } from '../../i18n/useTranslation';
import { Locale } from '../../i18n/translations';
import { extractErrorMessage, SUPABASE_SCHEMA } from '../../services/api';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    login,
    register,
    setShowLogin,
    bootstrapStatus,
    fetchBootstrapStatus,
  } = useAuthStore();
  const { theme } = useTheme();
  const { locale, setLocale } = useI18nStore();

  useEffect(() => {
    fetchBootstrapStatus().then((status) => {
      if (status && status.next_user_will_be_global_admin) {
        setMode('register');
      }
    });
  }, []);

  const isFirstUserGlobalAdmin = Boolean(
    bootstrapStatus?.next_user_will_be_global_admin
  );

  const onLoginFinish = async (values: { username: string; password: string }) => {
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

  const onRegisterFinish = async (values: {
    full_name: string;
    email: string;
    username?: string;
    password: string;
  }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await register({
        email: values.email.trim().toLowerCase(),
        full_name: values.full_name.trim(),
        username: values.username?.trim().toLowerCase(),
        password: values.password,
      });
      if (result.is_first_user_global_admin) {
        message.success(
          'Primeiro cadastro realizado! Sua conta foi promovida automaticamente a Global Admin.'
        );
      } else {
        message.success('Conta criada e autenticada com sucesso!');
      }
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Não foi possível concluir o cadastro.'));
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
        <div
          className="absolute w-[500px] h-[350px] blur-[120px] rounded-full pointer-events-none transition-colors duration-300"
          style={{ backgroundColor: `${theme.primary}25` }}
        />

        <div className="w-full max-w-md mx-auto relative z-10 flex flex-col box-border">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="flex items-center gap-2 text-xs sm:text-sm text-[#A0AEC0] hover:text-white transition-colors bg-[#141A1E] hover:bg-[#1A2227] px-3.5 py-2 rounded-xl border border-[#22292E] shadow-xs cursor-pointer"
            >
              <ArrowLeftOutlined /> Voltar para Início
            </button>

            <Dropdown menu={{ items: languageMenuItems }} trigger={['click']}>
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-[#A0AEC0] hover:text-white transition-colors bg-[#141A1E] hover:bg-[#1A2227] px-3 py-2 rounded-xl border border-[#22292E] shadow-xs cursor-pointer"
              >
                <GlobalOutlined />
                <span>{getLanguageLabel()}</span>
                <DownOutlined className="text-[10px]" />
              </button>
            </Dropdown>
          </div>

          {/* Brand Header */}
          <div className="text-center mb-6">
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
              Olivelas SmartPages
            </Title>
            <Text style={{ color: '#718096', fontSize: 13, marginTop: 4, display: 'block' }}>
              Hospedagem Estática, Versionamento Git &amp; Governança HBAC &bull; Schema{' '}
              <code className="text-slate-300">{SUPABASE_SCHEMA}</code>
            </Text>
          </div>

          {/* Auth Card */}
          <Card
            className="shadow-2xl bg-[#141A1E] border border-[#22292E] rounded-3xl"
            style={{ background: '#141A1E', borderRadius: 24, padding: '8px 4px' }}
          >
            <div className="mb-5">
              <Segmented
                block
                size="large"
                value={mode}
                onChange={(val) => {
                  setErrorMsg(null);
                  setMode(val as 'login' | 'register');
                }}
                options={[
                  { label: 'Entrar na Plataforma', value: 'login' },
                  {
                    label: isFirstUserGlobalAdmin
                      ? '★ 1º Cadastro (Global Admin)'
                      : 'Criar Conta',
                    value: 'register',
                  },
                ]}
              />
            </div>

            {isFirstUserGlobalAdmin && (
              <Alert
                icon={<CrownOutlined />}
                message="Primeiro Cadastro da Plataforma = Global Admin"
                description="Ainda não há usuários cadastrados no schema isolado smartpages. O primeiro usuário registrado receberá automaticamente privilégios de Global Admin (Platform Admins)."
                type="warning"
                showIcon
                className="mb-5 rounded-xl"
              />
            )}

            {errorMsg && (
              <Alert
                message={errorMsg}
                type="error"
                showIcon
                className="mb-5 rounded-xl"
                style={{ background: '#2D1B1B', border: '1px solid #CE4242', color: '#F8B4B4' }}
              />
            )}

            {mode === 'login' ? (
              <Form
                form={loginForm}
                name="login"
                layout="vertical"
                onFinish={onLoginFinish}
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
                    placeholder="Informe seu e-mail ou username"
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
            ) : (
              <Form
                form={registerForm}
                name="register"
                layout="vertical"
                onFinish={onRegisterFinish}
                autoComplete="off"
                size="large"
                requiredMark={false}
              >
                <div className="mb-3 flex items-center justify-between">
                  <Text className="text-xs text-slate-400">
                    {isFirstUserGlobalAdmin
                      ? 'Configure o Administrador Global inicial da plataforma:'
                      : 'Preencha seus dados para criar uma conta:'}
                  </Text>
                  {isFirstUserGlobalAdmin && <Tag color="gold">GLOBAL ADMIN ★</Tag>}
                </div>

                <Form.Item
                  label={
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Nome Completo
                    </span>
                  }
                  name="full_name"
                  rules={[{ required: true, message: 'Informe seu nome completo' }]}
                  className="mb-3"
                >
                  <Input
                    prefix={<IdcardOutlined style={{ color: '#718096', marginRight: 6 }} />}
                    placeholder="Ex: Willian Jesus"
                    className="rounded-xl"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      E-mail
                    </span>
                  }
                  name="email"
                  rules={[
                    { required: true, message: 'Informe seu e-mail' },
                    { type: 'email', message: 'Informe um e-mail válido' },
                  ]}
                  className="mb-3"
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#718096', marginRight: 6 }} />}
                    placeholder="seu.email@empresa.com"
                    className="rounded-xl"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Senha (mín. 6 caracteres)
                    </span>
                  }
                  name="password"
                  rules={[
                    { required: true, message: 'Crie uma senha de acesso' },
                    { min: 6, message: 'A senha deve possuir no mínimo 6 caracteres' },
                  ]}
                  className="mb-5"
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#718096', marginRight: 6 }} />}
                    placeholder="Crie uma senha forte"
                    className="rounded-xl"
                  />
                </Form.Item>

                <Form.Item className="mt-5 mb-3">
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
                    {loading
                      ? 'Cadastrando...'
                      : isFirstUserGlobalAdmin
                        ? 'Cadastrar Global Admin e Acessar'
                        : 'Criar Conta e Acessar'}
                  </Button>
                </Form.Item>
              </Form>
            )}

            <div className="mt-5 pt-4 border-t border-[#20272D] flex items-center justify-between text-xs text-[#718096]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#20A483]" />
                Supabase Schema: {SUPABASE_SCHEMA}
              </span>
              <span>HBAC Multi-Tenant</span>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};
