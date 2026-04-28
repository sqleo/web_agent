import { atom } from "jotai";
import type { ChatSession } from "../types";
import type { Attachment } from "@ant-design/x/es/attachments";

export const sessionsAtom = atom<ChatSession[]>([]);
export const activeIdAtom = atom<string | null>(null);
export const filesAtom = atom<Attachment[]>([]);
export const senderValueAtom = atom<string>("");
export const loadingAtom = atom<boolean>(false);
export const pausedSessionIdAtom = atom<string | null>(null);

// Derived atoms
export const activeSessionAtom = atom((get) => {
  const sessions = get(sessionsAtom);
  const activeId = get(activeIdAtom);
  return sessions.find((s) => s.id === activeId) ?? null;
});
