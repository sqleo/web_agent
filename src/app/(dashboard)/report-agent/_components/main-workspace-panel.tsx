"use client";

import {
  CheckCircleFilled,
  ClockCircleFilled,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  RedoOutlined,
  RocketOutlined,
  SyncOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Badge, Button, Card, Flex, Input, Progress, Select, Space, Tag, Typography } from "antd";
import { PRESET_SOURCES, PRESET_TYPES, STEP_ITEMS, type GenerateForm, type OutlineSectionView, type Phase, type ReportTask } from "../types";

type MainWorkspacePanelProps = {
  hasStarted: boolean;
  activeTask: ReportTask | null;
  activeViewPhase: Phase;
  phaseIndex: number;
  form: GenerateForm;
  loading: boolean;
  selectedTypes: string[];
  selectedSources: string[];
  outlineSections: OutlineSectionView[];
  onSetForm: (updater: (prev: GenerateForm) => GenerateForm) => void;
  onSetSelectedTypes: (updater: (prev: string[]) => string[]) => void;
  onSetSelectedSources: (updater: (prev: string[]) => string[]) => void;
  onStartGenerate: () => void;
  onSetHasStarted: (value: boolean) => void;
  onSetViewPhase: (phase: Phase | null) => void;
  onRefreshStatus: () => void;
  onRollbackToPlanner: () => void;
  onResumeConfirm: () => void;
  onResumeRevise: (revisedOutline: unknown[]) => void;
  onAbort: () => void;
};

