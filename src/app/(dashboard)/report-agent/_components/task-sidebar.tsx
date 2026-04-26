"use client";

import { RocketOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Space, Typography } from "antd";
import type { Phase, ReportTask } from "../types";

type TaskSidebarProps = {
  tasks: ReportTask[];
  activeId: string | null;
  tokenColorTextSecondary: string;
  onCreate: () => void;
  onSelectTask: (taskId: string) => void;
  onResetViewPhase: () => void;
};

export function TaskSidebar({
  tasks,
  activeId,
  tokenColorTextSecondary,
  onCreate,
  onSelectTask,
  onResetViewPhase,
}: TaskSidebarProps) {
  const renderTask = (task: ReportTask, type: "primary" | "text") => (
    <Button
      key={task.localId}
      type={type}
      onClick={() => {
        onSelectTask(task.localId);
        onResetViewPhase();
      }}
      block
      style={{ textAlign: "left", justifyContent: "flex-start" }}
    >
      {task.title}
    </Button>
  );

  return (
    <Card
      style={{
        width: 250,
        background: "#162032",
        borderColor: "rgba(148,163,184,0.24)",
      }}
      styles={{ body: { padding: 12, height: "100%", display: "flex", flexDirection: "column" } }}
    >
      <Button type="primary" icon={<RocketOutlined />} className="geek-accent-gradient" onClick={onCreate} block>
        新建报告
      </Button>
      <Divider style={{ borderColor: "rgba(148,163,184,0.18)" }} />
      <Typography.Text style={{ color: tokenColorTextSecondary }}>进行中</Typography.Text>
      <Space orientation="vertical" style={{ width: "100%", marginTop: 8 }}>
        {tasks
          .filter((t) => t.runtimeStatus !== "completed")
          .map((t) => renderTask(t, activeId === t.localId ? "primary" : "text"))}
      </Space>
      <Divider style={{ borderColor: "rgba(148,163,184,0.18)" }} />
      <Typography.Text style={{ color: tokenColorTextSecondary }}>历史报告</Typography.Text>
      <Space orientation="vertical" style={{ width: "100%", marginTop: 8 }}>
        {tasks.filter((t) => t.runtimeStatus === "completed").map((t) => renderTask(t, "text"))}
      </Space>
    </Card>
  );
}
