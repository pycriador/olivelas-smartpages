import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Input,
  Space,
  message,
} from 'antd';
import {
  BranchesOutlined,
  SyncOutlined,
  DiffOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  TagOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../../stores/useProjectStore';
import { useTheme } from '../../theme/CopanThemeProvider';
import { api, extractErrorMessage } from '../../services/api';
import { useUrlTableState } from '../../utils/urlState';

export const GitVersionControl: React.FC = () => {
  const { activeProject, fetchProjects } = useProjectStore();
  const { theme, isDark } = useTheme();
  const [repoStatus, setRepoStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const {
    page,
    pageSize,
    search,
    status: tagFilter,
    setPage,
    setSearch,
    setStatus: setTagFilter,
    resetFilters,
  } = useUrlTableState({ defaultPageSize: 10 });

  const [remoteUrl, setRemoteUrl] = useState('');
  const [branch, setBranch] = useState('main');

  const [baseVer, setBaseVer] = useState<string>('');
  const [targetVer, setTargetVer] = useState<string>('');
  const [diffData, setDiffData] = useState<any>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const loadGitStatus = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get(`/projects/${activeProject.id}/git/status`);
      setRepoStatus(res.data);
      setRemoteUrl(res.data.github_repo_url || '');
      setBranch(res.data.current_branch || 'main');

      const tags: string[] = res.data.tags || [];
      if (tags.length >= 2) {
        setBaseVer(tags[tags.length - 2]);
        setTargetVer(tags[tags.length - 1]);
      } else if (tags.length === 1) {
        setBaseVer(tags[0]);
        setTargetVer(tags[0]);
      }
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGitStatus();
  }, [activeProject?.id]);

  const handleLoadDiff = async () => {
    if (!activeProject || !baseVer || !targetVer) return;
    setLoadingDiff(true);
    try {
      const res = await api.get(`/projects/${activeProject.id}/git/diff`, {
        params: { base_version: baseVer, target_version: targetVer },
      });
      setDiffData(res.data);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleGitSync = async (direction: 'push' | 'pull' | 'status') => {
    if (!activeProject) return;
    setSyncing(true);
    try {
      const res = await api.post(`/projects/${activeProject.id}/git/sync`, {
        direction,
        remote_url: remoteUrl,
        branch,
      });
      if (res.data.success) {
        message.success(res.data.message || `Git ${direction} executado com sucesso!`);
      } else {
        message.warning(res.data.message || `Aviso no Git ${direction}`);
      }
      await loadGitStatus();
      await fetchProjects(activeProject.id);
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  if (!activeProject) return null;

  return (
    <div className="opspages-page">
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold m-0 flex items-center gap-2">
              <BranchesOutlined className="text-[#FF774A]" />
              Controle de Versionamento Git & Sincronização GitHub (/repos/{activeProject.slug})
            </h3>
            <p className="text-xs text-slate-400 m-0 mt-1.5">
              Repositório Git dedicado em <code>{repoStatus?.repo_path || activeProject.repo_disk_path}</code>{' '}
              com tags imutáveis para cada build estática.
            </p>
          </div>

          <Space wrap>
            <Tag color="orange" className="font-mono">
              Branch: {repoStatus?.current_branch || activeProject.github_branch}
            </Tag>
            <Tag color="cyan" className="font-mono">
              HEAD: {repoStatus?.head_sha?.slice(0, 8) || 'n/a'}
            </Tag>
            <Tag color="purple">Commits: {repoStatus?.total_commits || 0}</Tag>
            <Button icon={<SyncOutlined spin={loading} />} onClick={loadGitStatus}>
              Atualizar Git Log
            </Button>
          </Space>
        </div>

        <div
          className="mt-6 p-5 rounded-xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end"
          style={{
            backgroundColor: isDark ? '#0F172A40' : '#F8FAFC',
            borderColor: theme.colorBorder,
          }}
        >
          <div className="lg:col-span-6">
            <label className="text-xs text-slate-400 block mb-1">
              Repositório Remoto GitHub (Sincroniza builds de <code>{activeProject.github_subpath}</code>)
            </label>
            <Input
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://github.com/loft-br/opspages-repos.git"
              className="font-mono text-xs"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs text-slate-400 block mb-1">Branch Remota</label>
            <Input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="font-mono text-xs"
            />
          </div>
          <div className="lg:col-span-4 flex gap-2">
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={syncing}
              onClick={() => handleGitSync('push')}
              block
            >
              Git Push (Tags & Commits)
            </Button>
            <Button
              icon={<CloudDownloadOutlined />}
              loading={syncing}
              onClick={() => handleGitSync('pull')}
              block
            >
              Git Pull
            </Button>
          </div>
        </div>
      </Card>

      {/* Visual Diff Between Versions */}
      <Card
        title={
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <DiffOutlined className="text-[#FF774A]" /> Comparador de Diff entre Versões (Git Diff)
            </span>
            <Space>
              <Select
                value={baseVer}
                onChange={setBaseVer}
                placeholder="Versão Base"
                style={{ width: 140 }}
                options={(repoStatus?.tags || []).map((t: string) => ({ value: t, label: t }))}
              />
              <span className="text-xs text-slate-400">→</span>
              <Select
                value={targetVer}
                onChange={setTargetVer}
                placeholder="Versão Alvo"
                style={{ width: 140 }}
                options={(repoStatus?.tags || []).map((t: string) => ({ value: t, label: t }))}
              />
              <Button
                type="primary"
                size="small"
                loading={loadingDiff}
                onClick={handleLoadDiff}
              >
                Comparar Versões
              </Button>
            </Space>
          </div>
        }
      >
        {diffData ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {diffData.files_changed?.length === 0 ? (
                <Tag color="default">Nenhuma diferença de arquivos entre {diffData.base_version} e {diffData.target_version}</Tag>
              ) : (
                diffData.files_changed?.map((f: any, idx: number) => (
                  <Tag
                    key={idx}
                    color={f.status === 'A' ? 'success' : f.status === 'D' ? 'error' : 'warning'}
                    className="font-mono"
                  >
                    [{f.status}] {f.path}
                  </Tag>
                ))
              )}
            </div>
            {diffData.diff_text && (
              <pre className="p-4 rounded-xl bg-[#0B131E] border border-[#223147] text-xs font-mono text-slate-200 overflow-auto max-h-80 whitespace-pre-wrap">
                {diffData.diff_text}
              </pre>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Selecione duas tags de versão acima e clique em <strong>Comparar Versões</strong> para inspecionar o <code>git diff</code>.
          </div>
        )}
      </Card>

      {/* Commit Log Table */}
      <Card
        title={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <TagOutlined className="text-[#FF774A]" /> Histórico de Commits & Tags no Repositório (/repos/{activeProject.slug}/git_repo)
            </span>
            <Space wrap>
              <Input
                allowClear
                size="small"
                prefix={<SearchOutlined />}
                placeholder="Filtrar SHA, tag, mensagem ou autor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 250 }}
              />
              <Select
                size="small"
                value={tagFilter}
                onChange={(val) => setTagFilter(val)}
                style={{ width: 150 }}
                options={[
                  { value: 'all', label: 'Todos os Commits' },
                  { value: 'tagged', label: 'Com Tag Git' },
                  { value: 'untagged', label: 'Sem Tag Git' },
                ]}
              />
              {(search || tagFilter !== 'all') && (
                <Button size="small" onClick={resetFilters}>
                  Limpar
                </Button>
              )}
            </Space>
          </div>
        }
        styles={{ body: { padding: 0 } }}
      >
        {(() => {
          const allCommits: any[] = repoStatus?.commits || [];
          const filteredCommits = allCommits.filter((c) => {
            if (tagFilter === 'tagged' && (!c.tags || c.tags.length === 0)) return false;
            if (tagFilter === 'untagged' && c.tags && c.tags.length > 0) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
              String(c.sha || '').toLowerCase().includes(q) ||
              String(c.short_sha || '').toLowerCase().includes(q) ||
              String(c.message || '').toLowerCase().includes(q) ||
              String(c.author_name || '').toLowerCase().includes(q) ||
              String(c.author_email || '').toLowerCase().includes(q) ||
              (c.tags || []).some((t: string) => t.toLowerCase().includes(q))
            );
          });
          return (
            <Table
              rowKey="sha"
              loading={loading}
              dataSource={filteredCommits}
              pagination={{
                current: page,
                pageSize: Math.max(10, pageSize),
                total: filteredCommits.length,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (t, r) => `${r[0]}-${r[1]} de ${t} commits (mín. 10/página)`,
                onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
              }}
              columns={[
            {
              title: 'Commit SHA',
              dataIndex: 'short_sha',
              key: 'short_sha',
              render: (sha: string) => (
                <Tag color="orange" className="font-mono">
                  {sha}
                </Tag>
              ),
            },
            {
              title: 'Tags Git',
              dataIndex: 'tags',
              key: 'tags',
              render: (tags: string[]) =>
                tags?.length ? (
                  tags.map((t) => (
                    <Tag key={t} color="success" className="font-mono">
                      {t}
                    </Tag>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                ),
            },
            {
              title: 'Mensagem do Commit',
              dataIndex: 'message',
              key: 'message',
              render: (msg: string) => <span className="text-xs font-medium">{msg}</span>,
            },
            {
              title: 'Autor',
              key: 'author',
              render: (_: any, r: any) => (
                <span className="text-xs text-slate-400">
                  {r.author_name} ({r.author_email})
                </span>
              ),
            },
            {
              title: 'Data',
              dataIndex: 'date',
              key: 'date',
              render: (d: string) => (
                <span className="text-xs font-mono text-slate-400">
                  {new Date(d).toLocaleString('pt-BR')}
                </span>
              ),
            },
              ]}
            />
          );
        })()}
      </Card>
    </div>
  );
};
