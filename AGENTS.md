<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.



# 前端架构与开发规范手册 (Ant Design AI 系统版)

本手册旨在指导单人开发环境下，如何通过极致的模块化与规范，构建一个高性能、可维护的 AI 后端管理系统。

---

## 一、 技术栈核心 (Tech Stack)

| 维度 | 选型 | 作用 |
| :--- | :--- | :--- |
| **基础框架** | **Next.js 16 (App Router)** | 核心路由与服务端渲染 |
| **UI 体系** | **Ant Design 6.x** | 后端管理界面基础 |
| **AI 交互** | **Ant Design X** | 聊天气泡、流式对话、输入框 |
| **流程图/图形** | **AntV X6 / AntD Charts** | 关系可视化与数据分析 |
| **接口对接** | **Ky** | 轻量级、基于 Fetch 的接口请求封装 |
| **状态管理** | **Jotai** | 原子化状态管理，替代复杂 Context |
| **代码编辑** | **CodeMirror** | Markdown 与代码块编辑 |

---

## 二、 目录结构规范

采用 **Feature-Driven (功能驱动)** 模式。将业务逻辑从 `components` 中剥离，确保每个功能点自洽。

```text
src/
├── app/                  # 路由入口 (尽量保持简洁，只负责组装 Feature)
├── features/             # 【核心】按业务功能垂直拆分
│   └── chat-module/      # 示例：AI 对话模块
│       ├── api/          # 接口定义 (仅存放 ky 请求函数)
│       ├── hooks/        # 业务逻辑 (处理 SSE 流、消息状态转换)
│       ├── components/   # 模块私有组件 (拆分至每个文件 < 300行)
│       ├── stores/       # 模块内局部原子状态 (Jotai)
│       └── types.ts      # 后端接口返回的 DTO 定义
├── components/           # 全局公用组件 (如自定义 Table, Layout)
├── lib/                  # 第三方库封装 (ky 实例、X6 配置)
├── stores/               # 全局共享状态 (用户信息、主题配置)
└── utils/                # 纯函数工具类 (格式化、转换)

三、 开发约束 (The 300-Line Rule)
1. 文件限高
硬性标准： 单个文件行数严禁超过 300 行。

拆分逻辑：

超过 200 行时需进行预警。

优先将 columns 定义、constants 常量、hooks 逻辑移动到同级独立文件。

禁止在主组件内编写复杂的内联渲染函数（如 renderItem），应抽离为独立子组件。

2. 逻辑与渲染分离
Logic-less Components： 组件文件（.tsx）应只负责 UI 展现，不直接处理 API 数据。

Custom Hooks： 所有的 useEffect、复杂的 useState 必须抽离到 hooks/ 目录下。

四、 对接与通信规范
1. Ky 拦截器配置 (src/lib/http.ts)
TypeScript
import ky from 'ky';
import { toast } from 'antd';

export const http = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_BASE,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (req) => {
        const token = localStorage.getItem('token');
        if (token) req.headers.set('Authorization', `Bearer ${token}`);
      }
    ],
    afterResponse: [
      async (req, opt, res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          toast.error(error.message || '请求失败');
        }
      }
    ]
  }
});
2. AI 协议对接
后端独立性： 由于后端非 Next.js，需在 features/chat/api 中统一处理 SSE (Server-Sent Events) 的解析。

映射规范： 将后端字段映射为 Ant Design X 期望的 Message 类型。

五、 状态管理 (Jotai)
优先 URL： 所有涉及到“刷新后不希望丢失”的状态（如 chatId, query, page），必须存入 URL Search Params。

原子命名： 原子定义统一使用 Atom 后缀，例如：currentUserAtom。

衍生计算： 充分利用 atom((get) => ...) 进行计算，减少组件内的 useMemo。

六、 部署提示 (Self-Hosting)
Nginx 设置： 针对 SSE 流式输出，必须配置：

Nginx
proxy_buffering off;
proxy_cache off;
chunked_transfer_encoding on;
构建： 采用 Docker 镜像部署，确保环境变量在构建或运行时正确注入。
<!-- END:nextjs-agent-rules -->
