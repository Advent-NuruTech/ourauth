import "./load-env";
import { sql } from "../lib/ants/db";
import { rotateSigningKey } from "../lib/ants/crypto/keys";

async function main() {
  const kid = await rotateSigningKey();
  console.log(`✓ New active signing key created: kid=${kid}`);
  console.log("  Previous active key (if any) is now 'retiring' and still served via JWKS.");
  await sql.end();
}

main().catch(async (e) => {
  console.error("Key rotation failed:", e);
  await sql.end();
  process.exit(1);
});
