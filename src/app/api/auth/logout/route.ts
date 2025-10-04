// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  clearSessionCookie(res);
  return res;
}