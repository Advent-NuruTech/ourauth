// Side-effect module: load .env.local for standalone scripts. Imported FIRST so
// env is populated before lib/ants/config is read. Next.js loads env itself at runtime.
import { existsSync } from "fs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    try {
      // Node 20.12+/22+ : built-in .env parser.
      process.loadEnvFile(file);
    } catch {
      // ignore; env may already be present in the environment
    }
  }
}
