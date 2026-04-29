import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendToNotesnook } from "./inboxApi";
import { encryptInboxPayload } from "./inboxCrypto";
import type { NotesnookInboxPayload } from "./types";

vi.mock("./inboxCrypto", () => ({
  encryptInboxPayload: vi.fn()
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

describe("sendToNotesnook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(encryptInboxPayload).mockResolvedValue({
      v: 1,
      alg: "pgp-aes256",
      cipher: "ciphertext"
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the public key, encrypts locally, and posts the encrypted item", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ key: "-----BEGIN PGP PUBLIC KEY BLOCK-----\npublic-key\n-----END PGP PUBLIC KEY BLOCK-----" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendToNotesnook(" key ", payload);

    expect(result).toEqual({
      status: "success",
      httpStatus: 200,
      responseBody: "{\"success\":true}"
    });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://api.notesnook.com/inbox/public-encryption-key", {
      headers: {
        Authorization: "key"
      }
    });
    expect(encryptInboxPayload).toHaveBeenCalledWith(payload, "-----BEGIN PGP PUBLIC KEY BLOCK-----\npublic-key\n-----END PGP PUBLIC KEY BLOCK-----");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://api.notesnook.com/inbox/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "key"
      },
      body: JSON.stringify({ v: 1, alg: "pgp-aes256", cipher: "ciphertext" })
    });
  });

  it("returns a normalized error when the public key request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 403 })));

    const result = await sendToNotesnook("key", payload);

    expect(result).toEqual({
      status: "error",
      message: "Request failed (403).",
      httpStatus: 403,
      responseBody: "nope"
    });
    expect(encryptInboxPayload).not.toHaveBeenCalled();
  });

  it("includes nerd details when local encryption fails", async () => {
    vi.mocked(encryptInboxPayload).mockRejectedValue(new Error("readKey failed"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ key: "-----BEGIN PGP PUBLIC KEY BLOCK-----\npublic-key\n-----END PGP PUBLIC KEY BLOCK-----" }), { status: 200 })));

    const result = await sendToNotesnook("key", payload);

    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.message).toBe("Encryption failed.");
    expect(result.responseBody).toContain("\"phase\": \"encryption\"");
    expect(result.responseBody).toContain("\"errorMessage\": \"readKey failed\"");
    expect(result.responseBody).toContain("\"publicKeyLooksArmored\": true");
  });

  it("reports compact non-OpenPGP public keys before encryption", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ key: "ictB8F9eE-compact-key-k0V6DHKK1xk" }), { status: 200 })));

    const result = await sendToNotesnook("key", payload);

    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.message).toBe("Inbox key is missing its PGP keypair. Update Notesnook to 3.4.x+, disable and re-enable Inbox API, auto-generate keys, sync, then try again.");
    expect(result.responseBody).toContain("\"phase\": \"public-key-format\"");
    expect(result.responseBody).toContain("\"publicKeyLooksArmored\": false");
    expect(result.responseBody).toContain("auto-generate keys");
    expect(encryptInboxPayload).not.toHaveBeenCalled();
  });

  it("does not send without a key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendToNotesnook(" ", payload);

    expect(result).toEqual({
      status: "error",
      message: "Missing key."
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
