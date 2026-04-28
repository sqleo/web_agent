"use client";

import { Modal, Spin, Space, Typography, Select, Radio, Input } from "antd";
import type { ChatCheckpointItem } from "../types";

interface TravelModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  confirmLoading: boolean;
  loading: boolean;
  travelCheckpoints: ChatCheckpointItem[];
  travelCheckpointId: string | undefined;
  setTravelCheckpointId: (v: string) => void;
  travelMode: "fork" | "replay";
  setTravelMode: (v: "fork" | "replay") => void;
  travelForkInput: string;
  setTravelForkInput: (v: string) => void;
}

export function TravelModal({
  open,
  onCancel,
  onOk,
  confirmLoading,
  loading,
  travelCheckpoints,
  travelCheckpointId,
  setTravelCheckpointId,
  travelMode,
  setTravelMode,
  travelForkInput,
  setTravelForkInput,
}: TravelModalProps) {
  return (
    <Modal
      title="时间旅行"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      okText="执行"
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <Space orientation="vertical" size="middle" className="w-full" style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            fork 会创建新分支并可能返回新 thread_id；replay 在当前线程重放。之后可与「继续生成」配合从中断点恢复。
          </Typography.Text>
          <div className="w-full" style={{ width: "100%" }}>
            <div className="mb-1">Checkpoint</div>
            <Select
              className="w-full"
              style={{ width: "100%" }}
              placeholder="选择 checkpoint"
              value={travelCheckpointId}
              onChange={setTravelCheckpointId}
              options={travelCheckpoints.map((c) => ({
                value: c.checkpoint_id,
                label: `${c.timestamp} · ${c.content_preview.slice(0, 40)}${
                  c.content_preview.length > 40 ? "…" : ""
                }`,
              }))}
              notFoundContent={loading ? <Spin size="small" /> : undefined}
            />
          </div>
          <Radio.Group
            value={travelMode}
            onChange={(e) => setTravelMode(e.target.value)}
          >
            <Radio value="fork">fork（新分支）</Radio>
            <Radio value="replay">replay（重放）</Radio>
          </Radio.Group>
          {travelMode === "fork" ? (
            <Input.TextArea
              placeholder="可选：分叉后的新输入"
              value={travelForkInput}
              onChange={(e) => setTravelForkInput(e.target.value)}
              rows={3}
            />
          ) : null}
        </Space>
      </Spin>
    </Modal>
  );
}
