import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Box, Button, Flex, Heading, Text } from "@theme-ui/components";
import { ApiKeyInput } from "./components/ApiKeyInput";
import { FooterInfo } from "./components/FooterInfo";
import { PayloadForm } from "./components/PayloadForm";
import { UrlManager } from "./components/UrlManager";
import { sendToNotesnook } from "./lib/inboxApi";
import { buildInboxPayload } from "./lib/payload";
import { renderTemplate } from "./lib/render";
import { COPY } from "./lib/copy";
import { defaultTemplateState } from "./lib/state";
import type { AutoAction, FragmentState, RenderedNote, SendResult, Stage, TemplateState } from "./lib/types";
import { buildAbsoluteUrl, parseFragment, parseUrlInput, serializeFragment } from "./lib/urlState";

type ResultState = {
  note: RenderedNote;
  result: SendResult;
};

type BusyAction = "preview" | "send";

function getInitialState(): FragmentState {
  if (typeof window === "undefined") return { apiKey: "", args: {}, template: defaultTemplateState };

  const state = parseFragment(window.location.hash, window.location.search);
  if (window.location.hash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  return state;
}

function noteFromTemplate(template: TemplateState): RenderedNote {
  const title = template.titleTemplate;
  const html = template.contentTemplate;
  return {
    title,
    html,
    payload: buildInboxPayload(template, title, html)
  };
}

function resolvedTemplate(template: TemplateState, note: RenderedNote): TemplateState {
  return {
    ...template,
    titleTemplate: note.title,
    contentTemplate: note.html
  };
}

function templateFromNote(note: RenderedNote): TemplateState {
  return {
    titleTemplate: note.title,
    source: note.payload.source,
    contentTemplate: note.html,
    pinned: note.payload.pinned,
    favorite: note.payload.favorite,
    readonly: note.payload.readonly,
    archived: note.payload.archived,
    notebookIds: note.payload.notebookIds?.join(", ") ?? "",
    tagIds: note.payload.tagIds?.join(", ") ?? ""
  };
}

export function App() {
  const [initial] = useState(getInitialState);
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [args, setArgs] = useState(initial.args);
  const [template, setTemplate] = useState<TemplateState>(initial.template);
  const [draft, setDraft] = useState<TemplateState | undefined>();
  const [stage, setStage] = useState<Stage>("form");
  const [parseError, setParseError] = useState<string | undefined>(initial.parseError);
  const [includeKey, setIncludeKey] = useState(Boolean(initial.apiKey));
  const [auto, setAuto] = useState<AutoAction | undefined>(initial.auto);
  const [resultState, setResultState] = useState<ResultState | undefined>();
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction | undefined>();
  const handledStartupAuto = useRef(false);

  const currentDraftNote = useMemo(() => draft ? noteFromTemplate(draft) : undefined, [draft]);
  const hasKey = Boolean(apiKey.trim());
  const displayedTemplate = stage === "result" && resultState
    ? templateFromNote(resultState.note)
    : stage === "preview" && draft
      ? draft
      : template;
  const generatedUrl = useMemo(() => {
    const fragment = serializeFragment({ apiKey, includeKey, auto, template: displayedTemplate });
    if (typeof window === "undefined") return fragment;
    return buildAbsoluteUrl(window.location.origin, window.location.pathname, fragment);
  }, [apiKey, auto, displayedTemplate, includeKey]);

  const renderTemplateState = useCallback(async (sourceTemplate: TemplateState): Promise<RenderedNote | undefined> => {
    try {
      return await renderTemplate(sourceTemplate, new Date(), args);
    } catch (error) {
      const detail = error instanceof Error ? error.message : undefined;
      setResultState({ note: noteFromTemplate(sourceTemplate), result: { status: "error", message: COPY.errors.templateBroken, responseBody: detail } });
      setStage("result");
      return undefined;
    }
  }, [args]);

  const sendRenderedNote = useCallback(async (note: RenderedNote, key = apiKey) => {
    setStage("result");
    const result = await sendToNotesnook(key, note.payload);
    setResultState({ note, result });
  }, [apiKey]);

  const renderIntoEditor = useCallback(async (sourceTemplate = template) => {
    setBusy(true);
    setBusyAction("preview");
    try {
      const note = await renderTemplateState(sourceTemplate);
      if (note) {
        setDraft(resolvedTemplate(sourceTemplate, note));
        setResultState(undefined);
        setStage("preview");
      }
    } finally {
      setBusy(false);
      setBusyAction(undefined);
    }
  }, [renderTemplateState, template]);

  const sendFromTemplate = useCallback(async (sourceTemplate = template, key = apiKey) => {
    setBusy(true);
    setBusyAction("send");
    try {
      const note = await renderTemplateState(sourceTemplate);
      if (note) await sendRenderedNote(note, key);
    } finally {
      setBusy(false);
      setBusyAction(undefined);
    }
  }, [apiKey, renderTemplateState, sendRenderedNote, template]);

  const sendCurrentContent = useCallback(async () => {
    if (stage === "preview" && currentDraftNote) {
      setBusy(true);
      setBusyAction("send");
      try {
        await sendRenderedNote(currentDraftNote);
      } finally {
        setBusy(false);
        setBusyAction(undefined);
      }
      return;
    }

    await sendFromTemplate();
  }, [currentDraftNote, sendFromTemplate, sendRenderedNote, stage]);

  const updateDisplayedTemplate = useCallback((partial: Partial<TemplateState>) => {
    if (stage === "result") return;
    if (stage === "preview") {
      setDraft((current) => current ? { ...current, ...partial } : current);
      return;
    }
    setTemplate((current) => ({ ...current, ...partial }));
  }, [stage]);

  const loadUrlIntoEditor = useCallback((url: string) => {
    const loaded = parseUrlInput(url, typeof window === "undefined" ? "http://localhost/" : window.location.href);
    setApiKey(loaded.apiKey);
    setArgs(loaded.args);
    setTemplate(loaded.template);
    setDraft(undefined);
    setStage("form");
    setResultState(undefined);
    setParseError(loaded.parseError);
    setIncludeKey(Boolean(loaded.apiKey));
    setAuto(loaded.auto);
  }, []);

  const copyGeneratedUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      return true;
    } catch {
      return false;
    }
  }, [generatedUrl]);

  useEffect(() => {
    if (!initial.auto || handledStartupAuto.current) return;
    handledStartupAuto.current = true;

    async function runStartupAuto() {
      if (initial.auto === "send") {
        await sendFromTemplate(initial.template, initial.apiKey);
        return;
      }

      await renderIntoEditor(initial.template);
    }

    void runStartupAuto();
  }, [initial, renderIntoEditor, sendFromTemplate]);

  return (
    <Box
      as="main"
      bg="background"
      color="paragraph"
      sx={{
        fontFamily: "body",
        minHeight: "100dvh",
        overflow: "visible",
        width: "100%"
      }}
    >
      <Box
        as="form"
        id="notesnook-inbox-template-form"
        onSubmit={(event) => event.preventDefault()}
        sx={{
          alignItems: "stretch",
          display: "grid",
          gridTemplateColumns: ["minmax(0, 1fr)", null, "minmax(340px, 500px) minmax(0, 1fr)"],
          maxWidth: "1320px",
          minHeight: "100dvh",
          mx: "auto",
          overflow: "visible",
          p: [1, 2],
          width: "100%"
        }}
      >
        <Flex
          as="aside"
          bg="background-secondary"
          sx={{
            borderTop: "1px solid var(--border)",
            borderRight: [0, null, "1px solid var(--border)"],
            flexDirection: "column",
            maxWidth: "100%",
            minHeight: 0,
            minWidth: 0,
            overflow: "visible"
          }}
        >
          <Box
            as="section"
            bg="background-secondary"
            sx={{
              borderBottom: "1px solid var(--separator)",
              display: "grid",
              flex: "0 0 auto",
              gap: 3,
              minHeight: 0,
              overflow: "visible",
              px: 3,
              py: 3
            }}
          >
            <UrlManager
              url={generatedUrl}
              onUrlLoad={loadUrlIntoEditor}
              onCopy={copyGeneratedUrl}
            >
              <>
                <ActionBar
                  stage={stage}
                  busy={busy}
                  busyAction={busyAction}
                  hasKey={hasKey}
                  onPreview={() => renderIntoEditor()}
                  onSendNow={() => sendFromTemplate()}
                  onSend={sendCurrentContent}
                  onEditTemplate={() => { setStage("form"); setResultState(undefined); }}
                />
                <ActionStateBlock
                  busy={busy}
                  busyAction={busyAction}
                  resultState={resultState}
                />
              </>
            </UrlManager>
            {parseError && <Message tone="error">{COPY.errors.badLink} {parseError}</Message>}
            <ApiKeyInput
              value={apiKey}
              onChange={setApiKey}
              source={displayedTemplate.source}
              onSourceChange={(source) => updateDisplayedTemplate({ source })}
              includeKey={includeKey}
              onIncludeKeyChange={setIncludeKey}
              auto={auto}
              onAutoChange={setAuto}
              disabled={stage === "result"}
            />
            <FooterInfo />
          </Box>
        </Flex>
        <Box
          sx={{
            maxWidth: "100%",
            minHeight: 0,
            minWidth: 0,
            overflow: "visible"
          }}
        >
          <PayloadForm
            template={displayedTemplate}
            onChange={stage === "preview" ? setDraft : setTemplate}
            disabled={stage === "result"}
          />
        </Box>
      </Box>
    </Box>
  );
}

