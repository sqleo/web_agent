import type {
  MetadataField,
  MetadataFieldAlias,
  KnowledgeBase,
  MetadataMatchMode,
  MetadataValueType,
  MetadataExtractMode,
} from "@/api/types";

export type {
  MetadataField,
  MetadataFieldAlias,
  KnowledgeBase,
  MetadataMatchMode,
  MetadataValueType,
  MetadataExtractMode,
};

export type ScopeMode = "global" | "biz" | "kb";

export type GetMetadataFieldsQuery = {
  status?: number;
  biz_code?: string;
  knowledge_base_id?: number;
};

