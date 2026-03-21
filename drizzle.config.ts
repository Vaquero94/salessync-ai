import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local so DATABASE_URL is available for migrations
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
