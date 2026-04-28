"use client";

import { Card, Tree, Typography } from "antd";
import type { DataNode } from "antd/es/tree";

interface FolderTreeCardProps {
  loading: boolean;
  treeData: DataNode[];
  selectedFolderId: number | null;
  setSelectedFolderId: (id: number | null) => void;
}

export function FolderTreeCard({
  loading,
  treeData,
  selectedFolderId,
  setSelectedFolderId,
}: FolderTreeCardProps) {
  return (
    <Card size="small" title="文件夹树" loading={loading}>
      <Typography.Paragraph type="secondary" className="!mb-2 text-xs">
        点击节点可快速带入 folder_id 到上传弹窗
      </Typography.Paragraph>
      <Tree
        showLine
        treeData={treeData}
        selectedKeys={selectedFolderId ? [String(selectedFolderId)] : []}
        onSelect={(keys) => {
          const first = keys[0];
          setSelectedFolderId(first ? Number(first) : null);
        }}
      />
    </Card>
  );
}
