// scripts/set-env-from-neon.js
/*
  Map Neon-provided env vars to Prisma's expected DATABASE_URL and DIRECT_URL
  and persist them into a .env file so subsequent processes (Prisma CLI) can read them.
*/

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function buildUrl({ user, password, host, database }) {
  if (!user || !host || !database) return undefined;
  const creds = password ? `${user}:${password}` : `${user}`;
  const sslParam = "?sslmode=require";
  return `postgresql://${creds}@${host}/${database}${sslParam}`;
}

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NO_SSL ||
    buildUrl({
      user: process.env.PGUSER || process.env.POSTGRES_USER,
      password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST || process.env.PGHOST,
      database: process.env.PGDATABASE || process.env.POSTGRES_DATABASE,
    })
  );
}

function resolveDirectUrl() {
  return (
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NO_SSL ||
    buildUrl({
      user: process.env.PGUSER || process.env.POSTGRES_USER,
      password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
      host: process.env.PGHOST_UNPOOLED || process.env.POSTGRES_HOST,
      database: process.env.PGDATABASE || process.env.POSTGRES_DATABASE,
    })
  );
}

const dbUrl = resolveDatabaseUrl();
const directUrl = resolveDirectUrl();

if (!dbUrl || !directUrl) {
  console.warn(
    "Warning: Could not resolve DATABASE_URL or DIRECT_URL from Neon variables."
  );
}

const envLines = [];
if (dbUrl) envLines.push(`DATABASE_URL=${dbUrl}`);
if (directUrl) envLines.push(`DIRECT_URL=${directUrl}`);

if (envLines.length) {
  const envPath = path.join(process.cwd(), ".env");
  try {
    // Merge with existing .env without duplicating keys
    let current = "";
    if (fs.existsSync(envPath)) {
      current = fs.readFileSync(envPath, "utf8");
    }
    const filtered = current
      .split(/\r?\n/)
      .filter((line) => !/^\s*(DATABASE_URL|DIRECT_URL)\s*=/.test(line))
      .join("\n");
    const finalContent = [filtered, ...envLines].filter(Boolean).join("\n");
    fs.writeFileSync(envPath, finalContent, "utf8");
    console.log(".env updated with DATABASE_URL and DIRECT_URL for Prisma.");
  } catch {
    console.error("Failed to write .env");
  }
}