/** 接口通用外层结构 */
export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type LoginUser = {
  id: number;
  username: string;
  email: string;
  status: number;
};

export type LoginData = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: LoginUser;
};

export type LoginRequest = {
  account: string;
  password: string;
};

/** POST /v1/auth/register */
export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

/** 厂商配置表单字段（来自 marketplace 的 config_schema） */
export type VendorConfigField = {
  key: string;
  label: string;
  required: boolean;
  storage: "column" | "extra";
  placeholder: string | null;
  field_type: string;
};

export type VendorConfigSchema = {
  fields: VendorConfigField[];
};

/** 单个可选模型（用于默认模型下拉） */
export type VendorModelItem = {
  id: string;
  name: string;
  capabilities?: string[];
};

/** 按厂商分组的模型目录（GET /llm/models） */
export type VendorModelGroup = {
  vendor_code: string;
  vendor_name: string;
  logo_url?: string | null;
  models: VendorModelItem[];
};

/** 市场/列表中的厂商（marketplace 含 capabilities 与 config_schema） */
export type Vendor = {
  id?: number | string;
  code: string;
  name: string;
  description: string;
  website_url: string | null;
  doc_url: string | null;
  logo_url: string | null;
  base_url: string | null;
  default_model_type: string;
  /** marketplace 必有；已安装列表可能省略 */
  capabilities?: string[];
  config_schema?: VendorConfigSchema;
  /** 已安装厂商若内嵌模型列表，可用于默认模型下拉（无独立 catalog 接口时的回退） */
  models?: VendorModelItem[];
  status: number;
};

/** PATCH 厂商配置：顶层字段 + extra_config */
export type PatchVendorConfigBody = {
  api_key?: string;
  base_url?: string;
  api_secret?: string;
  organization?: string;
  name?: string;
  status?: number;
  extra_config?: Record<string, unknown>;
};

/** 文件业务生命周期（GET/POST 文件接口里的 status） */
export type FileLifecycleStatus = "draft" | "reviewed" | "approved" | "archived";

/** 是否已生成中间 Markdown */
export type FileParseStatus = "pending" | "parsed";

/**
 * 知识库内入库流水线状态（GET /knowledge-bases/{kb_id}/files 的 pipeline_status）
 */
export type KnowledgePipelineStatus =
  | "pending_md"
  | "ready_to_index"
  | "queued"
  | "indexing"
  | "indexed"
  | "failed";

/** @deprecated 旧版字段名，请使用 FileLifecycleStatus */
export type FileStatus = FileLifecycleStatus;

/**
 * GET /files、上传、重传等返回的单个文件（FileUploadItem）
 */
export type FileUploadItem = {
  id: number;
  folder_id: number | null;
  file_name: string;
  file_ext: string;
  mime_type: string;
  size_bytes: number;
  project_code: string | null;
  source: string;
  /** 业务状态 */
  status: FileLifecycleStatus;
  /** 是否已解析出中间 md */
  parse_status: FileParseStatus;
  /** 内容语义版本，如 0.0.1 */
  content_semver: string;
  storage_key: string;
  file_url: string;
  created_at: string;
  uploader_user_id?: number | null;
  uploader_name?: string | null;
  parsed_md_storage_key?: string | null;
};

export type FileItem = FileUploadItem;

/**
 * GET /knowledge-bases/{kb_id}/files 列表项（在 FileUploadItem 基础上扩展库内流水线字段）
 */
export type KnowledgeBaseFileListItem = FileUploadItem & {
  kb_file_id: number;
  pipeline_status: KnowledgePipelineStatus;
  pipeline_error?: string | null;
  indexed_at?: string | null;
  chunk_count?: number | null;
  /** 该库最近一次成功入库时的内容版本；未成功过为 null */
  indexed_content_semver?: string | null;
  /** 当前文件 content_semver 新于 indexed_content_semver 时为 true */
  has_newer_content?: boolean;
};

export type FileListData = {
  total: number;
  page: number;
  page_size: number;
  items: FileUploadItem[];
};

/** POST /files/upload 同名冲突时（HTTP 409，code 40901）data 可能携带已有文件 id，供重传 */
export type DuplicateUploadConflictData = {
  file_id: number;
};

/** POST /files/{file_id}/parse-md 成功响应 */
export type ParseFileMdResult = {
  content_semver?: string;
  parse_status?: FileParseStatus;
  parsed_md_storage_key: string;
  parsed_md_url: string;
};

