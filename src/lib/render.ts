import { Liquid } from "liquidjs";
import { buildInboxPayload } from "./payload";
import type { RenderedNote, TemplateState } from "./types";

const engine = new Liquid({
  strictFilters: false,
  strictVariables: false
});

export async function renderTemplate(template: TemplateState, now = new Date(), args: Record<string, string> = {}): Promise<RenderedNote> {
  const context = {
    args,
    title: template.titleTemplate,
    source: template.source,
    content: template.contentTemplate,
    pinned: template.pinned,
    favorite: template.favorite,
    readonly: template.readonly,
    archived: template.archived,
    notebookIds: template.notebookIds,
    tagIds: template.tagIds,
    now,
    today: now.toISOString().slice(0, 10)
  };
  const title = await engine.parseAndRender(template.titleTemplate, context);
  const html = await engine.parseAndRender(template.contentTemplate, { ...context, title });
  return {
    title,
    html,
    payload: buildInboxPayload(template, title, html)
  };
}
