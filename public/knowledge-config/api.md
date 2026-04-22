# Metadata 抽取配置 `/metadata-fields`

用于给 LlamaRAG 入库前的结构化 metadata 抽取提供动态规则。**实际完整路径需加统一前缀 `/v1`**（本前端请求的 `authApi` 已带 `/v1` 前缀）。

## 作用域约定

- `knowledge_base_id` 有值：**知识库级**配置
- `knowledge_base_id` 为空且 `biz_code` 有值：**业务级**配置
- `knowledge_base_id` 与 `biz_code` 都为空：**全局级**配置

## 接口列表

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/metadata-fields` | 查询某个作用域下的字段配置列表，返回字段及其别名 |
| POST | `/metadata-fields` | 新建字段配置，可同时写入初始化别名 |
| PATCH | `/metadata-fields/{field_id}` | 更新字段配置 |
| DELETE | `/metadata-fields/{field_id}` | 删除字段配置及其全部别名 |
| GET | `/metadata-fields/{field_id}/aliases` | 查询某个字段下的别名列表 |
| POST | `/metadata-fields/{field_id}/aliases` | 新增字段别名 |
| PATCH | `/metadata-fields/aliases/{alias_id}` | 更新字段别名 |
| DELETE | `/metadata-fields/aliases/{alias_id}` | 删除字段别名 |

## 字段枚举

- `value_type`：`text` / `number` / `list` / `date`
- `extract_mode`：`field` / `section`
- `match_mode`：`exact` / `contains` / `regex`
- `status`：`1` 启用，`0` 禁用

## 1）查询字段配置列表

**GET** `/v1/metadata-fields?knowledge_base_id=12`

Query 参数：`knowledge_base_id`（可选）、`biz_code`（可选）、`status`（可选，`1`/`0`）。

响应 `data`：`{ total, items: [...] }`，每项含 `aliases` 数组。

## 2）新建字段配置

**POST** `/v1/metadata-fields`

请求体含 `field_key`（建议 snake_case）、`field_name`、`value_type`、`extract_mode`、`status`、`priority`，可选 `biz_code`、`knowledge_base_id`，可选 `aliases` 数组。

## 3）更新字段配置

**PATCH** `/v1/metadata-fields/{field_id}`

示例字段：`field_name`、`priority`、`status`。

## 4）删除字段配置

**DELETE** `/v1/metadata-fields/{field_id}`

## 5）— 8）别名 CRUD

见上表路径；新增/更新别名请求体含 `alias_text`、`match_mode`、`status`、`priority` 等（以 OpenAPI 为准）。

## 前端对接建议

- 配置页先调用列表接口，按 `knowledge_base_id + biz_code` 展示当前作用域配置
- 创建字段时优先同时提交主别名，减少二次保存
- 入库按钮前可先调用列表接口判断 `total > 0`
- 若后端返回 `422` 且提示「未配置 metadata 抽取规则」，引导用户先完成本页配置

完整模型定义以服务端 **`/docs` OpenAPI** 为准；本文仅作导航与约定说明。
