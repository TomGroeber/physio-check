/**
 * Obsidian-Synchronisation (Etappe 9).
 * Aufruf: `pnpm docs:sync` (nutzt OBSIDIAN_VAULT_PATH aus .env.local).
 *
 * Kopiert die Projektdokumentation (README, TASKS, DECISIONS, docs/*.md)
 * in den Obsidian-Vault unter `02_Projekte/PhysioCheck/`. Einbahnstraße:
 * Quelle ist immer das Repository; die Kopien im Vault tragen einen
 * Hinweis und werden beim nächsten Lauf überschrieben. Der Sync fasst
 * ausschließlich seinen eigenen Zielordner an – niemals andere Notizen.
 * Es werden nur Projektdokumente übertragen, nie Patientendaten.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
if (!vaultPath) {
  console.error("OBSIDIAN_VAULT_PATH fehlt (.env.local), z. B. /Users/tomgroeber/Desktop/UNI-Wissensbasis");
  process.exit(1);
}
if (!existsSync(join(vaultPath, ".obsidian"))) {
  console.error(`Sicherheitsstopp: ${vaultPath} sieht nicht wie ein Obsidian-Vault aus (kein .obsidian-Ordner).`);
  process.exit(1);
}

const repoRoot = join(import.meta.dirname, "..");
const targetRoot = join(vaultPath, "02_Projekte", "PhysioCheck");

/** Zu synchronisierende Markdown-Dateien relativ zum Repo. */
function collectSources(): string[] {
  const sources = ["README.md", "TASKS.md", "DECISIONS.md"].filter((file) =>
    existsSync(join(repoRoot, file))
  );
  const docsDir = join(repoRoot, "docs");
  if (existsSync(docsDir)) {
    for (const entry of readdirSync(docsDir)) {
      if (entry.endsWith(".md") && statSync(join(docsDir, entry)).isFile()) {
        sources.push(join("docs", entry));
      }
    }
  }
  return sources;
}

const banner = (source: string) =>
  `> [!info] Automatisch synchronisierte Kopie\n` +
  `> Quelle: \`${source}\` im Repository \`physio-check\` · Stand: ${new Date().toISOString().slice(0, 10)}\n` +
  `> Änderungen bitte im Repository machen – diese Datei wird beim nächsten \`pnpm docs:sync\` überschrieben.\n\n`;

function main() {
  const sources = collectSources();
  if (!sources.length) {
    console.error("Keine Dokumentationsdateien gefunden – nichts zu tun.");
    process.exit(1);
  }

  // Nur den eigenen Zielordner neu aufbauen; sonst nichts im Vault anfassen.
  rmSync(targetRoot, { recursive: true, force: true });
  mkdirSync(join(targetRoot, "docs"), { recursive: true });

  const indexLines: string[] = [
    banner("(Index, generiert)"),
    "# PhysioCheck – Projektdokumentation",
    "",
  ];
  for (const source of sources) {
    const content = readFileSync(join(repoRoot, source), "utf8");
    const target = join(targetRoot, source);
    writeFileSync(target, banner(source) + content);
    const noteName = relative(targetRoot, target).replace(/\.md$/, "");
    indexLines.push(`- [[${noteName}]]`);
    console.log(`  ✓ ${source}`);
  }
  writeFileSync(join(targetRoot, "00_Index.md"), indexLines.join("\n") + "\n");

  console.log(`\nSynchronisiert: ${sources.length} Dateien → ${targetRoot}`);
}

main();
