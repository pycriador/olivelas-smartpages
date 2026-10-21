import React, { useEffect, useState } from 'react';
import { Card, Progress, Form, InputNumber, Button, message } from 'antd';
import { DatabaseOutlined, SaveOutlined } from '@ant-design/icons';
import { useProjectStore } from '../../stores/useProjectStore';
import { api, extractErrorMessage } from '../../services/api';

export const QuotasManager: React.FC = () => {
  const { activeProject } = useProjectStore();
  const [usage, setUsage] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadQuotas = async () => {
    if (!activeProject) return;
    try {
      const res = await api.get(`/projects/${activeProject.id}/quotas`);
      setUsage(res.data);
      form.setFieldsValue(res.data.quota);
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  useEffect(() => {
    loadQuotas();
  }, [activeProject?.id]);

  const handleSave = async (values: any) => {
    if (!activeProject) return;
    setSaving(true);
    try {
      await api.put(`/projects/${activeProject.id}/quotas`, values);
      message.success('Cotas de armazenamento e builds atualizadas!');
      await loadQuotas();
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!activeProject || !usage) return null;

  return (
    <div className="opspages-page">
      <Card>
        <h3 className="text-lg font-bold m-0 flex items-center gap-2">
          <DatabaseOutlined className="text-[#FF774A]" />
          Cotas de Armazenamento em /repos & Limites de Build ({activeProject.slug})
        </h3>
        <p className="text-xs text-slate-400 m-0 mt-1.5">
          Monitore o consumo de disco das versões retidas em <code>/repos/{activeProject.slug}</code> e a
          frequência diária de deploys.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1.5">Armazenamento Total em /repos</div>
          <div className="text-xl font-bold mb-3">
            {usage.current_storage_mb} MB / {usage.quota.max_storage_mb} MB
          </div>
          <Progress percent={usage.storage_usage_pct} strokeColor="#FF774A" />
        </Card>

        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1.5">Deploys Realizados Hoje</div>
          <div className="text-xl font-bold mb-3">
            {usage.deploys_today} / {usage.quota.max_deploys_per_day}
          </div>
          <Progress
            percent={Math.min(
              100,
              Math.round((usage.deploys_today / usage.quota.max_deploys_per_day) * 100)
            )}
            strokeColor="#10B981"
          />
        </Card>

        <Card>
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1.5">Versões Retidas em /repos/releases</div>
          <div className="text-xl font-bold mb-3">
            {usage.retained_versions} / {usage.quota.max_retained_versions}
          </div>
          <Progress
            percent={Math.min(
              100,
              Math.round((usage.retained_versions / usage.quota.max_retained_versions) * 100)
            )}
            strokeColor="#6366F1"
          />
        </Card>
      </div>

      <Card title="Ajustar Limites do Projeto (Requer Admin)">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Form.Item name="max_build_size_mb" label="Tamanho Máx. por Build (MB)">
              <InputNumber min={1} max={2048} className="w-full" />
            </Form.Item>
            <Form.Item name="max_storage_mb" label="Storage Total em /repos (MB)">
              <InputNumber min={10} max={51200} className="w-full" />
            </Form.Item>
            <Form.Item name="max_deploys_per_day" label="Deploys Máx. por Dia">
              <InputNumber min={1} max={5000} className="w-full" />
            </Form.Item>
            <Form.Item name="max_retained_versions" label="Máx. Versões Retidas">
              <InputNumber min={1} max={1000} className="w-full" />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
            Salvar Cotas
          </Button>
        </Form>
      </Card>
    </div>
  );
};
