import { describe, expect, it } from "vitest";
import { defaultTemplateState } from "./state";
import { buildInboxPayload } from "./payload";

describe("buildInboxPayload", () => {
  it("builds the fixed Notesnook Inbox payload fields", () => {
    const payload = buildInboxPayload(defaultTemplateState, "A", "<p>A</p>");
    expect(payload).toMatchObject({
      title: "A",
      type: "note",
      version: 1,
      content: { type: "html", data: "<p>A</p>" },
      pinned: false,
      favorite: false,
      readonly: false,
      archived: false
    });
  });

  it("omits empty optional arrays", () => {
    const payload = buildInboxPayload(defaultTemplateState, "", "<p>x</p>");
    expect(payload).not.toHaveProperty("notebookIds");
    expect(payload).not.toHaveProperty("tagIds");
  });
});
