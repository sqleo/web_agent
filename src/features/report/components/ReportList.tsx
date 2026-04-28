"use client";

import { DeleteOutlined, FileTextOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Card, Popconfirm, Spin, Tag, Typography } from "antd";
import type { ReportItem } from "../types";

interface ReportListProps {
  loading: boolean;
  items: ReportItem[];
  selectedId?: string;
  onSelect: (item: ReportItem) => void;
  onDelete: (id: string) => Promise<void>;
}

export function ReportList({
  loading,
  items,
  selectedId,
  onSelect,
  onDelete,
}: ReportListProps) {
  return (
    <Card size="small" title="研报历史" variant="borderless" className="h-full">
      <Spin spinning={loading}>
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-all hover:bg-[var(--bg3)] ${
                  isSelected ? "bg-[var(--bg3)] font-medium border-l-4 border-l-blue-500" : ""
                }`}
                onClick={() => onSelect(item)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.status === "generating" ? (
                    <LoadingOutlined className="text-blue-500 shrink-0" />
                  ) : (
                    <FileTextOutlined className="text-gray-400 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Typography.Text ellipsis className="block !text-sm">
                      {item.topic}
                    </Typography.Text>
                    <div className="flex items-center gap-2 mt-1">
                      <Typography.Text type="secondary" className="text-xs">
                        {item.created_at.slice(5, 16)}
                      </Typography.Text>
                      {item.status === "generating" && (
                        <Tag color="blue" className="text-[10px] px-1 py-0 m-0">
                          生成中
                        </Tag>
                      )}
                      {item.status === "success" && (
                        <Tag color="green" className="text-[10px] px-1 py-0 m-0">
                          完成
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                <Popconfirm
                  title="确定删除这份研报？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    void onDelete(item.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                </Popconfirm>
              </div>
            );
          })}
        </div>
      </Spin>
    </Card>
  );
}