function ActionBar(props: {
  stage: Stage;
  busy: boolean;
  busyAction?: BusyAction;
  hasKey: boolean;
  onPreview: () => void;
  onSendNow: () => void;
  onSend: () => void;
  onEditTemplate: () => void;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        flex: "0 0 auto",
        gap: 2,
        gridTemplateColumns: props.stage === "result" ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)",
        minHeight: 46
      }}
    >
      {props.stage === "form" && (
        <>
          <Button type="button" data-testid="action-preview" className="app-focus-ring" variant="primary" title={COPY.tooltips.preview} onClick={props.onPreview} disabled={props.busy} sx={neutralPrimaryButtonSx}>
            {props.busyAction === "preview" ? COPY.actions.previewing : COPY.actions.preview}
          </Button>
          <Button type="button" data-testid="action-send-now" className="app-focus-ring" variant="secondary" title={COPY.tooltips.sendNow} onClick={props.onSendNow} disabled={props.busy || !props.hasKey} sx={actionButtonSx}>
            {props.busyAction === "send" ? COPY.actions.sending : props.hasKey ? COPY.actions.sendNow : COPY.actions.needsKey(COPY.actions.sendNow)}
          </Button>
        </>
      )}
      {props.stage === "preview" && (
        <>
          <Button type="button" data-testid="action-send" className="app-focus-ring" variant="primary" title={COPY.tooltips.send} onClick={props.onSend} disabled={props.busy || !props.hasKey} sx={neutralPrimaryButtonSx}>
            {props.busyAction === "send" ? COPY.actions.sending : props.hasKey ? COPY.actions.send : COPY.actions.needsKey(COPY.actions.send)}
          </Button>
          <Button type="button" data-testid="action-edit-template" className="app-focus-ring" variant="secondary" aria-label={COPY.actions.editTemplate} title={COPY.tooltips.editTemplate} onClick={props.onEditTemplate} disabled={props.busy} sx={actionButtonSx}>
            {COPY.actions.editTemplate}
          </Button>
        </>
      )}
      {props.stage === "result" && (
        <Button type="button" data-testid="action-edit-template" className="app-focus-ring" variant="secondary" aria-label={COPY.actions.editTemplate} title={COPY.tooltips.editTemplate} onClick={props.onEditTemplate} disabled={props.busy} sx={actionButtonSx}>
          {COPY.actions.editTemplate}
        </Button>
      )}
    </Box>
  );
}

