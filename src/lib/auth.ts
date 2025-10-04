// src/lib/auth.ts
import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { NextResponse } from "next/server";

const SECRET = process.env.JWT_SECRET || "dev-secret";

// Password hashing using scrypt with random salt
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, key) => (err ? reject(err) : resolve(key as Buffer)));
  });
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, key) => (err ? reject(err) : resolve(key as Buffer)));
  });
  // timing safe compare
  const isSameLength = derivedKey.length === expected.length;
  return isSameLength && crypto.timingSafeEqual(derivedKey, expected);
}

// Lightweight HMAC-signed token (NOT a standard JWT) {userId, role, iat, exp}
export function signToken(payload: { userId: string; role: "STUDENT" | "STUDIO_OWNER"; exp?: number }): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = payload.exp ?? now + 60 * 60 * 24 * 7; // 7 days
  const body = JSON.stringify({ userId: payload.userId, role: payload.role, iat: now, exp });
  const bodyB64 = Buffer.from(body).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(bodyB64).digest("base64url");
  return `${bodyB64}.${sig}`;
}

export function verifyToken(token: string | undefined | null): { userId: string; role: "STUDENT" | "STUDIO_OWNER" } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [bodyB64, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(bodyB64).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const json = JSON.parse(Buffer.from(bodyB64, "base64url").toString("utf8")) as { userId: string; role: "STUDENT" | "STUDIO_OWNER"; iat: number; exp: number };
    if (!json.exp || json.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: json.userId, role: json.role };
  } catch {
    return null;
  }
}

export async function readSessionCookie(): Promise<{ userId: string; role: "STUDENT" | "STUDIO_OWNER" } | null> {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  return verifyToken(token);
}

// Helper type to represent the cookies API that NextResponse exposes
type CookiesApi = {
  set: (name: string, value: string, options: { httpOnly?: boolean; sameSite?: "lax" | "strict" | "none"; path?: string; secure?: boolean; maxAge?: number }) => void;
};

// Route handlers use NextResponse; ensure we access its cookies API safely
export function commitSessionCookie(res: Response | NextResponse, token: string, maxAgeSeconds?: number): void {
  const cookiesApi = (res as any).cookies as CookiesApi | undefined;
  cookiesApi?.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: typeof maxAgeSeconds === "number" ? maxAgeSeconds : 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(res: Response | NextResponse): void {
  const cookiesApi = (res as any).cookies as CookiesApi | undefined;
  cookiesApi?.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}