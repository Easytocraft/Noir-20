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

const [classes, species, backgrounds, items, talents] = ["classes", "species", "backgrounds", "items", "talents"].map(n => json(`data/${n}.json`));

const classHtml = c => `<p>${c.summary}</p><h3>Особенность</h3><p><strong>${c.trait.name}.</strong> ${c.trait.desc}</p><h3>Способности (на выбор)</h3>` +
  c.abilities.map(f => `<p><strong>${f.name}.</strong> ${f.cost ? `<em>(${f.cost})</em> ` : ""}${f.desc}</p>`).join("");
const abilityDocs = c => [
  { name: c.trait.name, type: "feature", img: c.trait.img, system: { kind: "trait", source: c.name, level: 1, cost: c.trait.cost ?? "", description: `<p>${c.trait.desc}</p>` } },
  ...c.abilities.map(a => ({ name: a.name, type: "feature", img: a.img, system: { kind: "ability", source: c.name, level: 1, cost: a.cost ?? "", description: `<p>${a.desc}</p>` } }))
];
const racialDocs = s => s.traits.map(t => ({ name: t.name, type: "feature", img: t.img, system: { kind: "racial", source: s.name, level: 1, cost: "", mods: t.mods, description: `<p>${t.desc}</p>` } }));
const originDocs = b => ({ name: b.trait.name, type: "feature", img: b.trait.img, system: { kind: "origin", source: b.name, level: 1, cost: "", description: `<p>${b.trait.desc}</p>` } });

const packs = {
  "noir-classes": ["Нуар: Классы", classes.map(c => ({ name: c.name, type: "class", img: c.img, system: { ...c.system, description: classHtml(c) } }))],
  "noir-features": ["Нуар: Особенности и способности", [...classes.flatMap(abilityDocs), ...species.flatMap(racialDocs), ...backgrounds.map(originDocs)]],
  "noir-talents": ["Нуар: Приёмы", talents.map(t => ({ ...t, system: { ...t.system, kind: "talent" } }))],
  "noir-species": ["Нуар: Расы", species.map(s => ({ name: s.name, type: "species", img: s.img, system: s.system }))],
  "noir-backgrounds": ["Нуар: Происхождения", backgrounds.map(b => ({ name: b.name, type: "background", img: b.img, system: b.system }))],
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
    const doc = { _id, name: d.name, type: d.type, img: d.img ?? "icons/svg/item-bag.svg", system: d.system, effects: [], flags: {}, folder: null, sort: 0,
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
