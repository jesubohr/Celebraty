import { createClient, type Config } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema"

export function createDb(config: Config) {
  const client = createClient(config)
  return drizzle(client, { schema })
}

export type AppDb = ReturnType<typeof createDb>

export const db = createDb({
  url: import.meta.env.TURSO_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
})