export function MainWorkspacePanel({
  hasStarted,
  activeTask,
  activeViewPhase,
  phaseIndex,
  form,
  loading,
  selectedTypes,
  selectedSources,
  outlineSections,
  onSetForm,
  onSetSelectedTypes,
  onSetSelectedSources,
  onStartGenerate,
  onSetHasStarted,
  onSetViewPhase,
  onRefreshStatus,
  onRollbackToPlanner,
  onResumeConfirm,
  onResumeRevise,
  onAbort,
}: MainWorkspacePanelProps) {
  return (
    <Card
      style={{
        flex: 1,
        background: "#0F172A",
        borderColor: "rgba(148,163,184,0.24)",
      }}
      styles={{ body: { height: "100%", padding: 18, display: "flex", flexDirection: "column" } }}
    >
      {!hasStarted ? (
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 24 }}>
            新建研究报告
          </Typography.Title>
          <Input.TextArea
            value={form.userQuery}
            onChange={(e) => onSetForm((p) => ({ ...p, userQuery: e.target.value }))}
            placeholder="例如：分析 2026 年固态电池市场竞争格局，重点关注中国企业"
            rows={4}
          />
          <Space wrap>
            {PRESET_TYPES.map((t) => (
              <Tag.CheckableTag
                key={t}
                checked={selectedTypes.includes(t)}
                onChange={(checked) =>
                  onSetSelectedTypes((prev) => (checked ? [...prev, t] : prev.filter((x) => x !== t)))
                }
              >
                {t}
              </Tag.CheckableTag>
            ))}
          </Space>
          <Space wrap>
            {PRESET_SOURCES.map((s) => (
              <Tag.CheckableTag
                key={s}
                checked={selectedSources.includes(s)}
                onChange={(checked) =>
                  onSetSelectedSources((prev) => (checked ? [...prev, s] : prev.filter((x) => x !== s)))
                }
              >
                {s}
              </Tag.CheckableTag>
            ))}
          </Space>
          <Flex gap={10}>
            <Select
              style={{ flex: 1 }}
              value={form.depth}
              options={[
                { value: "lite", label: "分析深度：轻量分析" },
                { value: "deep", label: "分析深度：深度分析（8-12章）" },
              ]}
              onChange={(v) => onSetForm((p) => ({ ...p, depth: v }))}
            />
            <Select
              style={{ flex: 1 }}
              value={form.output}
              options={[
                { value: "markdown", label: "输出格式：Markdown" },
                { value: "pdf", label: "输出格式：PDF 正式报告" },
              ]}
              onChange={(v) => onSetForm((p) => ({ ...p, output: v }))}
            />
          </Flex>
          <Flex gap={10}>
            <Select
              style={{ flex: 1 }}
              value={form.style}
              options={[
                { value: "academic", label: "语言风格：学术研究风格" },
                { value: "business", label: "语言风格：商业决策风格" },
              ]}
              onChange={(v) => onSetForm((p) => ({ ...p, style: v }))}
            />
            <Select
              style={{ flex: 1 }}
              value={form.review}
              options={[
                { value: "manual", label: "大纲审核：人工审核（推荐）" },
                { value: "auto", label: "大纲审核：自动审核跳过" },
              ]}
              onChange={(v) => onSetForm((p) => ({ ...p, review: v }))}
            />
          </Flex>
          <Input
            value={form.extra}
            onChange={(e) => onSetForm((p) => ({ ...p, extra: e.target.value }))}
            placeholder="额外指令（可选）"
          />
          <Button
            type="primary"
            className="geek-accent-gradient"
            icon={<RocketOutlined />}
            loading={loading}
            onClick={onStartGenerate}
            size="large"
          >
            启动 Agent 研究
          </Button>
        </Space>
      ) : !activeTask ? (
        <Flex align="center" justify="center" style={{ height: "100%" }}>
          <Space orientation="vertical" align="center">
            <Typography.Text type="secondary">当前没有选中的报告任务</Typography.Text>
            <Button
              type="primary"
              className="geek-accent-gradient"
              onClick={() => {
                onSetHasStarted(false);
                onSetViewPhase(null);
              }}
            >
              返回新建报告
            </Button>
          </Space>
        </Flex>
      ) : (
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          <Flex
            gap={4}
            style={{
              borderBottom: "1px solid rgba(148,163,184,0.2)",
              paddingBottom: 0,
              marginBottom: 4,
            }}
          >
            {STEP_ITEMS.map((item, idx) => {
              const done = idx < phaseIndex;
              const active = item.key === activeViewPhase;
              const reachable = idx <= phaseIndex;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (!reachable) return;
                    onSetViewPhase(item.key);
                  }}
                  disabled={!reachable}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: done
                      ? "#10B981"
                      : active
                      ? "#3B82F6"
                      : reachable
                      ? "rgba(148,163,184,0.85)"
                      : "rgba(100,116,139,0.55)",
                    borderBottom: active ? "2px solid #3B82F6" : "2px solid transparent",
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: reachable ? "pointer" : "not-allowed",
                    opacity: reachable ? 1 : 0.72,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </Flex>
          <Flex justify="space-between" align="center">
            <Typography.Title level={4} style={{ margin: 0, fontSize: 28 }}>
              {STEP_ITEMS.find((s) => s.key === activeViewPhase)?.label ?? "任务详情"}
            </Typography.Title>
            <Space>
              <Button icon={<SyncOutlined />} onClick={onRefreshStatus}>
                实时刷新
              </Button>
              <Badge
                status={
                  activeTask.runtimeStatus === "interrupted"
                    ? "warning"
                    : activeTask.runtimeStatus === "running"
                    ? "success"
                    : "processing"
                }
                text={activeTask.runtimeStatus}
              />
            </Space>
          </Flex>

          <Progress percent={activeTask.progress} strokeColor={{ "0%": "#3B82F6", "100%": "#8B5CF6" }} />

          <Card
            size="small"
            style={{ background: "rgba(30,41,59,0.68)", borderColor: "rgba(148,163,184,0.24)" }}
          >
            <Space wrap>
              <Tag color="blue">主题：{activeTask.query}</Tag>
              <Tag color="purple">类型：{selectedTypes.join(" / ")}</Tag>
              <Tag color="cyan">数据源：{selectedSources.join(" + ")}</Tag>
              <Tag color="success">
                进度：{activeTask.chunksDone}/{activeTask.chunksTotal}
              </Tag>
            </Space>
          </Card>

          {activeViewPhase === "outline" ? (
            <Card
              title="大纲审核"
              size="small"
              style={{ background: "rgba(30,41,59,0.68)", borderColor: "rgba(148,163,184,0.24)" }}
              extra={
                <Tag color="warning" icon={<ClockCircleFilled />}>
                  等待审核
                </Tag>
              }
            >
              <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
                {outlineSections.map((sec, idx) => (
                  <Card
                    key={`${sec.title}-${idx}`}
                    size="small"
                    style={{
                      background: "rgba(15,23,42,0.55)",
                      borderColor: "rgba(148,163,184,0.2)",
                      borderRadius: 14,
                    }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                      <Flex align="center" gap={10}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#BFDBFE",
                            background: "rgba(59,130,246,0.18)",
                            border: "1px solid rgba(59,130,246,0.32)",
                          }}
                        >
                          {idx + 1}
                        </div>
                        <Typography.Text style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>
                          {sec.title}
                        </Typography.Text>
                      </Flex>
                      <ul style={{ margin: 0, paddingLeft: 22, color: "rgba(203,213,225,0.95)" }}>
                        {sec.bullets.map((b, i) => (
                          <li key={`${b}-${i}`} style={{ marginBottom: 6, fontSize: 12 }}>
                            {b}
                          </li>
                        ))}
                      </ul>
                      <Space wrap>
                        {sec.tags.map((t) => (
                          <Tag
                            key={t}
                            style={{
                              color: "#C4B5FD",
                              borderColor: "rgba(139,92,246,0.35)",
                              background: "rgba(139,92,246,0.14)",
                              borderRadius: 999,
                              fontSize: 11,
                              lineHeight: "18px",
                              paddingInline: 8,
                            }}
                          >
                            {t}
                          </Tag>
                        ))}
                      </Space>
                      <Space style={{ marginTop: 6, opacity: 0.8 }}>
                        <Button size="small" icon={<EditOutlined />} />
                        <Button size="small" icon={<RedoOutlined />} />
                        <Button size="small" icon={<DeleteOutlined />} />
                      </Space>
                    </Space>
                  </Card>
                ))}

                <div
                  style={{
                    borderTop: "1px solid rgba(148,163,184,0.2)",
                    paddingTop: 12,
                    marginTop: 2,
                  }}
                >
                  <Typography.Text style={{ color: "#F59E0B", fontSize: 12 }}>
                    大纲已就绪，共 {outlineSections.length} 章节，可直接点击章节文本编辑
                  </Typography.Text>
                </div>
              </Space>
            </Card>
          ) : null}

          {activeViewPhase === "research" ? (
            <Card
              title="调研进行中 · 证据流"
              size="small"
              style={{ background: "rgba(30,41,59,0.68)", borderColor: "rgba(148,163,184,0.24)" }}
              extra={
                <Tag color="success" icon={<LoadingOutlined />}>
                  运行中
                </Tag>
              }
            >
              <Typography.Text type="secondary">
                已发现 {activeTask.chunksDone} 条线索，正在并行抓取并清洗证据。
              </Typography.Text>
              <div style={{ marginTop: 12 }}>
                {[
                  "宁德时代 2025 全固态技术发布会",
                  "QuantumScape Q4 财报",
                  "固态电池专利格局分析 · IDC",
                  "Toyota 全固态电池量产路线图",
                  "欧盟电池法规最新动态 · 2026",
                ].map((item, idx) => (
                  <Card
                    key={item}
                    size="small"
                    style={{
                      marginTop: idx === 0 ? 0 : 8,
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(148,163,184,0.2)",
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <Typography.Text>{item}</Typography.Text>
                      <Tag color="success">{97 - idx * 3}%</Tag>
                    </Flex>
                  </Card>
                ))}
              </div>
            </Card>
          ) : null}

          {activeViewPhase === "write" || activeViewPhase === "final" ? (
            <Card
              title={activeViewPhase === "write" ? "并行撰写中 · 实时预览" : "最终报告"}
              size="small"
              style={{ background: "rgba(30,41,59,0.68)", borderColor: "rgba(148,163,184,0.24)" }}
              extra={
                activeViewPhase === "write" ? (
                  <Tag color="success" icon={<LoadingOutlined />}>
                    撰写中
                  </Tag>
                ) : (
                  <Tag color="success" icon={<CheckCircleFilled />}>
                    报告完成
                  </Tag>
                )
              }
            >
              {activeViewPhase === "write" ? (
                <Space orientation="vertical" style={{ width: "100%" }}>
                  {[
                    ["固态电池技术全景", "质量 8.7/10", "ok"],
                    ["全球竞争格局", "撰写中", "writing"],
                    ["市场规模与增长预测", "撰写中", "writing"],
                    ["政策与资本环境", "重写中", "warn"],
                  ].map(([title, stat, kind]) => (
                    <div key={title} style={{ marginBottom: 8 }}>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                        <Typography.Text>{title}</Typography.Text>
                        <Tag color={kind === "ok" ? "success" : kind === "warn" ? "warning" : "processing"}>
                          {stat}
                        </Tag>
                      </Flex>
                      <Typography.Paragraph style={{ marginBottom: 0, color: "rgba(203,213,225,0.9)" }}>
                        {activeTask.draftText.slice(0, 140) || "正在并行生成该章节内容..."}
                      </Typography.Paragraph>
                    </div>
                  ))}
                </Space>
              ) : (
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Card
                    size="small"
                    style={{
                      background: "linear-gradient(135deg, rgba(59,130,246,.15), rgba(139,92,246,.2))",
                      borderColor: "rgba(99,102,241,.3)",
                    }}
                  >
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      2026 固态电池市场竞争格局分析
                    </Typography.Title>
                    <Typography.Text type="secondary">AgentLab · 综合 28 条来源 · 27 页</Typography.Text>
                  </Card>
                  <Typography.Paragraph style={{ whiteSpace: "pre-wrap", maxHeight: 260, overflow: "auto" }}>
                    {activeTask.draftText || "报告正文预览..."}
                  </Typography.Paragraph>
                </Space>
              )}
              {activeViewPhase === "final" ? (
                <Space>
                  <Button icon={<WarningFilled />}>重新生成此段</Button>
                  <Button>分享链接</Button>
                  <Button type="primary" className="geek-accent-gradient">
                    下载 PDF
                  </Button>
                </Space>
              ) : (
                <Space>
                  <Button danger onClick={onAbort}>
                    暂停
                  </Button>
                  <Button type="primary" className="geek-accent-gradient" onClick={onRefreshStatus}>
                    完成并继续
                  </Button>
                </Space>
              )}
            </Card>
          ) : null}

          {activeViewPhase === "intent" ? (
            <Card
              title="意图确认"
              size="small"
              style={{ background: "rgba(30,41,59,0.68)", borderColor: "rgba(148,163,184,0.24)" }}
            >
              <Space orientation="vertical" style={{ width: "100%" }} size="middle">
                <Card
                  size="small"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    borderColor: "rgba(99,102,241,0.25)",
                  }}
                >
                  <Typography.Text style={{ color: "#818CF8", fontSize: 12 }}>
                    ● 意图识别结果，点击补充缺失项
                  </Typography.Text>
                  <Space wrap style={{ marginTop: 10 }}>
                    <Tag color="blue">主题：{activeTask.intentData?.topic || form.userQuery || "待补充"}</Tag>
                    <Tag color="purple">行业：{activeTask.intentData?.industry || "新能源 / 储能"}</Tag>
                    <Tag color="gold">
                      深度：
                      {activeTask.intentData?.depth ||
                        (form.depth === "deep" ? "深度分析（8-12章）" : "轻量分析")}
                    </Tag>
                    <Tag color="cyan">格式：{activeTask.intentData?.output_format || form.output.toUpperCase()}</Tag>
                    <Tag color="warning">+ {activeTask.intentData?.time_range || "补充时间范围"}</Tag>
                  </Space>
                </Card>

                <Typography.Text type="secondary">以下参数已自动设置，可调整：</Typography.Text>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["分析深度", activeTask.intentData?.depth || "深度分析（8-12章）", "#3B82F6"],
                    ["输出格式", activeTask.intentData?.output_format || "Markdown", "#8B5CF6"],
                    ["语言风格", activeTask.intentData?.style_instruction || "专业咨询风格", "#10B981"],
                    ["大纲审核", form.review === "manual" ? "人工审核（推荐）" : "自动审核", "#F59E0B"],
                  ].map(([k, v, c]) => (
                    <Card
                      key={String(k)}
                      size="small"
                      style={{ background: "rgba(255,255,255,.03)", borderColor: "rgba(148,163,184,0.24)" }}
                    >
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {k}
                      </Typography.Text>
                      <div style={{ color: String(c), fontSize: 13, fontWeight: 600 }}>{v}</div>
                    </Card>
                  ))}
                </div>
              </Space>
            </Card>
          ) : null}
          <div
            style={{
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 10,
              padding: "10px 12px",
              marginTop: 4,
              background: "rgba(15,23,42,0.45)",
            }}
          >
            <Flex justify="space-between" align="center" gap={10} wrap>
              <Typography.Text type="secondary" style={{ flex: 1, minWidth: 220 }}>
                {activeViewPhase === "outline"
                  ? "大纲已就绪，可直接点击章节文本编辑后批准"
                  : activeViewPhase === "research"
                  ? "调研进行中，可添加来源或直接推进"
                  : activeViewPhase === "write"
                  ? "5 章节并行撰写，自动质检中"
                  : activeViewPhase === "final"
                  ? "报告完成，可导出与分享"
                  : "确认意图后进入调研"}
              </Typography.Text>
              <Space wrap>
                {activeViewPhase === "intent" ? (
                  <>
                    <Button onClick={() => onSetViewPhase("intent")}>修改命题</Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        if (activeTask.runtimeStatus === "interrupted" && activeTask.threadId) {
                          onResumeConfirm();
                          return;
                        }
                        onSetViewPhase("research");
                      }}
                    >
                      确认，开始调研
                    </Button>
                  </>
                ) : null}
                {activeViewPhase === "research" ? (
                  <>
                    <Button>添加来源</Button>
                    <Button type="primary" onClick={() => onSetViewPhase("outline")}>
                      调研完成，生成大纲
                    </Button>
                  </>
                ) : null}
                {activeViewPhase === "outline" ? (
                  <>
                    <Button danger onClick={onRollbackToPlanner}>
                      不满意，重新规划
                    </Button>
                    <Button type="primary" className="geek-accent-gradient" onClick={onResumeConfirm}>
                      批准大纲，开始撰写
                    </Button>
                    <Button
                      type="primary"
                      ghost
                      onClick={() =>
                        onResumeRevise(
                          outlineSections.map((sec, idx) => ({
                            section_id: `s${idx + 1}`,
                            title: sec.title,
                            key_points: sec.bullets,
                          }))
                        )
                      }
                    >
                      保存修改并继续
                    </Button>
                  </>
                ) : null}
                {activeViewPhase === "write" ? (
                  <>
                    <Button onClick={onAbort}>暂停</Button>
                    <Button type="primary" onClick={() => onSetViewPhase("final")}>
                      预览完整报告
                    </Button>
                  </>
                ) : null}
                {activeViewPhase === "final" ? (
                  <>
                    <Button onClick={() => onSetHasStarted(false)}>新建报告</Button>
                    <Button type="primary" className="geek-accent-gradient">
                      导出 PDF
                    </Button>
                  </>
                ) : null}
              </Space>
            </Flex>
          </div>
        </Space>
      )}
    </Card>
  );
}
