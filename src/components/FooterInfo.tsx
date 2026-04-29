import { Box, Heading, Link, Text } from "@theme-ui/components";
import { COPY } from "../lib/copy";

export function FooterInfo() {
  return (
    <Box
      bg="background"
      sx={{
        border: "1.5px solid var(--accent)",
        borderRadius: "default",
        display: "grid",
        gap: 2,
        p: 3
      }}
    >
      <Heading as="h2" variant="title" color="accent" sx={sectionHeadingSx}>
        {COPY.footer.title}
      </Heading>

      <Text variant="caption" sx={{ color: "heading", display: "block", lineHeight: 1.55 }}>
        {COPY.footer.descriptionBeforeDocs}{" "}
        <Link
          href={COPY.footer.liquidDocsHref}
          target="_blank"
          rel="noreferrer"
          sx={{ color: "accent", fontWeight: "bold" }}
        >
          {COPY.footer.liquidDocsLabel}
        </Link>{" "}
        {COPY.footer.descriptionAfterDocs}
      </Text>

      <Text variant="caption" sx={{ color: "paragraph-secondary", display: "block", lineHeight: 1.55 }}>
        {COPY.footer.affiliation}
        <br />
        {COPY.footer.subtitle}
      </Text>

      <Text
        variant="caption"
        sx={{
          borderTop: "1px solid var(--separator)",
          color: "paragraph-secondary",
          display: "block",
          fontSize: "0.72rem",
          lineHeight: 1.45,
          opacity: 0.78,
          pt: 2
        }}
      >
        {COPY.footer.smallPrint}
      </Text>
    </Box>
  );
}

const sectionHeadingSx = {
  fontSize: ["1.25rem", "1.45rem"],
  lineHeight: 1.15,
  m: 0
};
