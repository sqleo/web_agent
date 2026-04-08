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
