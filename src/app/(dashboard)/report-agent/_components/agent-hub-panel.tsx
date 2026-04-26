"use client";

import { ClockCircleFilled, PlusOutlined } from "@ant-design/icons";
import { Card, Divider, Flex, Space, Tag, Typography } from "antd";
import type { ReactNode } from "react";
import { STEP_ITEMS, type Phase, type ReportTask } from "../types";

type AgentHubPanelProps = {
  activeTask: ReportTask | null;
  activeViewPhase: Phase;
  viewPhaseIndex: number;
  timelineVisual: (line: string) => { icon: ReactNode; color: string };
};

export function AgentHubPanel({ activeTask, activeViewPhase, viewPhaseIndex, timelineVisual }: AgentHubPanelProps) {
  return (
    <Card
      style={{
        width: 360,
        background: "#1E293B",
        borderColor: "rgba(148,163,184,0.24)",
      }}
      styles={{ body: { height: "100%", padding: 14, display: "flex", flexDirection: "column" } }}
    >
      <Flex align="center" justify="space-between">
        <Space size={8}>
          <PlusOutlined style={{ color: "#8B5CF6" }} />
          <Typography.Text strong>Agent 交互中枢</Typography.Text>
        </Space>
        <Tag
          style={{
            borderRadius: 999,
            borderColor:
              activeTask?.runtimeStatus === "interrupted"
                ? "rgba(245,158,11,0.45)"
                : "rgba(16,185,129,0.55)",
            background:
              activeTask?.runtimeStatus === "interrupted"
                ? "rgba(245,158,11,0.14)"
                : "rgba(16,185,129,0.14)",
            color: activeTask?.runtimeStatus === "interrupted" ? "#FCD34D" : "#34D399",
          }}
        >
          ● {activeTask?.runtimeStatus === "interrupted" ? "等待审核" : "运行中"}
        </Tag>
      </Flex>
      <div style={{ marginTop: 14 }}>
        <Flex align="center" gap={0}>
          {STEP_ITEMS.map((item, idx) => {
            const done = idx < viewPhaseIndex;
            const active = idx === viewPhaseIndex;
            return (
              <Flex key={item.key} align="center" style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: done || active ? "#fff" : "rgba(148,163,184,0.85)",
                    background: done
                      ? "#10B981"
                      : active
                      ? "linear-gradient(135deg, #3B82F6, #8B5CF6)"
                      : "rgba(30,41,59,0.9)",
                    border: done || active ? "none" : "1px solid rgba(148,163,184,0.3)",
                  }}
                >
                  {done ? "✓" : idx + 1}
                </div>
                {idx < 4 ? (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      margin: "0 6px",
                      background: idx < viewPhaseIndex ? "#10B981" : "rgba(71,85,105,0.7)",
                    }}
                  />
                ) : null}
              </Flex>
            );
          })}
        </Flex>
        <Flex style={{ marginTop: 6 }}>
          {STEP_ITEMS.map((item, idx) => (
            <Typography.Text
              key={item.key}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 12,
                color: idx === viewPhaseIndex ? "#F59E0B" : "rgba(148,163,184,0.9)",
                fontWeight: idx === viewPhaseIndex ? 600 : 400,
              }}
            >
              {item.label}
            </Typography.Text>
          ))}
        </Flex>
      </div>
      <Card
        size="small"
        style={{
          marginTop: 14,
          borderRadius: 14,
          border: "none",
          background: "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(139,92,246,0.92))",
        }}
      >
        <Typography.Text style={{ color: "#EAF2FF", fontWeight: 600, fontSize: 16, lineHeight: 1.45 }}>
          {activeTask?.query || "分析 2026 固态电池市场竞争格局，深度报告，PDF 格式"}
        </Typography.Text>
      </Card>
      <Divider style={{ borderColor: "rgba(148,163,184,0.18)" }} />
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeViewPhase === "intent" ? (
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <div
              className="geek-accent-gradient"
              style={{ borderRadius: 20, padding: "14px 18px", alignSelf: "flex-end", maxWidth: "92%" }}
            >
              <Typography.Text style={{ color: "#EFF6FF", fontSize: 15, fontWeight: 600 }}>
                {activeTask?.query || "分析 2026 固态电池市场竞争格局，深度报告"}
              </Typography.Text>
            </div>
            {(activeTask?.timeline ?? [])
              .filter((line) => line.trim().length > 0)
              .map((line, i) => {
                const isAgentBubble =
                  line.includes("请确认报告意图") || line.includes("等待大纲审核") || line.includes("任务中断");
                if (isAgentBubble) {
                  return (
                    <Flex key={`${line}-${i}`} gap={10} align="start">
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "linear-gradient(135deg,#4F46E5,#8B5CF6)",
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                        }}
                      >
                        A
                      </div>
                      <Card
                        size="small"
                        style={{
                          flex: 1,
                          background: "rgba(51,65,85,0.55)",
                          borderColor: "rgba(148,163,184,0.24)",
                          borderRadius: 14,
                        }}
                      >
                        <Typography.Text style={{ color: "rgba(226,232,240,0.95)", fontSize: 13 }}>
                          {line}
                        </Typography.Text>
                      </Card>
                    </Flex>
                  );
                }
                const visual = timelineVisual(line);
                return (
                  <Flex key={`${line}-${i}`} align="center" gap={8}>
                    <span style={{ color: visual.color, fontSize: 15, lineHeight: 1 }}>{visual.icon}</span>
                    <Typography.Text
                      style={{
                        color: "rgba(148,163,184,0.95)",
                        fontSize: line.includes("已创建任务，等待启动") ? 12 : 13,
                      }}
                    >
                      {line}
                    </Typography.Text>
                  </Flex>
                );
              })}
          </Space>
        ) : (
          <Space orientation="vertical" style={{ width: "100%" }}>
            {(activeTask?.timeline ?? ["在左侧点击“新建报告”开始。"]).map((line, i) => {
              const visual = timelineVisual(line);
              const isAssistant = line.includes("等待大纲审核");
              if (isAssistant) {
                return (
                  <Flex key={`${line}-${i}`} gap={10} align="start">
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "linear-gradient(135deg,#4F46E5,#8B5CF6)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                      }}
                    >
                      A
                    </div>
                    <Card
                      size="small"
                      style={{
                        flex: 1,
                        background: "rgba(51,65,85,0.55)",
                        borderColor: "rgba(148,163,184,0.24)",
                        borderRadius: 14,
                      }}
                    >
                      <Typography.Text style={{ color: "#F8FAFC" }}>
                        报告大纲已生成，请在右侧审核并确认大纲。
                      </Typography.Text>
                    </Card>
                  </Flex>
                );
              }
              return (
                <Flex key={`${line}-${i}`} gap={10} align="center">
                  <span style={{ color: visual.color, fontSize: 14, lineHeight: 1 }}>{visual.icon}</span>
                  <Typography.Text
                    style={{
                      color: "rgba(226,232,240,0.9)",
                      fontSize: line.includes("已创建任务，等待启动") ? 12 : 13,
                    }}
                  >
                    {line}
                  </Typography.Text>
                </Flex>
              );
            })}
            {activeTask?.runtimeStatus === "interrupted" ? (
              <Flex gap={10} align="center">
                <ClockCircleFilled style={{ color: "#F59E0B" }} />
                <Typography.Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: 600 }}>
                  等待人工审核大纲...
                </Typography.Text>
              </Flex>
            ) : null}
          </Space>
        )}
      </div>
    </Card>
  );
}
