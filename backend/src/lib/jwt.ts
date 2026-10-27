import { createHmac, timingSafeEqual } from "crypto";

export type AuthTokenPayload = {
  tid: string;
  sub: number;
  roles: string[];
  exp: number;
};

const encoder = new TextEncoder();

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.AUTH_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "development-only-change-auth-secret";
}

function base64UrlEncode(value: string | Buffer): string {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer.toString("base64url");
}

function sign(input: string): string {
  return createHmac("sha256", getAuthSecret()).update(input).digest("base64url");
}

export function createAuthToken(payload: AuthTokenPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${header}.${body}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const unsignedToken = `${header}.${body}`;
  const expectedSignature = sign(unsignedToken);
  const provided = encoder.encode(signature);
  const expected = encoder.encode(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const id = payload.tid ?? payload.sid;

    if (
      typeof id !== "string" ||
      typeof payload.sub !== "number" ||
      !Array.isArray(payload.roles) ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 < Date.now()
    ) {
      return null;
    }

    return { ...payload, tid: id } as AuthTokenPayload;
  } catch {
    return null;
  }
}

// Backward compatibility exports for watcher cache
export const createSessionToken = createAuthToken;
export const verifySessionToken = verifyAuthToken;
