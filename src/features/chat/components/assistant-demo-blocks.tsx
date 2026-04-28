"use client";

import { Space, Typography } from "antd";
import {
  CodeHighlighter,
  Mermaid,
  Sources,
  Think,
  ThoughtChain,
} from "@ant-design/x";

const DEMO_CODE = `function estimateRecall(hits: number, total: number) {
  return total === 0 ? 0 : Math.round((hits / total) * 10000) / 100;
}

export default estimateRecall;`;

const DEMO_MERMAID = `graph LR
  Q[用户问题] --> R[向量检索]
  R --> M[重排序]
  M --> L[LLM 生成]
  L --> C[代码/图表]
`;

type Props = {
  /** 为 false 时仅展示简短文本，用于后续轮次 */
  full?: boolean;
};

/** 演示：思考过程、思维链、代码（可复制）、Mermaid 图表、引用来源 */
export function AssistantDemoBlocks({ full = true }: Props) {
  if (!full) {
    return (
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        已收到。连接真实对话接口后，这里将展示模型流式输出。
      </Typography.Paragraph>
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Think title="思考过程" defaultExpanded>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          先判断用户意图属于「数据分析」；需要检索知识库中指标定义，再决定用代码计算还是直接回答；最后检查是否需附图说明。
        </Typography.Paragraph>
      </Think>

      <ThoughtChain
        items={[
          {
            key: "1",
            title: "检索知识库",
            description: "命中 3 条相关片段",
            status: "success",
          },
          {
            key: "2",
            title: "调用分析工具",
            description: "estimateRecall 计算完成",
            status: "success",
          },
        ]}
      />

      <Typography.Paragraph style={{ marginBottom: 0 }}>
        下面是示例回答：包含可复制的代码、流程图与引用来源（接入真实接口后替换为模型输出）。
      </Typography.Paragraph>

      <CodeHighlighter lang="typescript">{DEMO_CODE}</CodeHighlighter>

      <Mermaid actions={{ enableCopy: true, enableZoom: true }}>{DEMO_MERMAID}</Mermaid>

      <Sources
        title="引用来源"
        items={[
          {
            key: "1",
            title: "产品指标口径说明",
            description: "召回率 = 命中片段数 / 检索返回总数",
            url: "https://example.com/docs/metrics",
          },
          {
            key: "2",
            title: "RAG 评估笔记",
            description: "内部 Wiki",
          },
        ]}
      />
    </Space>
  );
}
