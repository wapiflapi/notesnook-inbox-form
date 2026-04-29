import type { EncryptedInboxItem, NotesnookInboxPayload, SendResult } from "./types";
import { COPY } from "./copy";
import { encryptInboxPayload } from "./inboxCrypto";

const NOTESNOOK_API = "https://api.notesnook.com";

type PublicKeyResponse = {
  key?: unknown;
};

export async function sendToNotesnook(apiKey: string, payload: NotesnookInboxPayload): Promise<SendResult> {
  const key = apiKey.trim();
  if (!key) {
    return {
      status: "error",
      message: COPY.errors.missingKey
    };
  }

  const publicKey = await runInboxStep("public-key", COPY.errors.network, () => fetchInboxPublicKey(key));
  if (typeof publicKey !== "string") return publicKey;

  const publicKeyFormatError = validateOpenPgpPublicKey(publicKey);
  if (publicKeyFormatError) return publicKeyFormatError;

  const encryptedItem = await runInboxStep(
    "encryption",
    COPY.errors.encryption,
    () => encryptInboxPayload(payload, publicKey),
    getPublicKeyDebug(publicKey)
  );
  if (isSendResult(encryptedItem)) return encryptedItem;

  const sendResult = await runInboxStep("send", COPY.errors.network, () => postEncryptedInboxItem(key, encryptedItem));
  return sendResult;
}

async function runInboxStep<T>(
  phase: string,
  message: string,
  action: () => Promise<T>,
  details?: Record<string, unknown>
): Promise<T | SendResult> {
  try {
    return await action();
  } catch (error) {
    return {
      status: "error",
      message,
      responseBody: formatDebugDetails(phase, error, details)
    };
  }
}

async function fetchInboxPublicKey(apiKey: string): Promise<string | SendResult> {
  const response = await fetch(`${NOTESNOOK_API}/inbox/public-encryption-key`, {
    headers: {
      Authorization: apiKey
    }
  });
  const responseBody = await response.text().catch(() => "");

  if (!response.ok) {
    return {
      status: "error",
      message: COPY.errors.requestFailed(response.status),
      httpStatus: response.status,
      responseBody
    };
  }

  try {
    const data = JSON.parse(responseBody) as PublicKeyResponse;
    if (typeof data.key === "string" && data.key.trim()) return data.key;
  } catch {
    // Fall through to the normalized error below.
  }

  return {
    status: "error",
    message: COPY.errors.network,
    responseBody: formatDebugDetails("public-key", new Error(COPY.debug.publicKeyResponseInvalid), {
      responseBody
    })
  };
}

async function postEncryptedInboxItem(apiKey: string, encryptedItem: EncryptedInboxItem): Promise<SendResult> {
  const response = await fetch(`${NOTESNOOK_API}/inbox/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey
    },
    body: JSON.stringify(encryptedItem)
  });
  const responseBody = await response.text().catch(() => "");

  if (!response.ok) {
    return {
      status: "error",
      message: COPY.errors.requestFailed(response.status),
      httpStatus: response.status,
      responseBody
    };
  }

  return {
    status: "success",
    httpStatus: response.status,
    responseBody
  };
}

function isSendResult(value: unknown): value is SendResult {
  return Boolean(value && typeof value === "object" && "status" in value);
}

function getPublicKeyDebug(publicKey: string): Record<string, unknown> {
  const trimmed = publicKey.trim();
  return {
    publicKeyLength: publicKey.length,
    publicKeyLooksArmored: trimmed.startsWith("-----BEGIN PGP PUBLIC KEY BLOCK-----"),
    publicKeyFirstLine: trimmed.split(/\r?\n/, 1)[0] || ""
  };
}

function validateOpenPgpPublicKey(publicKey: string): SendResult | undefined {
  const debugDetails = getPublicKeyDebug(publicKey);
  if (debugDetails.publicKeyLooksArmored) return undefined;

  return {
    status: "error",
    message: COPY.errors.publicKeyUnsupported,
    responseBody: JSON.stringify({
      phase: "public-key-format",
      errorName: "UnsupportedPublicKeyFormat",
      errorMessage: COPY.debug.publicKeyInvalid,
      fix: COPY.debug.publicKeyFix,
      ...debugDetails
    }, null, 2)
  };
}

function formatDebugDetails(phase: string, error: unknown, details?: Record<string, unknown>): string {
  const normalized = error instanceof Error
    ? {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    : {
        errorName: typeof error,
        errorMessage: String(error)
      };

  return JSON.stringify({
    phase,
    ...normalized,
    ...details
  }, null, 2);
}