const actionButtonSx = {
  fontSize: "input",
  fontWeight: "bold",
  minHeight: 40,
  minWidth: 0,
  px: 3,
  whiteSpace: "normal",
  width: "100%"
} as const;

const neutralPrimaryButtonSx = {
  ...actionButtonSx,
  bg: "background",
  color: "heading",
  ":hover:not(:disabled):not(:active)": {
    bg: "background",
    filter: "brightness(90%)"
  },
  ":active:not(:disabled)": {
    bg: "background",
    filter: "brightness(85%)",
    transform: "scale(0.98) !important"
  }
} as const;

function hasResultDetails(result: SendResult): boolean {
  return Boolean(result.responseBody);
}

function ActionStateBlock(props: { busy: boolean; busyAction?: BusyAction; resultState?: ResultState }) {
  if (!props.busy && !props.resultState) return null;

  const status = props.busy
    ? getBusyStatus(props.busyAction)
    : getResultStatus(props.resultState!.result);

  return (
    <Box
      data-testid={props.resultState ? "result-status" : "action-status"}
      role={status.tone === "error" ? "alert" : "status"}
      aria-live="polite"
      bg={status.tone === "error" ? "background-error" : "background"}
      sx={{
        border: `1.5px solid var(${status.tone === "error" ? "--accent-error" : "--accent"})`,
        borderRadius: "default",
        display: "grid",
        gap: 2,
        p: 3
      }}
    >
      <Box>
        <Heading as="h3" variant="subtitle" color={status.tone === "error" ? "paragraph-error" : "accent"} sx={{ m: 0 }}>
          {status.title}
        </Heading>
        <Text
          variant="subBody"
          sx={{
            color: status.tone === "error" ? "paragraph-error" : "paragraph-secondary",
            display: "block",
            mt: 1
          }}
        >
          {status.description}
        </Text>
      </Box>
      {props.resultState && hasResultDetails(props.resultState.result) && (
        <Box>
          <Heading as="h4" variant="subBody" sx={{ color: "paragraph", m: 0, mb: 1 }}>
            {COPY.status.details}
          </Heading>
          <CodeBlock>{props.resultState.result.responseBody}</CodeBlock>
        </Box>
      )}
    </Box>
  );
}

