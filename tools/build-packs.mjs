// Сборка компендиумов в формат Foundry (LevelDB).
//   npm install && npm run packs          — собрать и прописать packs в system.json
//   node tools/build-packs.mjs --source-only   — только сгенерировать packs/_source (без CLI)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = f => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const sourceOnly = process.argv.includes("--source-only");

const [classes, species, backgrounds, items, subclasses, talents] =
  ["classes", "species", "backgrounds", "items", "subclasses", "talents"].map(n => json(`data/${n}.json`));

const classHtml = c => `<p>${c.summary}</p><h3>Умения</h3>` +
  c.features.map(f => `<p><strong>${f.level} ур. — ${f.name}.</strong> ${f.cost ? `<em>(${f.cost})</em> ` : ""}${f.desc}</p>`).join("");
const featDocs = list => list.flatMap(c => c.features.map(f => ({
  name: f.name, type: "feature", system: { level: f.level, source: c.name, cost: f.cost ?? "", description: `<p>${f.desc}</p>` } })));

const packs = {
  "noir-classes": ["Нуар: Классы", classes.map(c => ({ name: c.name, type: "class", system: { ...c.system, description: classHtml(c) } }))],
  "noir-features": ["Нуар: Умения классов", [...featDocs(classes), ...featDocs(subclasses)]],
  "noir-subclasses": ["Нуар: Подклассы", subclasses.map(c => ({ name: c.name, type: "subclass", system: { class: c.class, description: classHtml(c) } }))],
  "noir-talents": ["Нуар: Приёмы", talents],
  "noir-species": ["Нуар: Расы", species.map(s => ({ name: s.name, type: "species", system: s.system }))],
  "noir-backgrounds": ["Нуар: Происхождения", backgrounds.map(b => ({ name: b.name, type: "background", system: b.system }))],
  "noir-gear": ["Нуар: Снаряжение", items]
};

const id = (pack, name, type, src = "") => crypto.createHash("sha1").update(`${pack}/${type}/${src}/${name}`).digest("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 16);

const srcRoot = path.join(root, "packs/_source");
fs.rmSync(srcRoot, { recursive: true, force: true });
let total = 0;
for (const [name, [, docs]] of Object.entries(packs)) {
  const dir = path.join(srcRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  const seen = new Set();
  for (const d of docs) {
    const _id = id(name, d.name, d.type, d.system?.source);
    if (seen.has(_id)) throw new Error(`Коллизия _id: ${name}/${d.name}`);
    seen.add(_id);
    const doc = { _id, name: d.name, type: d.type, img: "icons/svg/item-bag.svg", system: d.system, effects: [], flags: {}, folder: null, sort: 0,
      ownership: { default: 0 }, _key: `!items!${_id}` };
    fs.writeFileSync(path.join(dir, `${d.name.replace(/[^\p{L}\p{N}]+/gu, "_")}_${_id}.json`), JSON.stringify(doc, null, 2));
    total++;
  }
}
console.log(`Сгенерировано документов: ${total} в ${Object.keys(packs).length} паках`);
if (sourceOnly) process.exit(0);

const { compilePack } = await import("@foundryvtt/foundryvtt-cli");
for (const name of Object.keys(packs)) {
  fs.rmSync(path.join(root, "packs", name), { recursive: true, force: true });
  await compilePack(path.join(srcRoot, name), path.join(root, "packs", name), { log: true });
}
const manifestPath = path.join(root, "system.json");
const manifest = json("system.json");
manifest.packs = Object.entries(packs).map(([name, [label]]) => ({
  name, label, path: `packs/${name}`, type: "Item", system: manifest.id, ownership: { PLAYER: "OBSERVER", ASSISTANT: "OWNER" }
}));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("system.json: packs прописаны. Теперь система использует готовые компендиумы, автосоздание не потребуется.");
