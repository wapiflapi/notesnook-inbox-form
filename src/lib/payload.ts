import type { NotesnookInboxPayload, TemplateState } from "./types";
import { normalizeIdInput } from "./state";

export function buildInboxPayload(template: TemplateState, title: string, renderedHtml: string): NotesnookInboxPayload {
  const payload: NotesnookInboxPayload = {
    title,
    type: "note",
    source: template.source,
    version: 1,
    content: {
      type: "html",
      data: renderedHtml
    },
    pinned: template.pinned,
    favorite: template.favorite,
    readonly: template.readonly,
    archived: template.archived
  };

  const notebookIds = normalizeIdInput(template.notebookIds);
  const tagIds = normalizeIdInput(template.tagIds);
  if (notebookIds.length > 0) payload.notebookIds = notebookIds;
  if (tagIds.length > 0) payload.tagIds = tagIds;

  return payload;
}
