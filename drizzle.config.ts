import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está no .env.local.");

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url },
  // Papéis e políticas moram no schema; os papéis do próprio Supabase ficam de fora.
  entities: { roles: { provider: "supabase" } },
  schemaFilter: ["public"],
});
