import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

// Singleton pattern: prevent pool recreation on hot reloads in development
// This is critical for performance - reusing connections instead of creating new ones
declare global {
  // eslint-disable-next-line no-var
  var _neonPool: Pool | undefined;
}

let pool: Pool;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({ connectionString: process.env.DATABASE_URL! });
} else {
  // In development, use global variable to preserve pool across hot reloads
  if (!global._neonPool) {
    global._neonPool = new Pool({
      connectionString: process.env.DATABASE_URL!,
    });
  }
  pool = global._neonPool;
}

const db = drizzle(pool, { schema });

export default db;
