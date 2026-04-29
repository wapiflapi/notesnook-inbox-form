export const COPY = {
  actions: {
    editTemplate: "Edit template",
    needsKey: (action: string) => `${action} (needs key)`,
    preview: "Preview",
    previewing: "Previewing…",
    send: "Send",
    sending: "Sending…",
    sendNow: "Send now"
  },
  errors: {
    badLink: "Link is invalid.",
    encryption: "Encryption failed.",
    linkParseFailed: "Link could not be parsed.",
    missingKey: "Missing key.",
    network: "Network error.",
    publicKeyUnsupported: "Inbox key is missing its PGP keypair. Update Notesnook to 3.4.x+, disable and re-enable Inbox API, auto-generate keys, sync, then try again.",
    requestFailed: (status: number) => `Request failed (${status}).`,
    templateBroken: "Template is broken.",
    templateMalformed: "Template data is malformed.",
    templateNotCompressed: "Template data could not be decompressed."
  },
  debug: {
    publicKeyFix: "Update Notesnook to a recent 3.4.x+ client, disable and re-enable Inbox API, choose auto-generate keys when prompted, sync, then create or reuse the inbox key and try again.",
    publicKeyInvalid: "Expected an armored OpenPGP public key, but Notesnook returned a compact non-armored key. This usually means the Inbox API key was created before the client generated an Inbox PGP keypair.",
    publicKeyResponseInvalid: "Public key response was not valid JSON with a non-empty key."
  },
  fields: {
    apiKey: {
      includeWarning: "Anyone with this key can send notes, but they can't read anything. Don't share it unless you mean it.",
      label: "Key",
      placeholder: "Paste key"
    },
    archived: "Archived",
    favorite: "Favorite",
    includeKey: {
      label: "Include key",
      no: "No - don't leak it",
      yes: "Yes - put the key in the link"
    },
    notebooks: {
      label: "Notebooks",
      placeholder: "notebook-id, notebook-id"
    },
    onOpen: {
      doNothing: "Do nothing",
      label: "On open",
      preview: "Preview",
      send: "Send (will include key)"
    },
    pinned: "Pinned",
    readonly: "Read-only",
    source: "Source",
    tags: {
      label: "Tags",
      placeholder: "tag-id, tag-id"
    },
    title: {
      label: "Title",
      placeholders: {
        dates: [
          'Title {{ now | date: "%a %d %b" }}',
          'Title {{ now | date: "%d/%m/%Y %H:%M" }}'
        ],
        easterEggs: [
          '{{ args.title | default: "unknown mess" }}',
          '{{ args.title | replace: "robot", "[REDACTED]" }}'
        ]
      }
    }
  },
  footer: {
    affiliation: "Not affiliated with Notesnook.",
    descriptionAfterDocs: "The link stores your template and options. Bookmark it. Click it. It makes a note.",
    descriptionBeforeDocs: "Build Notesnook templates. Use Liquid in the title and body. Don't guess:",
    liquidDocsHref: "https://liquidjs.com/tutorials/intro-to-liquid.html",
    liquidDocsLabel: "RTFM.",
    smallPrint: "Small print: 100% Vibe coded. If people care, we will do it properly. Runs locally in your browser. Your data goes straight to Notesnook. We don't see it. We're also not that interested.",
    subtitle: "We just send notes there.",
    title: "Notesnook notes from links."
  },
  link: {
    ariaLabel: "Link",
    copyFailed: "Copy failed",
    copyIdle: "Copy",
    copied: "Copied",
    copiedAgain: "Copied again",
    heading: "Link",
    placeholder: "Paste link",
    stillCopied: "Still copied",
    subtitle: "You already have one? Paste it."
  },
  status: {
    details: "Details",
    failed: "Failed",
    previewing: "Rendering the template.",
    sending: "Encrypting and sending the note.",
    sent: "Sent",
    sentDescription: "Note delivered to Notesnook.",
    statusCode: (status: number) => ` Status: ${status}`
  },
  tooltips: {
    archived: "Sends it straight to archive.",
    copy: "Copies the link.",
    editTemplate: "Go back. Unlock everything.",
    favorite: "Sends the note favorited.",
    includeKey: "Puts your key in the link.",
    key: "Required. You knew that.",
    link: "Generated link. Updates live.",
    liquidDocs: "Filters, variables, all the magic.",
    notebooks: "Comma-separated notebook IDs.",
    onOpen: "What the link does when opened.",
    pinned: "Sends the note pinned.",
    preview: "Renders the template. You can still edit it.",
    readonly: "Locks the note.",
    send: "Sends what you see.",
    sendNow: "Renders and sends. No preview. No regrets.",
    source: "Included in the request. Use it if you care.",
    tags: "Comma-separated tag IDs.",
    title: "Supports templates. Yes, here too."
  },
  editor: {
    empty: "Write something. Or don't."
  }
} as const;
