import * as openpgp from "openpgp";
import type { EncryptedInboxItem, NotesnookInboxPayload } from "./types";

export async function encryptInboxPayload(payload: NotesnookInboxPayload, armoredPublicKey: string): Promise<EncryptedInboxItem> {
  const publicKey = await openpgp.readKey({ armoredKey: armoredPublicKey });
  const message = await openpgp.createMessage({
    text: JSON.stringify(payload)
  });
  const cipher = await openpgp.encrypt({
    message,
    encryptionKeys: publicKey,
    format: "armored"
  });

  return {
    v: 1,
    alg: "pgp-aes256",
    cipher
  };
}
