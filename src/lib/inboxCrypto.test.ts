import { beforeEach, describe, expect, it, vi } from "vitest";
import * as openpgp from "openpgp";
import { encryptInboxPayload } from "./inboxCrypto";
import type { NotesnookInboxPayload } from "./types";

vi.mock("openpgp", () => ({
  createMessage: vi.fn(),
  encrypt: vi.fn(),
  readKey: vi.fn()
}));

const payload: NotesnookInboxPayload = {
  title: "Title",
  type: "note",
  source: "test",
  version: 1,
  content: {
    type: "html",
    data: "<p>Hello</p>"
  },
  pinned: false,
  favorite: false,
  readonly: false,
  archived: false
};

describe("encryptInboxPayload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(openpgp.readKey).mockResolvedValue("public-key" as never);
    vi.mocked(openpgp.createMessage).mockResolvedValue("message" as never);
    vi.mocked(openpgp.encrypt).mockResolvedValue("ciphertext" as never);
  });

  it("encrypts the raw inbox item as armored PGP", async () => {
    const encrypted = await encryptInboxPayload(payload, "armored-key");

    expect(openpgp.readKey).toHaveBeenCalledWith({ armoredKey: "armored-key" });
    expect(openpgp.createMessage).toHaveBeenCalledWith({ text: JSON.stringify(payload) });
    expect(openpgp.encrypt).toHaveBeenCalledWith({
      message: "message",
      encryptionKeys: "public-key",
      format: "armored"
    });
    expect(encrypted).toEqual({
      v: 1,
      alg: "pgp-aes256",
      cipher: "ciphertext"
    });
  });
});
