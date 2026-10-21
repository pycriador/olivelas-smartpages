import React, { useEffect, useState, useMemo } from 'react';
import { Card, Select, Tree, Table, Input, Space, Tag, Button, Empty, Spin, message } from 'antd';
import {
  FolderOpenOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CodeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../../stores/useProjectStore';
import { api, extractErrorMessage } from '../../services/api';
import { useUrlTableState } from '../../utils/urlState';

interface BuildFileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size_bytes: number;
  extension?: string | null;
  children?: BuildFileNode[] | null;
}

export const BuildFileExplorer: React.FC = () => {
  const {
    activeProject,
    deployments,
    selectedVersionForExplorer,
    setSelectedVersionForExplorer,
  } = useProjectStore();

  const [filesTree, setFilesTree] = useState<BuildFileNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>('index.html');
  const [fileContent, setFileContent] = useState<{
    path: string;
    size_bytes: number;
    is_binary: boolean;
    mime_type: string;
    content?: string | null;
  } | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const {
    page,
    pageSize,
    search,
    status: extFilter,
    setPage,
    setSearch,
    setStatus: setExtFilter,
    resetFilters,
  } = useUrlTableState({ defaultPageSize: 10 });

  const currentVersion =
    selectedVersionForExplorer || activeProject?.active_version || deployments[0]?.version || 'v1.0.0';

  const fetchTree = async (ver: string) => {
    if (!activeProject || !ver) return;
    setLoadingTree(true);
    try {
      const res = await api.get<BuildFileNode[]>(
        `/projects/${activeProject.id}/deployments/${ver}/files`
      );
      setFilesTree(res.data || []);
      // Automatically load index.html if present
      if (res.data?.length) {
        const firstFile = findFirstFile(res.data);
        if (firstFile) {
          fetchFileContent(ver, firstFile);
        }
      } else {
        setFileContent(null);
      }
    } catch (err) {
      message.error(extractErrorMessage(err, 'Erro ao carregar arquivos da build.'));
    } finally {
      setLoadingTree(false);
    }
  };

  const findFirstFile = (nodes: BuildFileNode[]): string | null => {
    for (const n of nodes) {
      if (n.type === 'file' && n.name === 'index.html') return n.path;
    }
    for (const n of nodes) {
      if (n.type === 'file') return n.path;
      if (n.children) {
        const found = findFirstFile(n.children);
        if (found) return found;
      }
    }
    return null;
  };

  const fetchFileContent = async (ver: string, path: string) => {
    if (!activeProject) return;
    setSelectedFilePath(path);
    setLoadingFile(true);
    try {
      const res = await api.get(
        `/projects/${activeProject.id}/deployments/${ver}/file-content`,
        { params: { path } }
      );
      setFileContent(res.data);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Não foi possível ler o arquivo.'));
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    if (activeProject && currentVersion) {
      fetchTree(currentVersion);
    }
  }, [activeProject?.id, currentVersion]);

  if (!activeProject) return null;

  const flatFiles = useMemo(() => {
    const list: BuildFileNode[] = [];
    const walk = (nodes: BuildFileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'file') {
          list.push(n);
        }
        if (n.children) {
          walk(n.children);
        }
      }
    };
    walk(filesTree);
    return list;
  }, [filesTree]);

  const filteredFlatFiles = useMemo(() => {
    return flatFiles.filter((f) => {
      if (extFilter !== 'all') {
        const ext = (f.extension || f.name.split('.').pop() || '').toLowerCase().replace('.', '');
        if (ext !== extFilter) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q);
    });
  }, [flatFiles, search, extFilter]);

  const mapToAntdTree = (nodes: BuildFileNode[]): any[] =>
    nodes.map((node) => ({
      key: node.path,
      title: (
        <span className="text-xs font-mono">
          {node.name}{' '}
          {node.type === 'file' && (
            <span className="text-[10px] text-slate-500 ml-1">({node.size_bytes} B)</span>
          )}
        </span>
      ),
      isLeaf: node.type === 'file',
      children: node.children ? mapToAntdTree(node.children) : undefined,
    }));

  return (
    <div className="opspages-page">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FolderOpenOutlined className="text-xl text-[#FF774A]" />
            <div>
              <h3 className="text-base font-bold m-0">
                Explorador de Arquivos da Build (/repos/{activeProject.slug}/releases/{currentVersion})
              </h3>
              <p className="text-xs text-slate-400 m-0 mt-1">
                Inspecione o código-fonte estático exato empacotado em cada release versionada.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium">Versão:</span>
            <Select
              value={currentVersion}
              onChange={(val) => setSelectedVersionForExplorer(val)}
              style={{ width: 160 }}
              options={deployments.map((d) => ({
                value: d.version,
                label: `${d.version} ${d.is_live ? '(LIVE)' : ''}`,
              }))}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchTree(currentVersion)}
            />
            <Button
              icon={<DownloadOutlined />}
              href={`/api/v1/public/projects/${activeProject.slug}/download-build?version=${encodeURIComponent(currentVersion)}`}
              target="_blank"
            >
              Baixar HTML (.zip)
            </Button>
            <Button
              icon={<CodeOutlined />}
              href={`/api/v1/public/projects/${activeProject.slug}/download-source?version=${encodeURIComponent(currentVersion)}`}
              target="_blank"
            >
              Baixar Fonte TS (.zip)
            </Button>
            <Button
              type="primary"
              icon={<GlobalOutlined />}
              onClick={() =>
                window.open(`/pages/${activeProject.slug}/v/${currentVersion}/`, '_blank')
              }
            >
              Abrir Preview {currentVersion}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card title="Árvore de Arquivos" className="h-full">
            {loadingTree ? (
              <div className="py-10 text-center">
                <Spin />
              </div>
            ) : filesTree.length === 0 ? (
              <Empty description="Nenhum arquivo nesta versão" />
            ) : (
              <Tree
                showIcon
                defaultExpandAll
                selectedKeys={selectedFilePath ? [selectedFilePath] : []}
                treeData={mapToAntdTree(filesTree)}
                onSelect={(keys, info) => {
                  if (info.node.isLeaf && keys[0]) {
                    fetchFileContent(currentVersion, String(keys[0]));
                  }
                }}
              />
            )}
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs flex items-center gap-2">
                  <FileTextOutlined className="text-[#FF774A]" />
                  {selectedFilePath || 'Selecione um arquivo'}
                </span>
                {fileContent && (
                  <div className="flex items-center gap-2">
                    <Tag color="cyan">{fileContent.mime_type}</Tag>
                    <Tag>{fileContent.size_bytes} bytes</Tag>
                  </div>
                )}
              </div>
            }
          >
            {loadingFile ? (
              <div className="py-12 text-center">
                <Spin />
              </div>
            ) : !fileContent ? (
              <Empty description="Selecione um arquivo na árvore ao lado" />
            ) : fileContent.is_binary ? (
              <div className="p-6 text-center text-slate-400">
                Arquivo binário ({fileContent.mime_type} • {fileContent.size_bytes} bytes).{' '}
                <a
                  href={`/pages/${activeProject.slug}/v/${currentVersion}/${fileContent.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#FF774A] underline"
                >
                  Abrir arquivo diretamente ↗
                </a>
              </div>
            ) : (
              <pre className="p-4 rounded-xl bg-[#0B131E] border border-[#223147] text-xs font-mono text-slate-200 overflow-auto max-h-[520px] whitespace-pre-wrap">
                {fileContent.content}
              </pre>
            )}
          </Card>
        </div>
      </div>

      {/* Paginated File List with URL Filters (>= 10 items per page) */}
      <Card
        title={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">
              Lista Completa de Arquivos na Release {currentVersion} ({filteredFlatFiles.length})
            </span>
            <Space wrap>
              <Input
                allowClear
                size="small"
                prefix={<SearchOutlined />}
                placeholder="Filtrar caminho ou nome do arquivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 240 }}
              />
              <Select
                size="small"
                value={extFilter}
                onChange={(val) => setExtFilter(val)}
                style={{ width: 145 }}
                options={[
                  { value: 'all', label: 'Todos os Tipos' },
                  { value: 'html', label: '.html' },
                  { value: 'js', label: '.js' },
                  { value: 'css', label: '.css' },
                  { value: 'png', label: '.png / img' },
                  { value: 'json', label: '.json' },
                ]}
              />
              {(search || extFilter !== 'all') && (
                <Button size="small" onClick={resetFilters}>
                  Limpar
                </Button>
              )}
            </Space>
          </div>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="path"
          size="small"
          loading={loadingTree}
          dataSource={filteredFlatFiles}
          pagination={{
            current: page,
            pageSize: Math.max(10, pageSize),
            total: filteredFlatFiles.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t, r) => `${r[0]}-${r[1]} de ${t} arquivos (mín. 10/página)`,
            onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
          }}
          columns={[
            {
              title: 'Caminho Relativo na Build',
              dataIndex: 'path',
              key: 'path',
              render: (p: string) => (
                <Button
                  type="link"
                  size="small"
                  className="font-mono text-xs p-0"
                  onClick={() => fetchFileContent(currentVersion, p)}
                >
                  {p}
                </Button>
              ),
            },
            {
              title: 'Extensão',
              key: 'ext',
              render: (_: any, r: BuildFileNode) => (
                <Tag className="font-mono text-xs">
                  {r.extension || `.${r.name.split('.').pop() || 'file'}`}
                </Tag>
              ),
            },
            {
              title: 'Tamanho',
              dataIndex: 'size_bytes',
              key: 'size_bytes',
              render: (b: number) => <span className="font-mono text-xs">{b} bytes</span>,
            },
            {
              title: 'Ações',
              key: 'actions',
              align: 'right' as const,
              render: (_: any, r: BuildFileNode) => (
                <Button
                  size="small"
                  onClick={() => fetchFileContent(currentVersion, r.path)}
                >
                  Inspecionar
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
