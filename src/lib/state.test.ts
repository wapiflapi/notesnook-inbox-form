import { describe, expect, it } from "vitest";
import { normalizeIdInput, normalizeTemplateState } from "./state";

describe("state helpers", () => {
  it("normalizes comma and newline separated IDs", () => {
    expect(normalizeIdInput("a, b\nc\n\n , d ")).toEqual(["a", "b", "c", "d"]);
  });

  it("validates booleans strictly", () => {
    const normalized = normalizeTemplateState({
      pinned: "true",
      favorite: true,
      readonly: 1,
      archived: false
    });
    expect(normalized.pinned).toBe(false);
    expect(normalized.favorite).toBe(true);
    expect(normalized.readonly).toBe(false);
    expect(normalized.archived).toBe(false);
  });
});
