import React, { useEffect, useState } from 'react';
import { Card, Table, Input, Switch, Button, Tag, Modal, Empty } from 'antd';
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUrlTableState } from '../../utils/urlState';

export const AuditViewer: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { page, pageSize, search, extra, setPage, setSearch, setExtra } = useUrlTableState({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultExtra: { scope: 'all' },
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const projectOnly = extra.scope === 'project';

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (projectOnly && activeProject) params.project_id = activeProject.id;
      if (search.trim()) params.action = search.trim();
      const res = await api.get('/audit', { params });
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setLogs(items);
      setTotal(res.data?.total ?? items.length);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [projectOnly, activeProject?.id, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SafetyCertificateOutlined className="text-[#FF774A]" />
            Trilha de Auditoria Forense (Imutável • {total} eventos)
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Rastreabilidade completa de uploads de builds, aprovações, rollbacks, travas de versão (Lock), tokens e alterações HBAC.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            prefix={<SearchOutlined className="text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={loadLogs}
            placeholder="Filtrar ação (ex: deployment.upload)"
            className="w-64"
            allowClear
          />
          {activeProject && (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-theme">
              <Switch
                size="small"
                checked={projectOnly}
                onChange={(checked) => setExtra('scope', checked ? 'project' : 'all')}
              />
              <span>Apenas {activeProject.slug}</span>
            </div>
          )}
          <Button icon={<ReloadOutlined spin={loading} />} onClick={loadLogs}>
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="border-theme">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={logs}
          pagination={{
            current: page,
            pageSize: Math.max(10, pageSize),
            total: logs.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (tot, range) => `${range[0]}-${range[1]} de ${tot} eventos`,
            onChange: (nextPage, nextSize) => setPage(nextPage, nextSize),
          }}
          locale={{
            emptyText: <Empty description="Nenhum evento de auditoria encontrado para os filtros aplicados." />,
          }}
          columns={[
            {
              title: 'Data / Hora',
              dataIndex: 'created_at',
              render: (val: string, row: any) => {
                const ts = val || row.timestamp;
                return (
                  <span className="font-mono text-xs text-slate-400">
                    {ts ? new Date(ts).toLocaleString('pt-BR') : '-'}
                  </span>
                );
              },
            },
            {
              title: 'Ator',
              dataIndex: 'actor_email',
              render: (val: string) => <span className="font-semibold text-xs">{val || 'system'}</span>,
            },
            {
              title: 'Auth',
              dataIndex: 'auth_method',
              render: (val: string) => <Tag color="blue">{(val || 'jwt').toUpperCase()}</Tag>,
            },
            {
              title: 'Ação',
              dataIndex: 'action',
              render: (val: string) => <span className="font-mono text-xs text-[#FF774A] font-semibold">{val}</span>,
            },
            {
              title: 'Recurso',
              render: (_: any, row: any) => (
                <span className="font-mono text-xs text-slate-300">
                  {row.resource_type}:{row.resource_name || row.resource_id || '-'}
                </span>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status_code',
              render: (code: number) => (
                <Tag color={(code || 200) < 400 ? 'success' : 'error'}>{code || 200}</Tag>
              ),
            },
            {
              title: 'Detalhes',
              align: 'right',
              render: (_: any, row: any) => (
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setSelectedLog(row)}
                >
                  JSON
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={Boolean(selectedLog)}
        onCancel={() => setSelectedLog(null)}
        footer={null}
        centered
        width={720}
        styles={{
          body: {
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        title={
          selectedLog ? (
            <div>
              <span className="font-mono text-[#FF774A]">{selectedLog.action}</span>
              <div className="text-xs text-slate-400 font-normal">
                Executado por {selectedLog.actor_email || 'system'} em{' '}
                {new Date(selectedLog.created_at || selectedLog.timestamp).toLocaleString('pt-BR')}
              </div>
            </div>
          ) : null
        }
      >
        {selectedLog && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <div className="font-semibold mb-1 text-slate-400">Estado Anterior (Before)</div>
              <pre className="p-3 rounded-xl bg-black/40 border border-slate-800 font-mono overflow-auto max-h-64 text-slate-200">
                {JSON.stringify(selectedLog.before_state || {}, null, 2)}
              </pre>
            </div>
            <div>
              <div className="font-semibold mb-1 text-slate-400">Estado Novo / Metadados (After / Details)</div>
              <pre className="p-3 rounded-xl bg-black/40 border border-slate-800 font-mono overflow-auto max-h-64 text-slate-200">
                {JSON.stringify(selectedLog.after_state || selectedLog.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
