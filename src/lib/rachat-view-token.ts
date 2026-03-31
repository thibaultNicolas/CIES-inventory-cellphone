import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Durée de validité des liens de confirmation (succès / merci). */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type PayloadV1 = {
  v: 1;
  ids: string[];
  rg: string | null;
  exp: number;
};

function signingKey(): Buffer {
  const explicit = process.env.MERCI_VIEW_SECRET?.trim();
  if (explicit && explicit.length >= 32) {
    return Buffer.from(explicit, "utf8");
  }
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (sr) {
    return createHash("sha256").update(`rachat-view:v1:${sr}`).digest();
  }
  if (process.env.NODE_ENV !== "production") {
    return createHash("sha256").update("rachat-view-dev-only").digest();
  }
  throw new Error(
    "Configure MERCI_VIEW_SECRET (≥32 chars) or SUPABASE_SERVICE_ROLE_KEY for rachat view tokens.",
  );
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim(),
  );
}

/**
 * Jeton signé (HMAC-SHA256) pour autoriser l’affichage des pages succès / merci
 * sans exposer les soumissions via simple `?id=uuid`.
 */
export function signRachatViewToken(
  submissionIds: string[],
  requestGroupId: string | null,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const ids = [...new Set(submissionIds.map((x) => x.trim()).filter(isUuid))];
  if (ids.length === 0) {
    throw new Error("signRachatViewToken: no valid submission ids");
  }
  const rgTrim = requestGroupId?.trim() ?? "";
  const rg = rgTrim && isUuid(rgTrim) ? rgTrim : null;
  const payload: PayloadV1 = {
    v: 1,
    ids,
    rg,
    exp: Date.now() + ttlMs,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", signingKey()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyRachatViewToken(
  token: string | undefined | null,
): { submissionIds: string[]; requestGroupId: string | null } | null {
  if (!token || typeof token !== "string") return null;
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  if (!payloadB64 || !sig) return null;

  let expectedSig: string;
  try {
    expectedSig = createHmac("sha256", signingKey()).update(payloadB64).digest("base64url");
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: PayloadV1;
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (parsed.v !== 1 || !Array.isArray(parsed.ids) || typeof parsed.exp !== "number") {
    return null;
  }
  if (Date.now() > parsed.exp) return null;

  const ids = parsed.ids.map((x) => String(x).trim()).filter(isUuid);
  if (ids.length === 0) return null;

  const rg =
    parsed.rg == null || parsed.rg === ""
      ? null
      : isUuid(String(parsed.rg))
        ? String(parsed.rg).trim()
        : null;

  return { submissionIds: ids, requestGroupId: rg };
}

export { isUuid };
