import { useState } from "react";
import type { ReactNode } from "react";
import { Box, Button, Flex, Heading, Input, Text } from "@theme-ui/components";
import { COPY } from "../lib/copy";

type Props = {
  url: string;
  onUrlLoad: (url: string) => void;
  onCopy: () => Promise<boolean>;
  children?: ReactNode;
};

export function UrlManager({ url, onUrlLoad, onCopy, children }: Props) {
  const [draftUrl, setDraftUrl] = useState<string | undefined>();
  const [copyState, setCopyState] = useState<{ count: number; failed: boolean; url: string }>();
  const displayedUrl = draftUrl ?? url;

  const currentCopyCount = copyState?.url === url && !copyState.failed ? copyState.count : 0;
  const copyLabel = copyState?.url === url && copyState.failed
    ? COPY.link.copyFailed
    : currentCopyCount === 0
      ? COPY.link.copyIdle
      : currentCopyCount === 1
        ? COPY.link.copied
        : currentCopyCount === 2
          ? COPY.link.copiedAgain
          : COPY.link.stillCopied;

  async function copyUrl() {
    const copied = await onCopy();
    setCopyState({ count: copied ? currentCopyCount + 1 : 0, failed: !copied, url });
  }

  function loadDraft() {
    const nextUrl = displayedUrl.trim();
    setDraftUrl(undefined);
    if (!nextUrl || nextUrl === url) return;
    onUrlLoad(nextUrl);
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box
        bg="background"
        sx={{
          border: "1.5px solid var(--accent)",
          borderRadius: "default",
          display: "grid",
          gap: 3,
          p: 3
        }}
      >
        <Box>
          <Heading as="h2" variant="title" color="accent" sx={sectionHeadingSx}>
            {COPY.link.heading}
          </Heading>
          <Text variant="caption" sx={{ color: "paragraph-secondary", display: "block", mt: 1 }}>
            {COPY.link.subtitle}
          </Text>
        </Box>
        <Flex sx={{ gap: 2, alignItems: "stretch", flexDirection: ["column", "row"] }}>
          <Input
            className="app-focus-ring"
            data-testid="share-link-input"
            value={displayedUrl}
            title={COPY.tooltips.link}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={COPY.link.ariaLabel}
            placeholder={COPY.link.placeholder}
            onChange={(event) => setDraftUrl(event.target.value)}
            onBlur={loadDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                loadDraft();
              }
            }}
            onPaste={(event) => {
              const pastedUrl = event.clipboardData.getData("text").trim();
              if (!pastedUrl) return;
              event.preventDefault();
              setDraftUrl(undefined);
              onUrlLoad(pastedUrl);
            }}
            sx={{
              ...urlInputSx,
              flex: "1 1 auto",
              fontFamily: "monospace",
              width: "100%"
            }}
          />
          <Button type="button" data-testid="copy-link" className="app-focus-ring" variant="accent" title={COPY.tooltips.copy} onClick={copyUrl} sx={{ fontWeight: "bold", minHeight: 40, minWidth: ["100%", "8rem"], px: 4 }}>
            {copyLabel}
          </Button>
        </Flex>
      </Box>

      {children}
    </Box>
  );
}

const controlSx = {
  bg: "background",
  borderRadius: "default",
  border: "none",
  fontFamily: "body",
  fontSize: "input",
  minHeight: 40,
  mx: 0,
  outline: "1.5px solid var(--border)",
  width: "100%",
  "&:hover:not(:focus)": {
    outline: "1.5px solid var(--accent)"
  }
} as const;

const sectionHeadingSx = {
  fontSize: ["1.25rem", "1.45rem"],
  lineHeight: 1.15,
  m: 0
};

const urlInputSx = {
  ...controlSx,
  outline: "1.5px solid var(--accent)",
  fontSize: "code",
  minHeight: 40,
  px: 2
} as const;