function getBusyStatus(action?: BusyAction) {
  if (action === "preview") {
    return {
      description: COPY.status.previewing,
      title: COPY.actions.previewing,
      tone: "progress" as const
    };
  }

  return {
    description: COPY.status.sending,
    title: COPY.actions.sending,
    tone: "progress" as const
  };
}

function getResultStatus(result: SendResult) {
  const isSuccess = result.status === "success";
  return (
    {
      description: isSuccess
        ? COPY.status.sentDescription
        : `${result.message}${result.httpStatus ? COPY.status.statusCode(result.httpStatus) : ""}`,
      title: isSuccess ? COPY.status.sent : COPY.status.failed,
      tone: isSuccess ? "success" as const : "error" as const
    }
  );
}

function Message({ children, tone }: { children: ReactNode; tone?: "error" }) {
  return (
    <Box
      role={tone === "error" ? "alert" : "status"}
      bg={tone === "error" ? "background-error" : "background-secondary"}
      color={tone === "error" ? "paragraph-error" : "paragraph"}
      sx={{ borderBottom: `1px solid var(${tone === "error" ? "--accent-error" : "--separator"})`, p: 2 }}
    >
      {children}
    </Box>
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <Box
      as="pre"
      bg="background-secondary"
      sx={{ border: "1px solid var(--border)", borderRadius: "default", color: "paragraph", fontFamily: "monospace", fontSize: "code", maxHeight: 320, overflow: "auto", p: 2 }}
    >
      {children}
    </Box>
  );
}
