import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { COPY } from "./copy";
import { defaultTemplateState, normalizeTemplateState } from "./state";
import type { AutoAction, FragmentState, TemplateState } from "./types";

const autos: AutoAction[] = ["render", "send"];
const expectedParams = new Set(["k", "auto", "t"]);

export function parseAuto(value: string | null): AutoAction | undefined {
  return value && autos.includes(value as AutoAction) ? (value as AutoAction) : undefined;
}

export function parseFragment(hash: string, search = ""): FragmentState {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryRaw = search.startsWith("?") ? search.slice(1) : search;
  const queryParams = new URLSearchParams(queryRaw);
  const fragmentParams = new URLSearchParams(raw);
  const params = new URLSearchParams(queryParams);
  const args: Record<string, string> = {};

  for (const [key, value] of queryParams) {
    if (!expectedParams.has(key)) args[key] = value;
  }

  for (const [key, value] of fragmentParams) {
    params.set(key, value);
    if (!expectedParams.has(key)) args[key] = value;
  }

  let template = defaultTemplateState;
  let parseError: string | undefined;
  const compressed = params.get("t");

  if (compressed) {
    try {
      const json = decompressFromEncodedURIComponent(compressed);
      if (!json) throw new Error(COPY.errors.templateNotCompressed);
      template = normalizeTemplateState(JSON.parse(json));
    } catch (error) {
      parseError = error instanceof Error ? error.message : COPY.errors.templateMalformed;
      template = defaultTemplateState;
    }
  }

  return {
    apiKey: params.get("k") ?? "",
    auto: parseAuto(params.get("auto")),
    args,
    template,
    parseError
  };
}

export function parseUrlInput(value: string, base = "http://localhost/"): FragmentState {
  const trimmed = value.trim();
  if (!trimmed) return parseFragment("");

  try {
    const url = new URL(trimmed, base);
    return parseFragment(url.hash, url.search);
  } catch {
    return {
      ...parseFragment(trimmed),
      parseError: COPY.errors.linkParseFailed
    };
  }
}

export function serializeFragment(input: {
  apiKey: string;
  includeKey: boolean;
  auto?: AutoAction;
  template: TemplateState;
}): string {
  const params = new URLSearchParams();
  if (input.includeKey && input.apiKey.trim()) params.set("k", input.apiKey.trim());
  if (input.auto) params.set("auto", input.auto);
  params.set("t", compressToEncodedURIComponent(JSON.stringify(normalizeTemplateState(input.template))));
  return `#${params.toString()}`;
}

export function buildAbsoluteUrl(origin: string, pathname: string, fragment: string): string {
  return `${origin}${pathname}${fragment}`;
}
