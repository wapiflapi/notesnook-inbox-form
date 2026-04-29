import type { TemplateState } from "./types";

export const defaultTemplateState: TemplateState = {
  titleTemplate: "",
  source: "notesnook-inbox-template-sender",
  contentTemplate: "<p></p>",
  pinned: false,
  favorite: false,
  readonly: false,
  archived: false,
  notebookIds: "",
  tagIds: ""
};

export function normalizeIdInput(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function idsToInput(ids: string[]): string {
  return ids.join(", ");
}

function safeBoolean(value: unknown): boolean {
  return value === true;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeIdString(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).join(", ");
}

export function normalizeTemplateState(value: unknown): TemplateState {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    titleTemplate: safeString(input.titleTemplate) || safeString(input.title),
    source: safeString(input.source) || defaultTemplateState.source,
    contentTemplate: safeString(input.contentTemplate) || defaultTemplateState.contentTemplate,
    pinned: safeBoolean(input.pinned),
    favorite: safeBoolean(input.favorite),
    readonly: safeBoolean(input.readonly),
    archived: safeBoolean(input.archived),
    notebookIds: safeIdString(input.notebookIds),
    tagIds: safeIdString(input.tagIds)
  };
}
