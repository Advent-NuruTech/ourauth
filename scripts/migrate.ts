import "./load-env";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { sql } from "../lib/ants/db";

const DIR = join(process.cwd(), "db", "migrations");

async function main() {
  await sql`
    create table if not exists ants_migrations (
      id text primary key, applied_at timestamptz not null default now()
    )
  `;
  const applied = new Set(
    (await sql<{ id: string }[]>`select id from ants_migrations`).map((r) => r.id),
  );

  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`• skip ${file} (already applied)`);
      continue;
    }
    const text = readFileSync(join(DIR, file), "utf8");
    console.log(`▶ applying ${file} ...`);
    await sql.unsafe(text);
    await sql`insert into ants_migrations (id) values (${file})`;
    count++;
    console.log(`✓ applied ${file}`);
  }
  console.log(count ? `\nDone. ${count} migration(s) applied.` : "\nUp to date.");
  await sql.end();
}

main().catch(async (e) => {
  console.error("Migration failed:", e);
  await sql.end();
  process.exit(1);
});
