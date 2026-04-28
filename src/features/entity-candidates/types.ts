import type {
  EntityCandidate,
  EntityCandidateStatus,
  TargetEntityOption,
  KnowledgeBase,
} from "@/api/types";

export type {
  EntityCandidate,
  EntityCandidateStatus,
  TargetEntityOption,
  KnowledgeBase,
};

export type GetEntityCandidatesQuery = {
  page?: number;
  page_size?: number;
  status?: string;
  biz_code?: string;
  knowledge_base_id?: number;
  file_id?: number;
  keyword?: string;
};

