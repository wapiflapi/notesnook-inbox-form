import { describe, expect, it } from "vitest";
import { defaultTemplateState } from "./state";
import { parseFragment, parseUrlInput, serializeFragment } from "./urlState";

describe("urlState", () => {
  it("round-trips template state through compressed fragment data", () => {
    const fragment = serializeFragment({
      apiKey: "secret",
      includeKey: true,
      auto: "render",
      template: {
        ...defaultTemplateState,
        titleTemplate: "Hello",
        contentTemplate: "<p>{{ title }}</p>",
        pinned: true,
        notebookIds: "one",
        tagIds: "tag"
      }
    });

    const parsed = parseFragment(fragment);
    expect(parsed.apiKey).toBe("secret");
    expect(parsed.auto).toBe("render");
    expect(parsed.template.titleTemplate).toBe("Hello");
    expect(parsed.template.pinned).toBe(true);
    expect(parsed.template.notebookIds).toBe("one");
  });

  it("uses query values as fallbacks and lets fragment values win", () => {
    const queryFragment = serializeFragment({
      apiKey: "query-key",
      includeKey: true,
      auto: "send",
      template: { ...defaultTemplateState, titleTemplate: "From query" }
    });
    const hashFragment = serializeFragment({
      apiKey: "hash-key",
      includeKey: true,
      auto: "render",
      template: { ...defaultTemplateState, titleTemplate: "From hash" }
    });

    const parsed = parseFragment(`${hashFragment}&customer=fragment`, `${queryFragment.replace("#", "?")}&customer=query&campaign=launch`);

    expect(parsed.apiKey).toBe("hash-key");
    expect(parsed.auto).toBe("render");
    expect(parsed.template.titleTemplate).toBe("From hash");
    expect(parsed.args).toEqual({ customer: "fragment", campaign: "launch" });
  });

  it("falls back to query values when fragment values are missing", () => {
    const queryFragment = serializeFragment({
      apiKey: "query-key",
      includeKey: true,
      auto: "send",
      template: { ...defaultTemplateState, titleTemplate: "From query" }
    });

    const parsed = parseFragment("#customer=ada", queryFragment.replace("#", "?"));

    expect(parsed.apiKey).toBe("query-key");
    expect(parsed.auto).toBe("send");
    expect(parsed.template.titleTemplate).toBe("From query");
    expect(parsed.args).toEqual({ customer: "ada" });
  });

  it("omits the api key when includeKey is false", () => {
    const fragment = serializeFragment({
      apiKey: "secret",
      includeKey: false,
      template: defaultTemplateState
    });

    expect(fragment).not.toContain("secret");
    expect(parseFragment(fragment).apiKey).toBe("");
  });

  it("falls back for unknown auto values and malformed template data", () => {
    const parsed = parseFragment("#auto=wat&t=bad");
    expect(parsed.auto).toBeUndefined();
    expect(parsed.template).toEqual(defaultTemplateState);
    expect(parsed.args).toEqual({});
    expect(parsed.parseError).toBeTruthy();
  });

  it("parses a full absolute URL", () => {
    const fragment = serializeFragment({
      apiKey: "url-key",
      includeKey: true,
      auto: "send",
      template: { ...defaultTemplateState, titleTemplate: "From URL" }
    });

    const parsed = parseUrlInput(`https://example.test/path?customer=query${fragment}&customer=fragment`);

    expect(parsed.apiKey).toBe("url-key");
    expect(parsed.auto).toBe("send");
    expect(parsed.template.titleTemplate).toBe("From URL");
    expect(parsed.args).toEqual({ customer: "fragment" });
  });

  it("parses raw fragments from the URL editor", () => {
    const fragment = serializeFragment({
      apiKey: "",
      includeKey: false,
      template: { ...defaultTemplateState, titleTemplate: "Raw fragment" }
    });

    expect(parseUrlInput(fragment).template.titleTemplate).toBe("Raw fragment");
  });
});
