"use client";

import { useState, useRef } from 'react';
import { Input, Button, Spin, Steps, message as antdMessage, Result, Form, Card, Space } from 'antd';
import { SendOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getReportGenerateUrl } from '@/lib/agent-chat-url';
import { resolveApiPublicUrl } from '@/lib/api-public-url';
import { getAuthorizationHeaderValue } from '@/api/auth-storage';

const NODE_LABELS: Record<string, string> = {
  intent: '解析意图',
  planner: '调研规划',
  researcher: '调研研究',
  outliner: '生成大纲',
  human_review: '人工审核',
  writer: '报告撰写',
};

const SSE_URL = getReportGenerateUrl();
const API_BASE = getReportGenerateUrl().replace(/\/report\/generate$/, '');

function ReportAgentPage() {
    // 发送消息并建立 SSE 连接
    const handleSend = async () => {
      if (!input.trim()) return;
      setChat((prev) => [...prev, { role: 'user', content: input }]);
      setLoading(true);
      setSteps([]);
      setCurrentStep(0);
      setDone(false);
      setFinalContent('');
      setInterrupted(null);
      setInput('');
      try {
        // 1. 先POST创建任务
        const resp = await fetch(`${API_BASE}/report/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthorizationHeaderValue() || '',
          },
          body: JSON.stringify({ user_query: input }),
        });
        const result = await resp.json();
        if (!resp.ok || result.code !== 0 || !result.data?.thread_id) {
          antdMessage.error(result.message || '创建报告任务失败');
          setLoading(false);
          return;
        }
        const tid = result.data.thread_id;
        setThreadId(tid);
        // 2. 用 EventSource 监听 stream
        const streamUrl = `${API_BASE}/report/stream/${encodeURIComponent(tid)}`;
        const es = new window.EventSource(streamUrl);
        eventSourceRef.current = es;
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'start':
                setSteps([{ title: '任务开始', status: 'process', type: 'start' }]);
                setCurrentStep(0);
                break;
              case 'node_start':
                setSteps((prev) => [
                  ...prev,
                  { title: NODE_LABELS[data.node] || data.node, status: 'process', type: 'node_start', node: data.node },
                ]);
                setCurrentStep((prev) => prev + 1);
                break;
              case 'node_end':
                setSteps((prev) =>
                  prev.map((step, idx) =>
                    step.node === data.node
                      ? { ...step, status: 'finish', output: data.output, type: 'node_end' }
                      : step
                  )
                );
                break;
              case 'message':
                setChat((prev) => [
                  ...prev,
                  { role: 'assistant', content: data.content },
                ]);
                break;
              case 'tool_start':
                setSteps((prev) => [
                  ...prev,
                  { title: `工具调用: ${data.tool}`, status: 'process', type: 'tool_start', tool: data.tool, input: data.input },
                ]);
                setCurrentStep((prev) => prev + 1);
                break;
              case 'tool_end':
                setSteps((prev) =>
                  prev.map((step) =>
                    step.tool === data.tool && step.type === 'tool_start'
                      ? { ...step, status: 'finish', output: data.output, type: 'tool_end' }
                      : step
                  )
                );
                break;
              case 'interrupted': {
                setInterrupted({
                  thread_id: data.thread_id,
                  payload: data.payload,
                });
                setLoading(false);
                break;
              }
              case 'done':
                setDone(true);
                setLoading(false);
                setFinalContent(data.content || '');
                es.close();
                break;
              case 'error':
                antdMessage.error(data.message || '发生错误');
                setLoading(false);
                es.close();
                break;
              default:
                break;
            }
          } catch (e) {
            // ignore
          }
        };
        es.onerror = () => {
          setLoading(false);
          es.close();
        };
      } catch (e: any) {
        antdMessage.error(e?.message || '请求失败');
        setLoading(false);
      }
    };
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [chat, setChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [interrupted, setInterrupted] = useState<any>(null);
  const [done, setDone] = useState(false);
  const [finalContent, setFinalContent] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);
// ...existing code...
// ...existing code...

  // 修正 handleResume 逻辑为 async/await
  const handleResume = async (values: any) => {
    setLoading(true);
    try {
      const updates: any = {};
      if (values.outline) updates.outline = values.outline;
      const resp = await fetch(resolveApiPublicUrl('/report/resume'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthorizationHeaderValue() || '',
        },
        body: JSON.stringify({
          thread_id: values.thread_id || (interrupted && interrupted.thread_id),
          action: values.action,
          updates,
        }),
      });
      const result = await resp.json();
      if (!resp.ok || result.code !== 0) {
        antdMessage.error(result.message || '操作失败');
        setLoading(false);
        return;
      }
      setInterrupted(null);
      // 重新监听流
      const tid = values.thread_id || (interrupted && interrupted.thread_id);
      const streamUrl = `${API_BASE}/report/stream/${encodeURIComponent(tid)}`;
      const es = new window.EventSource(streamUrl);
      eventSourceRef.current = es;
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'start':
              setSteps([{ title: '任务开始', status: 'process', type: 'start' }]);
              setCurrentStep(0);
              break;
            case 'node_start':
              setSteps((prev) => [
                ...prev,
                { title: NODE_LABELS[data.node] || data.node, status: 'process', type: 'node_start', node: data.node },
              ]);
              setCurrentStep((prev) => prev + 1);
              break;
            case 'node_end':
              setSteps((prev) =>
                prev.map((step, idx) =>
                  step.node === data.node
                    ? { ...step, status: 'finish', output: data.output, type: 'node_end' }
                    : step
                )
              );
              break;
            case 'message':
              setChat((prev) => [
                ...prev,
                { role: 'assistant', content: data.content },
              ]);
              break;
            case 'tool_start':
              setSteps((prev) => [
                ...prev,
                { title: `工具调用: ${data.tool}`, status: 'process', type: 'tool_start', tool: data.tool, input: data.input },
              ]);
              setCurrentStep((prev) => prev + 1);
              break;
            case 'tool_end':
              setSteps((prev) =>
                prev.map((step) =>
                  step.tool === data.tool && step.type === 'tool_start'
                    ? { ...step, status: 'finish', output: data.output, type: 'tool_end' }
                    : step
                )
              );
              break;
            case 'interrupted': {
              setInterrupted({
                thread_id: data.thread_id,
                payload: data.payload,
              });
              setLoading(false);
              break;
            }
            case 'done':
              setDone(true);
              setLoading(false);
              setFinalContent(data.content || '');
              es.close();
              break;
            case 'error':
              antdMessage.error(data.message || '发生错误');
              setLoading(false);
              es.close();
              break;
            default:
              break;
          }
        } catch (e) {
          // ignore
        }
      };
      es.onerror = () => {
        setLoading(false);
        es.close();
      };
    } catch (e: any) {
      antdMessage.error(e?.message || '请求失败');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <Card variant="outlined" style={{ marginBottom: 24 }}>
        <Steps
          orientation="vertical"
          size="small"
          current={currentStep}
          items={steps.map((step, idx) => {
            let icon = undefined;
            let color = undefined;
            let desc = step.output ? (
              <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(step.output, null, 2)}</pre>
            ) : null;
            if (step.type === 'node_start') {
              icon = <LoadingOutlined style={{ color: '#1890ff' }} />;
              color = '#1890ff';
              desc = <span style={{ color: '#1890ff' }}>思考中：{step.title}</span>;
            } else if (step.type === 'node_end') {
              icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
              color = '#52c41a';
              desc = <span style={{ color: '#52c41a' }}>完成：{step.title}</span>;
            } else if (step.type === 'tool_start') {
              icon = <LoadingOutlined style={{ color: '#faad14' }} />;
              color = '#faad14';
              desc = <span style={{ color: '#faad14' }}>工具调用：{step.tool}</span>;
            } else if (step.type === 'tool_end') {
              icon = <CheckCircleOutlined style={{ color: '#faad14' }} />;
              color = '#faad14';
              desc = <span style={{ color: '#faad14' }}>工具完成：{step.tool}</span>;
            } else if (step.type === 'start') {
              icon = <LoadingOutlined />;
              desc = <span>任务开始</span>;
            }
            return {
              key: idx,
              title: <span style={color ? { color } : {}}>{step.title}</span>,
              status: step.status === 'finish' ? 'finish' : step.status === 'process' ? 'process' : 'wait',
              icon,
              description: desc,
            };
          })}
        />
      </Card>
      <div style={{ minHeight: 300, marginBottom: 24, overflowY: 'auto', scrollBehavior: 'smooth', maxHeight: 360 }} id="chat-scroll-area">
        {chat.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
              alignItems: 'flex-end',
            }}
          >
            {msg.role !== 'user' && (
              <span style={{ marginRight: 8, fontSize: 18 }}>🤖</span>
            )}
            <div
              style={{
                maxWidth: 420,
                background: msg.role === 'user' ? 'linear-gradient(90deg,#e6f7ff,#bae7ff)' : 'linear-gradient(90deg,#f6ffed,#d9f7be)',
                color: msg.role === 'user' ? '#1890ff' : '#389e0d',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '10px 18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                fontSize: 16,
                transition: 'all 0.2s',
                animation: 'bubbleIn 0.3s',
                wordBreak: 'break-all',
              }}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <span style={{ marginLeft: 8, fontSize: 18 }}>🧑</span>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'center', margin: 16 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /> 正在生成...
          </div>
        )}
        <style>{`
          @keyframes bubbleIn {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
      {interrupted && (
        <Card style={{ marginBottom: 24, border: '1px solid #faad14', background: '#fffbe6', boxShadow: '0 2px 8px #faad1440' }}>
          <h3 style={{ color: '#faad14', marginBottom: 0 }}>需要人工审核</h3>
          <div style={{ marginBottom: 16, fontSize: 16 }}>{interrupted.message}</div>
          <Form
            layout="vertical"
            onFinish={handleResume}
            initialValues={{ action: interrupted.options?.[0] }}
            style={{ marginTop: 8 }}
          >
            <Form.Item label="大纲" name="outline">
              <details style={{ background: '#f6f6f6', padding: 8, borderRadius: 6, fontSize: 15 }}>
                <summary style={{ cursor: 'pointer', color: '#faad14', fontWeight: 500 }}>点击展开/收起大纲</summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(interrupted.data?.outline, null, 2)}</pre>
              </details>
            </Form.Item>
            <Form.Item label="操作" name="action" rules={[{ required: true, message: '请选择操作' }]}> 
              <Space.Compact block>
                {interrupted.options?.map((opt: string) => (
                  <Button
                    key={opt}
                    value={opt}
                    htmlType="submit"
                    type="primary"
                    style={{ minWidth: 100, fontWeight: 500, background: '#faad14', borderColor: '#faad14', color: '#fff', marginRight: 8 }}
                  >
                    {opt}
                  </Button>
                ))}
              </Space.Compact>
            </Form.Item>
          </Form>
        </Card>
      )}
      {done && (
        <Result
          status="success"
          title={<span style={{ color: '#389e0d' }}>报告生成完成</span>}
          subTitle={<span style={{ color: '#555' }}>以下为撰写内容，可复制：</span>}
          extra={
            <div style={{ position: 'relative', background: '#f6f6f6', borderRadius: 8, padding: 16, textAlign: 'left', fontSize: 16 }}>
              <Button
                size="small"
                style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                onClick={() => {
                  navigator.clipboard.writeText(finalContent);
                  antdMessage.success('内容已复制');
                }}
              >复制</Button>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'none', fontFamily: 'inherit' }}>{finalContent}</pre>
            </div>
          }
        />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="请输入调研主题，如：2026年前端就业市场分析"
          disabled={loading || !!interrupted}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={loading || !!interrupted || !input.trim()}
        >
          发送
        </Button>
      </div>
    </div>
  );

}

export default ReportAgentPage;
