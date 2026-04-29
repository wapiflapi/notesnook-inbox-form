import { Box, Flex, Input, Label, Select, Text } from "@theme-ui/components";
import { COPY } from "../lib/copy";
import type { AutoAction } from "../lib/types";

type Props = {
  value: string;
  onChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  includeKey: boolean;
  onIncludeKeyChange: (value: boolean) => void;
  auto?: AutoAction;
  onAutoChange: (value?: AutoAction) => void;
  disabled?: boolean;
};

export function ApiKeyInput({ value, onChange, source, onSourceChange, includeKey, onIncludeKeyChange, auto, onAutoChange, disabled = false }: Props) {
  function updateAuto(value: string) {
    const nextAuto = (value || undefined) as AutoAction | undefined;
    onAutoChange(nextAuto);
    if (nextAuto === "send") onIncludeKeyChange(true);
  }

  function updateIncludeKey(value: string) {
    const nextIncludeKey = value === "yes";
    onIncludeKeyChange(nextIncludeKey);
    if (!nextIncludeKey && auto === "send") onAutoChange(undefined);
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <FieldRow id="notesnook-inbox-template-sender-key" label={COPY.fields.apiKey.label} tooltip={COPY.tooltips.key}>
        <Input
          className="app-focus-ring"
          id="notesnook-inbox-template-sender-key"
          data-testid="api-key-input"
          name="notesnook-inbox-template-sender-key"
          type="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={COPY.fields.apiKey.placeholder}
          title={COPY.tooltips.key}
          sx={controlSx}
        />
      </FieldRow>

      <FieldRow id="include-key" label={COPY.fields.includeKey.label} tooltip={COPY.tooltips.includeKey}>
        <Select
          className="app-focus-ring"
          id="include-key"
          data-testid="include-key-select"
          title={COPY.tooltips.includeKey}
          value={includeKey ? "yes" : "no"}
          aria-describedby={includeKey ? "include-key-warning" : undefined}
          onChange={(event) => updateIncludeKey(event.target.value)}
          sx={controlSx}
        >
          <option value="no">{COPY.fields.includeKey.no}</option>
          <option value="yes">{COPY.fields.includeKey.yes}</option>
        </Select>
      </FieldRow>

      {includeKey && (
        <Flex sx={{ gap: 2 }}>
          <Box sx={{ flex: "0 0 5.25rem" }} />
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Text id="include-key-warning" variant="subBody" sx={{ color: "paragraph-error" }}>
              {COPY.fields.apiKey.includeWarning}
            </Text>
          </Box>
        </Flex>
      )}

      <FieldRow id="auto-behavior" label={COPY.fields.onOpen.label} tooltip={COPY.tooltips.onOpen}>
        <Select
          className="app-focus-ring"
          id="auto-behavior"
          data-testid="on-open-select"
          title={COPY.tooltips.onOpen}
          value={auto ?? ""}
          onChange={(event) => updateAuto(event.target.value)}
          sx={controlSx}
        >
          <option value="">{COPY.fields.onOpen.doNothing}</option>
          <option value="render">{COPY.fields.onOpen.preview}</option>
          <option value="send">{COPY.fields.onOpen.send}</option>
        </Select>
      </FieldRow>

      <FieldRow id="source" label={COPY.fields.source} tooltip={COPY.tooltips.source}>
        <Input
          className="app-focus-ring"
          id="source"
          data-testid="source-input"
          value={source}
          onChange={(event) => onSourceChange(event.target.value)}
          disabled={disabled}
          title={COPY.tooltips.source}
          sx={controlSx}
        />
      </FieldRow>
    </Box>
  );
}

function FieldRow({ id, label, tooltip, children }: { id: string; label: string; tooltip: string; children: React.ReactNode }) {
  return (
    <Flex sx={{ alignItems: "center", gap: 2 }}>
      <Label
        htmlFor={id}
        title={tooltip}
        sx={{
          color: "paragraph-secondary",
          flex: "0 0 5.25rem",
          fontSize: "subBody",
          fontWeight: "bold",
          lineHeight: 1.4,
          m: 0
        }}
      >
        {label}
      </Label>
      <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
        {children}
      </Box>
    </Flex>
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
