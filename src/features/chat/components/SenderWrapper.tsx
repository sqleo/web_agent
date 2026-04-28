"use client";

import { Attachments, Sender } from "@ant-design/x";
import { PaperClipOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import type { Attachment } from "@ant-design/x/es/attachments";
import type { ActionsComponents } from "@ant-design/x/es/sender/interface";
import { useRef, useCallback, type ReactNode } from "react";
import { useAtom } from "jotai";
import { filesAtom, senderValueAtom } from "../stores/chat";

interface SenderWrapperProps {
  loading: boolean;
  pausedSessionId: string | null;
  activeSessionId: string | null;
  activeSessionThreadId: string | null | undefined;
  handlePauseGeneration: () => void;
  handleResumeGeneration: () => void;
  handleSubmit: (text: string) => void;
}

export function SenderWrapper({
  loading,
  pausedSessionId,
  activeSessionId,
  activeSessionThreadId,
  handlePauseGeneration,
  handleResumeGeneration,
  handleSubmit,
}: SenderWrapperProps) {
  const [files, setFiles] = useAtom(filesAtom);
  const [senderValue, setSenderValue] = useAtom(senderValueAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderSenderSuffix = useCallback(
    (oriNode: ReactNode, { components }: { components: ActionsComponents }) => {
      const showResume =
        !loading &&
        pausedSessionId === activeSessionId &&
        Boolean(activeSessionThreadId);

      if (!showResume) {
        return oriNode;
      }

      const { SpeechButton } = components;
      return (
        <Flex align="center" gap={4}>
          <SpeechButton />
          <Button
            type="primary"
            shape="circle"
            icon={<PlayCircleOutlined />}
            aria-label="继续生成"
            onClick={() => {
              void handleResumeGeneration();
            }}
          />
        </Flex>
      );
    },
    [activeSessionId, activeSessionThreadId, handleResumeGeneration, loading, pausedSessionId]
  );

  return (
    <>
      {files.length > 0 ? (
        <Attachments
          items={files}
          onChange={(info) => {
            setFiles(info.fileList as Attachment[]);
          }}
          style={{ marginBottom: 10 }}
        />
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        tabIndex={-1}
        className="hidden"
        style={{ display: "none" }}
        onChange={(e) => {
          const list = e.target.files;
          if (!list?.length) {
            return;
          }
          setFiles((prev) => {
            const next = [...prev];
            Array.from(list).forEach((file, i) => {
              next.push({
                uid: `${Date.now()}-${i}`,
                name: file.name,
                status: "done",
                originFileObj: file as Attachment["originFileObj"],
              });
            });
            return next;
          });
          e.target.value = "";
        }}
      />
      <Sender
        allowSpeech
        loading={loading}
        value={senderValue}
        onChange={(v) => setSenderValue(v)}
        placeholder="输入消息，Enter 发送；支持语音；生成中右侧圆钮暂停；暂停后同位置圆钮继续"
        suffix={renderSenderSuffix}
        onCancel={() => {
          void handlePauseGeneration();
        }}
        prefix={
          <Button
            type="text"
            aria-label="上传附件"
            icon={<PaperClipOutlined />}
            onClick={() => fileInputRef.current?.click()}
          />
        }
        onSubmit={(v) => {
          void handleSubmit(v);
        }}
        onPasteFile={(fileList) => {
          setFiles((prev) => {
            const next = [...prev];
            Array.from(fileList).forEach((file, i) => {
              next.push({
                uid: `${Date.now()}-${i}`,
                name: file.name,
                status: "done",
                originFileObj: file as Attachment["originFileObj"],
              });
            });
            return next;
          });
        }}
      />
    </>
  );
}
