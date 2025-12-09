import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon serverless database client.
 * Uses HTTP for serverless/edge compatibility.
 */

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

// Singleton pattern for Next.js
let db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

// Re-export schema for convenience
export * from "./schema";

