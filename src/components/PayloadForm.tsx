import { mdiArchiveOutline, mdiStarOutline } from "@mdi/js";
import { Icons } from "@notesnook/editor";
import { Icon } from "@notesnook/ui";
import { Box, Button, Flex, Input, Label, Text } from "@theme-ui/components";
import { useState } from "react";
import { COPY } from "../lib/copy";
import type { TemplateState } from "../lib/types";
import { NotesnookEditor } from "./NotesnookEditor";

type Props = {
  template: TemplateState;
  onChange: (template: TemplateState) => void;
  disabled?: boolean;
};

export function PayloadForm({ template, onChange, disabled = false }: Props) {
  const [titlePlaceholder] = useState(
    () => pickTitlePlaceholder(),
  );

  function update(partial: Partial<TemplateState>) {
    if (disabled) return;
    onChange({ ...template, ...partial });
  }

  return (
    <NotesnookEditor
      value={template.contentTemplate}
      onChange={(contentTemplate) => update({ contentTemplate })}
      readOnly={disabled}
      header={(
        <Box
          bg="background"
          sx={{
            borderBottom: "1px solid var(--separator)",
            px: [2, 4],
            py: 2
          }}
        >
          <Input
            id="title"
            data-testid="title-input"
            aria-label={COPY.fields.title.label}
            title={COPY.tooltips.title}
            placeholder={titlePlaceholder}
            value={template.titleTemplate}
            onChange={(event) => update({ titleTemplate: event.target.value })}
            disabled={disabled}
            variant="clean"
            sx={{
              color: "heading",
              fontFamily: "heading",
              fontSize: ["1.55rem", "1.85rem"],
              fontWeight: "bold",
              lineHeight: 1.2,
              maxWidth: 840,
              mx: 0,
              p: 0,
              width: "100%"
            }}
          />

          <Box sx={{ display: "grid", gap: 1, maxWidth: 760, mt: 2 }}>
            <MetadataField
              id="tag-ids"
              label={COPY.fields.tags.label}
              tooltip={COPY.tooltips.tags}
              placeholder={COPY.fields.tags.placeholder}
              value={template.tagIds}
              disabled={disabled}
              onChange={(tagIds) => update({ tagIds })}
            />
            <MetadataField
              id="notebook-ids"
              label={COPY.fields.notebooks.label}
              tooltip={COPY.tooltips.notebooks}
              placeholder={COPY.fields.notebooks.placeholder}
              value={template.notebookIds}
              disabled={disabled}
              onChange={(notebookIds) => update({ notebookIds })}
            />
          </Box>

          <Flex sx={{ gap: 1, flexWrap: "wrap", mt: 2 }}>
            <FlagButton title={COPY.fields.pinned} tooltip={COPY.tooltips.pinned} active={template.pinned} icon={Icons.pin} disabled={disabled} onClick={() => update({ pinned: !template.pinned })} />
            <FlagButton title={COPY.fields.favorite} tooltip={COPY.tooltips.favorite} active={template.favorite} icon={mdiStarOutline} disabled={disabled} onClick={() => update({ favorite: !template.favorite })} />
            <FlagButton title={COPY.fields.readonly} tooltip={COPY.tooltips.readonly} active={template.readonly} icon={template.readonly ? Icons.readonlyOn : Icons.readonlyOff} disabled={disabled} onClick={() => update({ readonly: !template.readonly })} />
            <FlagButton title={COPY.fields.archived} tooltip={COPY.tooltips.archived} active={template.archived} icon={mdiArchiveOutline} disabled={disabled} onClick={() => update({ archived: !template.archived })} />
          </Flex>
        </Box>
      )}
    />
  );
}

function pickTitlePlaceholder() {
  const placeholders = Math.random() < 0.9 ? COPY.fields.title.placeholders.dates : COPY.fields.title.placeholders.easterEggs;
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

function MetadataField(props: { id: string; label: string; tooltip: string; placeholder: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <Flex sx={{ alignItems: "center", gap: 2 }}>
      <Label
        htmlFor={props.id}
        title={props.tooltip}
        sx={{
          color: "paragraph-secondary",
          flex: "0 0 4.75rem",
          fontSize: "body",
          lineHeight: 1.4,
          m: 0
        }}
      >
        {props.label}
      </Label>
      <Input
        id={props.id}
        data-testid={`${props.id}-input`}
        aria-label={props.label}
        title={props.tooltip}
        placeholder={props.placeholder}
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
        sx={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}
      />
    </Flex>
  );
}

function FlagButton(props: { title: string; tooltip: string; icon: string; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={props.active ? "accentSecondary" : "secondary"}
      title={props.tooltip}
      aria-label={props.title}
      aria-pressed={props.active}
      disabled={props.disabled}
      onClick={props.onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: "small"
      }}
    >
      <Icon path={props.icon} color={props.active ? "accent" : "icon"} size="medium" />
      <Text as="span" variant="subBody" color={props.active ? "accent" : "paragraph"}>
        {props.title}
      </Text>
    </Button>
  );
}
