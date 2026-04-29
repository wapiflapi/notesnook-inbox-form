import { describe, expect, it } from "vitest";
import { defaultTemplateState } from "./state";
import { renderTemplate } from "./render";

describe("renderTemplate", () => {
  it("renders Liquid content with form context", async () => {
    const note = await renderTemplate({
      ...defaultTemplateState,
      titleTemplate: "Daily",
      contentTemplate: "<h1>{{ title }}</h1><p>{{ tagIds }}</p>",
      tagIds: "work"
    });
    expect(note.html).toContain("<h1>Daily</h1>");
    expect(note.html).toContain("<p>work</p>");
  });

  it("exposes extra link args to Liquid templates", async () => {
    const note = await renderTemplate({
      ...defaultTemplateState,
      titleTemplate: "Hello {{ args.customer }}",
      contentTemplate: "<p>{{ args.campaign }}</p>"
    }, new Date("2026-04-28T00:00:00.000Z"), { customer: "Ada", campaign: "spring" });

    expect(note.title).toBe("Hello Ada");
    expect(note.html).toContain("<p>spring</p>");
  });

  it("surfaces Liquid syntax errors", async () => {
    await expect(renderTemplate({ ...defaultTemplateState, contentTemplate: "{% if" })).rejects.toThrow();
  });
});
