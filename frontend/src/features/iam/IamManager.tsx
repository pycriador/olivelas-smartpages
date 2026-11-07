import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Popconfirm,
  message,
} from 'antd';
import {
  UserAddOutlined,
  SafetyCertificateOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../../stores/useProjectStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { api, extractErrorMessage } from '../../services/api';
import { useUrlTableState } from '../../utils/urlState';

export const IamManager: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    page,
    pageSize,
    search,
    status: roleFilter,
    extra,
    setPage,
    setSearch,
    setStatus: setRoleFilter,
    setExtra,
    resetFilters,
  } = useUrlTableState({ defaultPageSize: 10, defaultExtra: { tab: 'users' } });

  const activeTab = extra.tab || 'users';

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);

  const [userForm] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [permForm] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [uRes, gRes] = await Promise.all([api.get('/users'), api.get('/groups')]);
      setUsers(uRes.data || []);
      setGroups(gRes.data || []);
      if (activeProject) {
        const pRes = await api.get(`/projects/${activeProject.id}/permissions`);
        setPermissions(pRes.data || []);
      }
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [activeProject?.id]);

  const handleCreateUser = async (values: any) => {
    try {
      await api.post('/users', values);
      message.success(`Usuário '${values.email}' criado com papel ${values.role.toUpperCase()}!`);
      setUserModalOpen(false);
      userForm.resetFields();
      await loadAll();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const handleChangeUserRole = async (userId: number, role: string) => {
    try {
      await api.put(`/users/${userId}`, { role });
      message.success(`Permissão alterada para ${role.toUpperCase()}!`);
      await loadAll();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const handleToggleSuperAdmin = async (userId: number, isSuper: boolean) => {
    try {
      await api.put(`/users/${userId}`, { is_superuser: isSuper });
      message.success('Status de Super Admin atualizado!');
      await loadAll();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.delete(`/users/${userId}`);
      message.success('Usuário removido.');
      await loadAll();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const handleCreateGroup = async (values: any) => {
    try {
      await api.post('/groups', values);
      message.success(`Grupo '${values.name}' criado!`);
      setGroupModalOpen(false);
      groupForm.resetFields();
      await loadAll();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const handleGrantProjectPermission = async (values: any) => {
    if (!activeProject) return;
    try {
      await api.post(`/projects/${activeProject.id}/permissions`, values);
      message.success('Permissão HBAC concedida no projeto!');
      setPermModalOpen(false);
      permForm.resetFields();
      await loadAll();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const handleRevokePermission = async (permId: number) => {
    if (!activeProject) return;
    try {
      await api.delete(`/projects/${activeProject.id}/permissions/${permId}`);
      message.success('Permissão revogada.');
      await loadAll();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const renderRoleTag = (role: string) => {
    if (role === 'admin') return <Tag color="red">ADMIN</Tag>;
    if (role === 'editor') return <Tag color="orange">EDITOR</Tag>;
    return <Tag color="cyan">VISUALIZADOR</Tag>;
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const currentRole = u.groups?.[0]?.role_level || 'viewer';
      if (roleFilter !== 'all' && currentRole !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(u.full_name || '').toLowerCase().includes(q) ||
        String(u.username || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(p.username || '').toLowerCase().includes(q) ||
        String(p.user_email || '').toLowerCase().includes(q) ||
        String(p.group_name || '').toLowerCase().includes(q)
      );
    });
  }, [permissions, search, roleFilter]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (roleFilter !== 'all' && g.role_level !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(g.name || '').toLowerCase().includes(q) ||
        String(g.description || '').toLowerCase().includes(q)
      );
    });
  }, [groups, search, roleFilter]);

  return (
    <div className="opspages-page">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold m-0 flex items-center gap-2">
                <SafetyCertificateOutlined className="text-[#FF774A]" />
                Gerenciamento de Usuários, Grupos & Controle de Acesso HBAC
              </h3>
              <p className="text-xs text-slate-400 m-0 mt-1.5">
                Hierarquia de papéis: <strong>Admin</strong> (controle total e trava de versões) &gt;{' '}
                <strong>Editor</strong> (upload de builds, aprovação e rollback) &gt;{' '}
                <strong>Visualizador</strong> (leitura e preview).
              </p>
            </div>
            <Space wrap>
              <Button icon={<PlusOutlined />} onClick={() => setGroupModalOpen(true)}>
                Novo Grupo
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setUserModalOpen(true)}
              >
                Cadastrar Usuário
              </Button>
            </Space>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <Space wrap>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Filtrar usuários, e-mails ou grupos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 260 }}
              />
              <Select
                value={roleFilter}
                onChange={(val) => setRoleFilter(val)}
                style={{ width: 165 }}
                options={[
                  { value: 'all', label: 'Todos os Papéis' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'editor', label: 'Editor' },
                  { value: 'viewer', label: 'Visualizador' },
                ]}
              />
              {(search || roleFilter !== 'all') && (
                <Button onClick={resetFilters}>Limpar Filtros</Button>
              )}
            </Space>
            <span className="text-xs text-slate-400">
              {filteredUsers.length} usuário(s) • {filteredGroups.length} grupo(s)
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setExtra('tab', key)}
          items={[
            {
              key: 'users',
              label: `Usuários da Plataforma (${filteredUsers.length})`,
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredUsers}
                  pagination={{
                    current: page,
                    pageSize: Math.max(10, pageSize),
                    total: filteredUsers.length,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (t, r) => `${r[0]}-${r[1]} de ${t} usuários (mín. 10/página)`,
                    onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
                  }}
                  columns={[
                    {
                      title: 'Usuário / E-mail',
                      key: 'user',
                      render: (_: any, r: any) => (
                        <div>
                          <div className="font-semibold text-xs flex items-center gap-1.5">
                            {r.full_name || r.username}
                            {r.is_superuser && <Tag color="gold">SUPER ADMIN ★</Tag>}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{r.email}</div>
                        </div>
                      ),
                    },
                    {
                      title: 'Grupos & Papel Atual',
                      key: 'groups',
                      render: (_: any, r: any) =>
                        r.groups?.length ? (
                          r.groups.map((g: any) => (
                            <span key={g.id} className="inline-flex items-center gap-1 mr-2">
                              <Tag>{g.name}</Tag>
                              {renderRoleTag(g.role_level)}
                            </span>
                          ))
                        ) : (
                          <Tag>Sem grupo</Tag>
                        ),
                    },
                    {
                      title: 'Alterar Permissão Global',
                      key: 'changeRole',
                      render: (_: any, r: any) => {
                        const currentRole = r.groups?.[0]?.role_level || 'viewer';
                        return (
                          <Select
                            size="small"
                            value={currentRole}
                            style={{ width: 155 }}
                            onChange={(val) => handleChangeUserRole(r.id, val)}
                            options={[
                              { value: 'admin', label: 'Admin' },
                              { value: 'editor', label: 'Editor' },
                              { value: 'viewer', label: 'Visualizador' },
                            ]}
                          />
                        );
                      },
                    },
                    {
                      title: 'Global Admin',
                      key: 'super',
                      render: (_: any, r: any) => (
                        <Switch
                          size="small"
                          checked={r.is_superuser}
                          disabled={r.id === currentUser?.id}
                          onChange={(checked) => handleToggleSuperAdmin(r.id, checked)}
                        />
                      ),
                    },
                    {
                      title: 'Ações',
                      key: 'actions',
                      align: 'right' as const,
                      render: (_: any, r: any) =>
                        r.id !== currentUser?.id ? (
                          <Popconfirm
                            title={`Remover usuário ${r.email}?`}
                            onConfirm={() => handleDeleteUser(r.id)}
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ) : (
                          <Tag color="gold">Você</Tag>
                        ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'project-hbac',
              label: `Permissões no Projeto (${activeProject?.slug || ''})`,
              children: (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setPermModalOpen(true)}
                    >
                      Conceder Permissão Específica no Projeto
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    dataSource={filteredPermissions}
                    pagination={{
                      current: page,
                      pageSize: Math.max(10, pageSize),
                      total: filteredPermissions.length,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
                    }}
                    columns={[
                      {
                        title: 'Alvo (Usuário ou Grupo)',
                        key: 'target',
                        render: (_: any, r: any) =>
                          r.username ? (
                            <span>
                              Usuário: <strong>{r.username}</strong> ({r.user_email})
                            </span>
                          ) : (
                            <span>
                              Grupo: <strong>{r.group_name}</strong>
                            </span>
                          ),
                      },
                      {
                        title: 'Papel no Projeto',
                        dataIndex: 'role',
                        key: 'role',
                        render: (role: string) => renderRoleTag(role),
                      },
                      {
                        title: 'Ações',
                        key: 'actions',
                        align: 'right' as const,
                        render: (_: any, r: any) => (
                          <Popconfirm
                            title="Revogar esta permissão?"
                            onConfirm={() => handleRevokePermission(r.id)}
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'groups',
              label: `Grupos HBAC (${filteredGroups.length})`,
              children: (
                <Table
                  rowKey="id"
                  dataSource={filteredGroups}
                  pagination={{
                    current: page,
                    pageSize: Math.max(10, pageSize),
                    total: filteredGroups.length,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
                  }}
                  columns={[
                    { title: 'Nome do Grupo', dataIndex: 'name', key: 'name' },
                    { title: 'Descrição', dataIndex: 'description', key: 'description' },
                    {
                      title: 'Nível HBAC',
                      dataIndex: 'role_level',
                      key: 'role_level',
                      render: (role: string) => renderRoleTag(role),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        open={userModalOpen}
        onCancel={() => setUserModalOpen(false)}
        footer={null}
        centered
        styles={{
          body: {
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        title="Cadastrar Novo Usuário"
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={{ role: 'editor', is_superuser: false }}
        >
          <Form.Item name="full_name" label="Nome Completo" rules={[{ required: true }]}>
            <Input placeholder="Ex: João Silva" />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="joao.silva" />
          </Form.Item>
          <Form.Item name="email" label="E-mail Corporativo" rules={[{ required: true }]}>
            <Input placeholder="joao.silva@olivelas.com.br" />
          </Form.Item>
          <Form.Item name="password" label="Senha Inicial" rules={[{ required: true }]}>
            <Input.Password placeholder="Mínimo 6 caracteres" />
          </Form.Item>
          <Form.Item name="role" label="Permissão (Papel HBAC)">
            <Select
              options={[
                { value: 'admin', label: 'Admin (Controle Total & Trava de Versões)' },
                { value: 'editor', label: 'Editor (Subir Builds, Aprovar & Rollback)' },
                { value: 'viewer', label: 'Visualizador (Somente Leitura & Preview)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="is_superuser" label="Super Admin Global" valuePropName="checked">
            <Switch />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setUserModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">
              Criar Usuário
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        open={groupModalOpen}
        onCancel={() => setGroupModalOpen(false)}
        footer={null}
        centered
        styles={{
          body: {
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        title="Criar Grupo HBAC"
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleCreateGroup}
          initialValues={{ role_level: 'editor' }}
        >
          <Form.Item name="name" label="Nome do Grupo" rules={[{ required: true }]}>
            <Input placeholder="Ex: Squad Checkout Frontend" />
          </Form.Item>
          <Form.Item name="description" label="Descrição">
            <Input placeholder="Engenheiros responsáveis pelas builds do Checkout" />
          </Form.Item>
          <Form.Item name="role_level" label="Papel HBAC Padrão">
            <Select
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Visualizador' },
              ]}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setGroupModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">
              Criar Grupo
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Grant Project Permission Modal */}
      <Modal
        open={permModalOpen}
        onCancel={() => setPermModalOpen(false)}
        footer={null}
        centered
        styles={{
          body: {
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        title={`Conceder Permissão em ${activeProject?.name || ''}`}
      >
        <Form
          form={permForm}
          layout="vertical"
          onFinish={handleGrantProjectPermission}
          initialValues={{ role: 'editor' }}
        >
          <Form.Item name="user_id" label="Selecionar Usuário">
            <Select
              allowClear
              placeholder="Escolha um usuário"
              options={users.map((u) => ({ value: u.id, label: `${u.email} (${u.username})` }))}
            />
          </Form.Item>
          <Form.Item name="group_id" label="Ou Selecionar Grupo">
            <Select
              allowClear
              placeholder="Escolha um grupo"
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </Form.Item>
          <Form.Item name="role" label="Papel no Projeto" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Visualizador' },
              ]}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPermModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">
              Salvar Permissão
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
