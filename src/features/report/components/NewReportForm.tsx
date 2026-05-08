"use client";

import { CheckCircleFilled, FileTextOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Tag, Typography } from "antd";
import { useState } from "react";
import type { CreateReportBody } from "../types";

interface NewReportFormProps {
  onSubmit: (values: CreateReportBody) => Promise<void>;
  confirmLoading: boolean;
}

export function NewReportForm({ onSubmit, confirmLoading }: NewReportFormProps) {
  const [form] = Form.useForm<CreateReportBody>();
  const [selectedType, setSelectedType] = useState<string>("竞争格局分析");
  const [selectedSources, setSelectedSources] = useState<string[]>(["internal", "web"]);

  const reportTypes = [
    "竞争格局分析",
    "市场规模预测",
    "技术路线研究",
    "投资价值评估",
    "政策风险扫描",
    "供应链梳理",
  ];

  const dataSources = [
    { key: "internal", title: "内部知识库", desc: "私有研报、会议纪要" },
    { key: "web", title: "实时网络", desc: "新闻、财报、论文" },
    { key: "upload", title: "上传文档", desc: "PDF、Excel、Word" },
    { key: "api", title: "外部 API", desc: "Wind、Bloomberg" },
  ];

  const handleFinish = async (values: any) => {
    // Merge selections
    const finalValues: CreateReportBody = {
      topic: values.topic,
      keywords: [selectedType, ...selectedSources],
    };
    await onSubmit(finalValues);
  };

  const toggleSource = (key: string) => {
    setSelectedSources((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="mx-auto max-w-4xl p-6 text-slate-200">
      <div className="mb-8">
        <Typography.Title level={2} className="!m-0 text-slate-100 font-bold">
          新建研究报告
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 mt-2 text-slate-400 text-sm">
          描述你的研究命题，Agent 将自动规划调研、撰写并输出专业报告。
        </Typography.Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish} className="flex flex-col gap-8">
        {/* Topic Input */}
        <Form.Item
          name="topic"
          rules={[{ required: true, message: "请输入研究命题" }]}
          label={
            <span className="text-slate-300 font-medium flex items-center gap-2">
              研究命题 <Tag color="blue">AI 意图识别</Tag>
            </span>
          }
        >
          <div className="relative p-[1px] rounded-[13px] overflow-hidden group w-full transition-all">
            <div className="absolute inset-0 aurora-border-gradient aurora-border-anim opacity-100" />
            <Input.TextArea
              rows={4}
              placeholder="例如：分析 2026 年固态电池市场竞争格局，重点关注中国企业..."
              className="relative bg-[#1E293B] border-none text-slate-100 rounded-xl hover:bg-[#1E293B]/90 focus:bg-[#1E293B] shadow-inner z-10 m-0 w-full"
            />
          </div>
        </Form.Item>

        {/* Report Type */}
        <div className="flex flex-col gap-3">
          <span className="text-slate-300 font-medium text-sm">报告类型</span>
          <div className="flex flex-wrap gap-2">
            {reportTypes.map((type) => {
              const isSelected = selectedType === type;
              return (
                <Tag.CheckableTag
                  key={type}
                  checked={isSelected}
                  onChange={() => setSelectedType(type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border border-solid transition-all ${
                    isSelected
                      ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {type}
                </Tag.CheckableTag>
              );
            })}
          </div>
        </div>

        {/* Data Sources */}
        <div className="flex flex-col gap-3">
          <span className="text-slate-300 font-medium text-sm">数据来源</span>
          <div className="grid grid-cols-2 gap-4">
            {dataSources.map((src) => {
              const isSelected = selectedSources.includes(src.key);
              return (
                <div
                  key={src.key}
                  onClick={() => toggleSource(src.key)}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border border-solid cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-600/10 border-blue-500/50"
                      : "bg-[#111827] border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isSelected ? "bg-blue-600/20 text-blue-400" : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    <FileTextOutlined className="text-base" />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                      {src.title}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">{src.desc}</span>
                  </div>
                  {isSelected && (
                    <CheckCircleFilled className="absolute top-4 right-4 text-blue-500 text-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="flex flex-col gap-4">
          <span className="text-slate-300 font-medium text-sm">高级参数</span>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={<span className="text-xs text-slate-400">分析深度</span>} name="depth" initialValue="depth">
              <Select
                className="report-select"
                options={[{ value: "depth", label: "深度分析 (8-12章)" }]}
              />
            </Form.Item>
            <Form.Item label={<span className="text-xs text-slate-400">输出格式</span>} name="format" initialValue="pdf">
              <Select
                className="report-select"
                options={[{ value: "pdf", label: "PDF 正式报告" }]}
              />
            </Form.Item>
            <Form.Item label={<span className="text-xs text-slate-400">语言风格</span>} name="style" initialValue="professional">
              <Select
                className="report-select"
                options={[{ value: "professional", label: "专业咨询风格" }]}
              />
            </Form.Item>
            <Form.Item label={<span className="text-xs text-slate-400">大纲审核</span>} name="review" initialValue="manual">
              <Select
                className="report-select"
                options={[{ value: "manual", label: "人工审核 (推荐)" }]}
              />
            </Form.Item>
          </div>
        </div>

        {/* Extra Instructions */}
        <Form.Item
          name="extra"
          label={<span className="text-slate-300 font-medium text-sm">额外指令 (可选)</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="例如：重点关注中国企业的海外布局，对标特斯拉供应商..."
            className="bg-[#111827] border-slate-800 text-slate-100 rounded-xl hover:border-slate-700 focus:border-blue-500"
          />
        </Form.Item>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex w-full gap-4">
            <Button
              className="h-12 flex-1 border-slate-800 bg-slate-900 text-slate-400 hover:text-white rounded-xl font-medium"
            >
              保存草稿
            </Button>
            <div className="relative p-[1px] rounded-[13px] overflow-hidden flex-[3]">
              <div className="absolute inset-0 aurora-border-gradient aurora-border-anim opacity-100" />
              <Button
                type="primary"
                htmlType="submit"
                loading={confirmLoading}
                className="relative h-12 w-full bg-[#1E293B] hover:bg-transparent border-none rounded-xl font-semibold tracking-wide text-white z-10 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8))",
                }}
              >
                启动 Agent 研究
              </Button>
            </div>
          </div>
          <span className="text-slate-500 text-xs">
            ⏱ 预计完成时间：12-20 分钟 · 大纲完成后将暂停等待审核
          </span>
        </div>
      </Form>
    </div>
  );
}
