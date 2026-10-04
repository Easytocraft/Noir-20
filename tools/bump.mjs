// Повышение версии:  npm run bump -- 0.4.2   или   npm run bump -- patch
// Обновляет system.json (version, download), package.json и добавляет заготовку в CHANGELOG.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = f => fs.readFileSync(path.join(root, f), "utf8");
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);

const system = JSON.parse(rd("system.json")), pkg = JSON.parse(rd("package.json"));
const arg = process.argv[2];
if (!arg) { console.error("Укажите версию: npm run bump -- 0.4.2 (или patch / minor)"); process.exit(1); }
const [a, b, c] = system.version.split(".").map(Number);
const next = arg === "patch" ? `${a}.${b}.${c + 1}` : arg === "minor" ? `${a}.${b + 1}.0` : arg;
if (!/^\d+\.\d+\.\d+$/.test(next)) { console.error(`Неверная версия: ${next}`); process.exit(1); }

const prev = system.version;
system.version = next; pkg.version = next;
system.download = `${system.url}/releases/download/v${next}/noir-d20.zip`;
wr("system.json", JSON.stringify(system, null, 2) + "\n");
wr("package.json", JSON.stringify(pkg, null, 2) + "\n");
const log = rd("CHANGELOG.md");
wr("CHANGELOG.md", log.replace("# Журнал изменений\n", `# Журнал изменений\n\n## ${next}\n- \n`));
console.log(`Версия ${prev} → ${next}\ndownload: ${system.download}\nmanifest: ${system.manifest}`);
