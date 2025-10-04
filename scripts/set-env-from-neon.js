// scripts/set-env-from-neon.js
/*
  This script maps Neon-provided env vars to Prisma's expected DATABASE_URL and DIRECT_URL
  so that prisma generate/db push run successfully during Vercel builds.
*/

function buildUrl({ user, password, host, database }) {
  if (!user || !host || !database) return undefined;
  const creds = password ? `${user}:${password}` : `${user}`;
  const sslParam = "?sslmode=require";
  return `postgresql://${creds}@${host}/${database}${sslParam}`;
}

// Prefer fully formed URLs first
if (!process.env.DATABASE_URL) {
  const pooled =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NO_SSL;
  if (pooled) process.env.DATABASE_URL = pooled;
}

if (!process.env.DIRECT_URL) {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NO_SSL;
  if (direct) process.env.DIRECT_URL = direct;
}

// Fallback: compose URLs from PG* variables Neon provides
if (!process.env.DATABASE_URL) {
  const url = buildUrl({
    user: process.env.PGUSER || process.env.POSTGRES_USER,
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST || process.env.PGHOST,
    database: process.env.PGDATABASE || process.env.POSTGRES_DATABASE,
  });
  if (url) process.env.DATABASE_URL = url;
}

if (!process.env.DIRECT_URL) {
  const url = buildUrl({
    user: process.env.PGUSER || process.env.POSTGRES_USER,
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
    host: process.env.PGHOST_UNPOOLED || process.env.POSTGRES_HOST,
    database: process.env.PGDATABASE || process.env.POSTGRES_DATABASE,
  });
  if (url) process.env.DIRECT_URL = url;
}

console.log("Using DATABASE_URL:", process.env.DATABASE_URL ? "set" : "missing");
console.log("Using DIRECT_URL:", process.env.DIRECT_URL ? "set" : "missing");