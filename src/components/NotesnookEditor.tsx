import "@notesnook/editor/styles/styles.css";
import "@notesnook/editor/styles/katex.min.css";
import "@notesnook/editor/styles/katex-fonts.css";
import "@notesnook/editor/styles/fonts.css";

import { getHTMLFromFragment, Toolbar, usePermissionHandler, useTiptap } from "@notesnook/editor";
import type { TiptapOptions, ToolbarDefinition } from "@notesnook/editor";
import { EmotionThemeProvider } from "@notesnook/theme";
import { Box } from "@theme-ui/components";
import { COPY } from "../lib/copy";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  header?: ReactNode;
};

const toolbar: ToolbarDefinition = [
  ["bold", "italic", "underline", "strikethrough", "code"],
  ["headings", "bulletList", "numberedList", "checkList"],
  ["addLink", "removeLink", "clearformatting"]
];

export function NotesnookThemeFrame({ children }: { children: ReactNode }) {
  return (
    <EmotionThemeProvider scope="editor">
      {children}
    </EmotionThemeProvider>
  );
}

export function NotesnookEditor({ value, onChange, readOnly = false, header }: Props) {
  const [initialContent] = useState(value);
  const [initialReadOnly] = useState(readOnly);
  const hostRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const readOnlyRef = useRef(readOnly);
  const lastValue = useRef(value);
  const editorElement = useMemo(() => {
    const element = document.createElement("div");
    element.className = "editor editor-container";
    return element;
  }, []);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  usePermissionHandler({ claims: { premium: false }, onPermissionDenied: () => undefined });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.appendChild(editorElement);

    return () => {
      if (editorElement.parentNode === host) {
        host.removeChild(editorElement);
      }
    };
  }, [editorElement]);

  const editorOptions = useMemo<Partial<TiptapOptions>>(
    () => ({
      element: editorElement,
      content: initialContent,
      editable: !initialReadOnly,
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24-hour",
      getAttachmentData: async () => undefined,
      createInternalLink: async () => undefined,
      onUpdate: ({ editor }) => {
        if (readOnlyRef.current) return;
        const html = getHTMLFromFragment(editor.state.doc.content, editor.schema);
        lastValue.current = html;
        onChangeRef.current(html);
      }
    }),
    [editorElement, initialContent, initialReadOnly]
  );

  const editor = useTiptap(editorOptions, [editorOptions]);

  useEffect(() => {
    (editor as { setEditable?: (editable: boolean) => void }).setEditable?.(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (value === lastValue.current) return;
    editor.commands.setContent(value, false, { preserveWhitespace: true });
    lastValue.current = value;
  }, [editor, value]);

  return (
    <NotesnookThemeFrame>
      <Box
        aria-disabled={readOnly}
        className="active notesnook-editor-shell"
        bg="background"
        style={{ "--notesnook-empty-editor-copy": JSON.stringify(COPY.editor.empty) } as CSSProperties}
        sx={{
          display: "grid",
          gridTemplateRows: readOnly ? "auto auto" : "auto auto auto",
          minHeight: 0,
          overflow: "hidden"
        }}
      >
        {!readOnly && (
          <Toolbar
            editor={editor}
            location="top"
            tools={toolbar}
            defaultFontFamily="sans-serif"
            defaultFontSize={16}
            sx={{ borderBottom: "1px solid var(--separator)", borderRadius: 0, px: 1, py: 1 }}
          />
        )}
        {header}
        <Box sx={{ minHeight: 0, overflow: "hidden", position: "relative" }}>
          <Box className="dialogContainer" />
          <Box
            className="notesnook-editor-scroll"
            sx={{
              maxHeight: "calc(100dvh - 260px)",
              minHeight: 0,
              overflow: "auto",
              width: "100%"
            }}
          >
            <Box ref={hostRef} sx={{ px: [2, 4], py: 2 }} />
          </Box>
        </Box>
      </Box>
    </NotesnookThemeFrame>
  );
}
