// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Map Neon-provided env vars to Prisma expected ones if not already set
(function mapNeonEnv() {
  const buildUrlFromPgVars = (useUnpooledHost: boolean): string | undefined => {
    const user = process.env.PGUSER || process.env.POSTGRES_USER;
    const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
    const host = useUnpooledHost
      ? process.env.PGHOST_UNPOOLED || process.env.POSTGRES_HOST
      : process.env.POSTGRES_HOST || process.env.PGHOST;
    const database = process.env.PGDATABASE || process.env.POSTGRES_DATABASE;
    if (user && host && database) {
      const creds = password ? `${user}:${password}` : `${user}`;
      // Neon requires SSL; if an SSL-less URL is provided, Prisma can still work for serverless
      const sslParam = "?sslmode=require";
      return `postgresql://${creds}@${host}/${database}${sslParam}`;
    }
    return undefined;
  };

  // DATABASE_URL: prefer fully-formed Neon URLs if provided
  if (!process.env.DATABASE_URL) {
    const pooled =
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NO_SSL ||
      buildUrlFromPgVars(false);
    if (pooled) process.env.DATABASE_URL = pooled;
  }

  // DIRECT_URL (non-pooled) for migrations/schema ops
  if (!process.env.DIRECT_URL) {
    const direct =
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_PRISMA_URL_NON_POOLING ||
      process.env.POSTGRES_URL_NO_SSL ||
      buildUrlFromPgVars(true);
    if (direct) process.env.DIRECT_URL = direct;
  }
})();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;