export type FileFolderTreeNode = {
  id: number;
  name: string;
  parent_folder_id: number | null;
  project_code?: string | null;
  description?: string | null;
  children?: FileFolderTreeNode[];
};

/** 知识库（新建/详情通用字段，以服务端为准可扩展） */
export type KnowledgeBase = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
};

export type CreateKnowledgeBaseBody = {
  name: string;
  code?: string;
  description?: string;
  thumbnail_url?: string;
};

export type KnowledgeBaseBatchFilesBody = {
  file_ids: number[];
};

/** 客户端对多个 file_id 依次调用 POST .../files/{file_id}/index 时的入参 */
export type KnowledgeBaseFileOperateRequest = KnowledgeBaseBatchFilesBody;

export type KnowledgeBaseBatchFilesResult = {
  affected_file_ids: number[];
  skipped_file_ids: number[];
};

export type KnowledgeBaseFilesListData = {
  knowledge_base_id: number;
  total: number;
  page: number;
  page_size: number;
  items: KnowledgeBaseFileListItem[];
};

/** GET /knowledge-bases 列表（分页字段以服务端为准，缺省时由前端归一化） */
export type KnowledgeBaseListData = {
  items: KnowledgeBase[];
  total: number;
  page: number;
  page_size: number;
};

/** GET/POST /metadata-fields — LlamaRAG 入库前 metadata 抽取字段 */
export type MetadataValueType = "text" | "number" | "list" | "date";
export type MetadataExtractMode = "field" | "section";
export type MetadataMatchMode = "exact" | "contains" | "regex";

export type MetadataFieldAlias = {
  id: number;
  field_id: number;
  alias_text: string;
  match_mode: MetadataMatchMode;
  status: number;
  priority: number;
  created_at?: string;
  updated_at?: string;
};

export type MetadataField = {
  id: number;
  owner_user_id?: number;
  biz_code?: string | null;
  knowledge_base_id?: number | null;
  field_key: string;
  field_name: string;
  value_type: MetadataValueType;
  extract_mode: MetadataExtractMode;
  status: number;
  priority: number;
  created_at?: string;
  updated_at?: string;
  aliases: MetadataFieldAlias[];
};

export type MetadataFieldsListData = {
  total: number;
  items: MetadataField[];
};

export type CreateMetadataFieldAliasBody = {
  alias_text: string;
  match_mode: MetadataMatchMode;
  status: number;
  priority: number;
};

export type CreateMetadataFieldBody = {
  biz_code?: string;
  knowledge_base_id?: number;
  field_key: string;
  field_name: string;
  value_type: MetadataValueType;
  extract_mode: MetadataExtractMode;
  status: number;
  priority: number;
  aliases?: CreateMetadataFieldAliasBody[];
};

export type PatchMetadataFieldBody = {
  field_name?: string;
  priority?: number;
  status?: number;
};

export type PatchMetadataFieldAliasBody = {
  alias_text?: string;
  match_mode?: MetadataMatchMode;
  status?: number;
  priority?: number;
};

/** GET /entity-candidates — 候选实体审核 */
export type EntityCandidateStatus = "pending" | "approved" | "rejected" | "merged";

export type EntityCandidate = {
  id: number;
  candidate_text: string;
  entity_type: string;
  frequency?: number;
  confidence?: number;
  biz_code?: string | null;
  knowledge_base_id?: number | null;
  file_id?: number | null;
  status: EntityCandidateStatus;
  updated_at: string;
  /** 证据片段等，结构以后端为准 */
  evidence?: unknown;
  review_comment?: string | null;
  reviewer?: string | null;
  reviewer_user_id?: number | null;
  approved_entity_id?: number | null;
};

export type EntityCandidateListData = {
  items: EntityCandidate[];
  total: number;
  page: number;
  page_size: number;
};

export type ApproveEntityCandidateBody = {
  canonical_name: string;
  entity_type: string;
  aliases: string[];
  review_comment?: string;
};

export type RejectEntityCandidateBody = {
  review_comment: string;
};

export type MergeEntityCandidateBody = {
  target_entity_id: number;
  review_comment?: string;
};

/** GET target-entities 下拉项（字段以后端为准） */
export type TargetEntityOption = {
  id: number;
  canonical_name?: string | null;
  name?: string | null;
  entity_type?: string | null;
};
