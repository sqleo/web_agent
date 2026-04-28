"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MetadataField, MetadataFieldAlias } from "../types";

interface ConfigFieldTableProps {
  rows: MetadataField[];
  canQuery: boolean;
  listLoading: boolean;
  openEditField: (row: MetadataField) => void;
  handleDeleteField: (id: number) => Promise<void>;
  openCreateAlias: (fieldId: number) => void;
  openEditAlias: (fieldId: number, a: MetadataFieldAlias) => void;
  handleDeleteAlias: (aliasId: number) => Promise<void>;
}

export function ConfigFieldTable({
  rows,
  canQuery,
  listLoading,
  openEditField,
  handleDeleteField,
  openCreateAlias,
  openEditAlias,
  handleDeleteAlias,
}: ConfigFieldTableProps) {
  const columns: ColumnsType<MetadataField> = [
    { title: "field_key", dataIndex: "field_key", width: 160, ellipsis: true },
    { title: "字段名", dataIndex: "field_name", width: 140, ellipsis: true },
    {
      title: "值类型",
      dataIndex: "value_type",
      width: 88,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: "抽取",
      dataIndex: "extract_mode",
      width: 96,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    { title: "优先级", dataIndex: "priority", width: 80 },
    {
      title: "状态",
      dataIndex: "status",
      width: 80,
      render: (s: number) => (s === 1 ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, row) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditField(row)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该字段及全部别名？"
            onConfirm={() => void handleDeleteField(row.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<MetadataField>
      rowKey="id"
      size="small"
      scroll={{ x: 960 }}
      columns={columns}
      dataSource={canQuery ? rows : []}
      pagination={false}
      loading={listLoading}
      locale={{
        emptyText: !canQuery ? "请先完成作用域条件" : "暂无字段配置",
      }}
      expandable={{
        expandedRowRender: (record) => (
          <div className="px-2 py-1">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Typography.Text strong>别名</Typography.Text>
              <Button
                size="small"
                type="link"
                icon={<PlusOutlined />}
                onClick={() => openCreateAlias(record.id)}
              >
                添加别名
              </Button>
            </div>
            <Table<MetadataFieldAlias>
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={record.aliases ?? []}
              columns={[
                { title: "alias_text", dataIndex: "alias_text" },
                {
                  title: "match_mode",
                  dataIndex: "match_mode",
                  width: 110,
                  render: (t: string) => <Tag>{t}</Tag>,
                },
                { title: "优先级", dataIndex: "priority", width: 80 },
                {
                  title: "状态",
                  dataIndex: "status",
                  width: 72,
                  render: (s: number) => (s === 1 ? "启用" : "禁用"),
                },
                {
                  title: "操作",
                  key: "a",
                  width: 140,
                  render: (_, a) => (
                    <Space size="small">
                      <Button
                        type="link"
                        size="small"
                        onClick={() => openEditAlias(record.id, a)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="删除该别名？"
                        onConfirm={() => void handleDeleteAlias(a.id)}
                      >
                        <Button type="link" size="small" danger>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        ),
      }}
    />
  );
}
