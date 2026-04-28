"use client";

import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Select, Space } from "antd";
import type { FormInstance } from "antd";
import type { EntityCandidateStatus, KnowledgeBase } from "../types";

const STATUS_OPTIONS: { value: EntityCandidateStatus; label: string }[] = [
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "merged", label: "已合并" },
];

interface CandidatesFilterFormProps {
  form: FormInstance;
  kbList: KnowledgeBase[];
  kbLoading: boolean;
  handleSearch: () => Promise<void>;
  handleReset: () => void;
  loadList: () => Promise<void>;
}

export function CandidatesFilterForm({
  form,
  kbList,
  kbLoading,
  handleSearch,
  handleReset,
  loadList,
}: CandidatesFilterFormProps) {
  return (
    <Card
      size="small"
      className="sticky top-0 z-20 mb-4 shadow-sm"
      styles={{ body: { paddingBottom: 12 } }}
    >
      <Form
        form={form}
        layout="inline"
        className="flex flex-wrap gap-x-3 gap-y-2"
        initialValues={{
          status: "pending" as EntityCandidateStatus,
        }}
      >
        <Form.Item name="status" label="状态">
          <Select<EntityCandidateStatus> style={{ width: 132 }} options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="biz_code" label="业务线">
          <Input allowClear placeholder="biz_code" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="knowledge_base_id" label="知识库">
          <Select<number>
            allowClear
            showSearch
            optionFilterProp="label"
            loading={kbLoading}
            placeholder="选择知识库"
            style={{ width: 200 }}
            options={kbList.map((k) => ({
              value: k.id,
              label: k.name || `#${k.id}`,
            }))}
          />
        </Form.Item>
        <Form.Item name="file_id" label="来源文件">
          <InputNumber min={1} placeholder="file_id" className="!w-[120px]" controls={false} />
        </Form.Item>
        <Form.Item name="keyword" label="关键词">
          <Input allowClear placeholder="匹配候选词" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => void handleSearch()}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button icon={<ReloadOutlined />} onClick={() => void loadList()}>
              刷新
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
