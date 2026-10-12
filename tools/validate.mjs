// Проверка данных и ссылок без запуска Foundry:  node tools/validate.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const json = f => JSON.parse(read(f));
const { NOIR } = await import(path.join(root, "module/config.mjs"));
let errors = 0;
const err = m => { errors++; console.error("✗", m); };
const ok = m => console.log("✓", m);
const ABIL = Object.keys(NOIR.abilities);
const TABS_ = ["class", "species", "background", "stats", "persona", "gear"];

const classes = json("data/classes.json"), species = json("data/species.json"), bgs = json("data/backgrounds.json");
const items = json("data/items.json"), talents = json("data/talents.json"), system = json("system.json"), lang = json("lang/ru.json");

ABIL.join() === "str,dex,int,con,luck,cha" || err(`порядок характеристик: ${ABIL}`);
fs.existsSync(path.join(root, "data/subclasses.json")) && err("data/subclasses.json больше не нужен (подклассов нет)");
const gear = new Map(items.map(i => [i.name, i]));
const arr = JSON.stringify([...NOIR.statArray].sort());

// --- классы: 1 особенность + 6 способностей, параметры, стартовые предметы
const CLASSES = ["Гангстер", "Вышибала", "Лекарь", "Оккультист", "Шоумен", "Сыщик", "Взломщик", "Водила", "Наёмник"];
JSON.stringify(classes.map(c => c.name)) === JSON.stringify(CLASSES) || err(`классы: ${classes.map(c => c.name)}`);
for (const c of classes) {
  Object.keys(c.system.stats).sort().join() === [...ABIL].sort().join() || err(`${c.name}: набор характеристик`);
  JSON.stringify(Object.values(c.system.stats).sort()) === arr || err(`${c.name}: стартовые характеристики не совпадают с набором ${NOIR.statArray}`);
  c.abilities.length === 6 || err(`${c.name}: способностей ${c.abilities.length}, нужно 6`);
  c.trait?.name || err(`${c.name}: нет особенности`);
  for (const k of ["evasion", "wounds", "stress", "threshold"]) typeof c.system.mods[k] === "number" || err(`${c.name}: mods.${k}`);
  c.system.startItems.forEach(n => gear.has(n) || err(`${c.name}: нет стартового предмета «${n}»`));
  const names = [c.trait.name, ...c.abilities.map(a => a.name)];
  new Set(names).size === names.length || err(`${c.name}: повтор названий способностей`);
}
ok(`классы: ${classes.length} (особенность + 6 способностей у каждого)`);

// --- расы: 15, по 2 особенности
const RACES = ["Человек", "Демон", "Голиаф", "Эльф", "Муррены", "Раттены", "Орк", "Дворф", "Гоблин", "Лилипут", "Авианы", "Гнолл", "Тритон", "Огр", "Драконид"];
JSON.stringify(species.map(s => s.name)) === JSON.stringify(RACES) || err(`расы: ${species.map(s => s.name)}`);
for (const s of species) {
  s.traits.length === 2 || err(`${s.name}: особенностей ${s.traits.length}, нужно 2`);
  for (const t of s.traits) for (const k of ["evasion", "wounds", "stress", "threshold"]) typeof t.mods?.[k] === "number" || err(`${s.name}/${t.name}: mods.${k}`);
}
ok(`расы: ${species.length} (по 2 особенности)`);

// --- происхождения: 10, по особенности
const ORIGINS = ["Правопорядок", "Трущобы", "Богема", "Докарь", "Мафиози", "Консилум", "Кочевник", "Армейский солдат", "Шабаш", "Шпана"];
JSON.stringify(bgs.map(b => b.name)) === JSON.stringify(ORIGINS) || err(`происхождения: ${bgs.map(b => b.name)}`);
for (const b of bgs) { b.trait?.name || err(`${b.name}: нет особенности`); b.system.startItems.forEach(n => gear.has(n) || err(`${b.name}: нет предмета «${n}»`)); }
ok(`происхождения: ${bgs.length}`);

// --- предметы и стартовый набор
const types = Object.keys(system.documentTypes.Item);
types.includes("subclass") && err("тип subclass должен быть удалён");
for (const i of items) {
  types.includes(i.type) || err(`предмет ${i.name}: тип ${i.type}`);
  if (i.type === "weapon" && !["str", "dex", "finesse"].includes(i.system.ability)) err(`${i.name}: ability`);
  if (i.type === "armor" && (i.system.protection == null || i.system.evasion == null)) err(`${i.name}: защита/уклонение`);
}
new Set(items.map(i => i.name)).size === items.length || err("дубли названий предметов");
[...NOIR.starter.choiceA, ...NOIR.starter.choiceB].forEach(n => gear.has(n) || err(`стартовый выбор: нет предмета «${n}»`));
if (!items.some(i => i.type === "armor" && i.system.kind === "armor" && i.system.price <= NOIR.starter.armorMax)) err("нет стартовой брони");
if (!items.some(i => i.type === "weapon" && i.system.price <= NOIR.starter.weaponMax)) err("нет стартового оружия");
ok(`предметы: ${items.length}, приёмы: ${talents.length}`);

// --- картинки: у каждого документа своя, файл есть, SVG без скриптов
const owners = [
  ...classes.flatMap(c => [[`класс ${c.name}`, c.img], [`особенность ${c.name}/${c.trait.name}`, c.trait.img], ...c.abilities.map(a => [`способность ${c.name}/${a.name}`, a.img])]),
  ...species.flatMap(s => [[`раса ${s.name}`, s.img], ...s.traits.map(t => [`особенность ${s.name}/${t.name}`, t.img])]),
  ...bgs.flatMap(b => [[`происхождение ${b.name}`, b.img], [`особенность ${b.name}/${b.trait.name}`, b.trait.img]]),
  ...talents.map(t => [`приём ${t.name}`, t.img]), ...items.map(i => [`предмет ${i.name}`, i.img])
];
const seen = new Set();
for (const [who, img] of owners) {
  if (!img) { err(`нет картинки: ${who}`); continue; }
  if (seen.has(img)) err(`картинка используется дважды: ${img} (${who})`);
  seen.add(img);
  const file = path.join(root, img.replace(/^systems\/noir-d20\//, ""));
  if (!fs.existsSync(file)) { err(`нет файла ${img} (${who})`); continue; }
  const svg = fs.readFileSync(file, "utf8");
  if (!svg.startsWith("<svg") || svg.includes("<script") || svg.includes("href=")) err(`подозрительный SVG: ${img}`);
}
ok(`картинок: ${seen.size}, у каждого документа своя`);

// --- устаревшие механики не должны всплывать в текстах
const banned = /(^|\s)(хит(ы|ов|а|ах)?|КД|Жар|навык\w*|спасбросок|спасброски|мастерств\w*|Нерв(а|у|ом|е)?)(\s|[.,;:)]|$)/i;
const texts = [
  ...classes.flatMap(c => [[c.name, c.summary], [c.trait.name, c.trait.desc], ...c.abilities.map(a => [a.name, a.desc])]),
  ...species.flatMap(s => [[s.name, s.system.description], ...s.traits.map(t => [t.name, t.desc])]),
  ...bgs.flatMap(b => [[b.name, b.system.description], [b.trait.name, b.trait.desc]]), ...talents.map(t => [t.name, t.system.description]), ...items.map(i => [i.name, i.system.description ?? ""])
];
for (const [n, t] of texts) if (banned.test(t)) err(`устаревшая механика в тексте «${n}»`);
ok("устаревшие механики в текстах не найдены");

// --- шрифты
const { FONTS } = await import(path.join(root, "module/fonts.mjs"));
for (const [role, list] of Object.entries(FONTS)) {
  new Set(list.map(f => f.key)).size === list.length || err(`шрифты ${role}: дубли ключей`);
  list.forEach(f => { if (!f.label) err(`шрифт ${role}/${f.key}: нет подписи`); if (!f.file && f.key !== "same" && !f.css) err(`шрифт ${role}/${f.key}: нет css`); if (f.google && !/^[A-Za-z0-9 ]+$/.test(f.google)) err(`шрифт ${f.key}: имя Google`); });
}
ok(`шрифты: ${Object.values(FONTS).map(l => l.length).join(" + ")}`);

// --- локализация
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? flat(v, p + k + ".") : [p + k]);
const keys = new Set(flat(lang));
const files = ["templates/actor-sheet.hbs", "templates/item-sheet.hbs", "templates/creation.hbs", "templates/picker.hbs", "module/creation.mjs", "module/creation-ctx.mjs",
  "module/config.mjs", "module/apply.mjs", "module/sheets/actor-sheet.mjs", "module/sheets/item-sheet.mjs", "module/documents/actor.mjs", "module/noir.mjs", "module/fonts.mjs"];
const used = new Set();
for (const role of ["Type", "Head", "Hand"]) { used.add(`NOIR.Settings.Font${role}`); used.add(`NOIR.Settings.Font${role}Hint`); used.add(`NOIR.Settings.Font${role}Custom`); }
for (const f of files) for (const m of read(f).matchAll(/["'`](NOIR\.[A-Za-z0-9.]+)["'`]/g)) used.add(m[1]);
for (const f of files.filter(f => f.endsWith(".hbs"))) for (const m of read(f).matchAll(/localize "([A-Za-z0-9.]+)"/g)) used.add(m[1]);
["traits", "abilities", "items", "biography", "notes"].forEach(t => used.add(`NOIR.Tab.${t}`));
TABS_.forEach(t => used.add(`NOIR.Creation.Tab.${t}`));
["class", "species", "species2", "background", "armor", "main", "sub"].forEach(k => used.add(`NOIR.Pick.${k}`));
["class", "species", "background", "stats"].forEach(k => used.add(`NOIR.Group.${k}`));
["trait", "ability", "racial", "origin", "talent"].forEach(k => used.add(`NOIR.Kind.${k}`));
[1, 2, 3].forEach(n => used.add(`NOIR.Tier.${n}`));
ABIL.forEach(a => { used.add(`NOIR.AbilityTip.${a}`); used.add(`NOIR.Ability.${a}`); });
for (const k of used) keys.has(k) || err(`нет ключа локализации ${k}`);
for (const t of types) keys.has(`TYPES.Item.${t}`) || err(`нет TYPES.Item.${t}`);
ok(`ключей локализации проверено: ${used.size}`);

// --- манифест и типы данных
const reg = read("module/noir.mjs");
for (const t of types) new RegExp(`\\b${t}: \\w+Data`).test(reg) || err(`тип ${t} не зарегистрирован в noir.mjs`);
fs.existsSync(path.join(root, system.esmodules[0])) || err("нет esmodule");
system.styles.forEach(s => fs.existsSync(path.join(root, s)) || err(`нет стиля ${s}`));
system.languages.forEach(l => fs.existsSync(path.join(root, l.path)) || err(`нет языка ${l.path}`));
const pkgv = json("package.json").version;
/^\d+\.\d+\.\d+$/.test(system.version) || err(`версия ${system.version}`);
system.version === pkgv || err(`версии не совпадают: system.json ${system.version}, package.json ${pkgv}`);
system.url === "https://github.com/Easytocraft/Noir-20" || err(`url: ${system.url}`);
system.manifest === `${system.url}/releases/latest/download/system.json` || err(`manifest: ${system.manifest}`);
system.download === `${system.url}/releases/download/v${system.version}/noir-d20.zip` || err(`download не соответствует версии ${system.version}: ${system.download}`);
read("CHANGELOG.md").includes(`## ${system.version}`) || err(`в CHANGELOG нет раздела ${system.version}`);
for (const f of ["fonts/RunttiSP-Bold.otf", "fonts/OFL-RunttiSP.txt"]) fs.existsSync(path.join(root, f)) || err(`нет файла ${f}`);
read("styles/noir.css").includes("RunttiSP-Bold.otf") || err("в стилях нет @font-face для Runtti SP");
ok("манифест");
if (errors) { console.error(`\nОшибок: ${errors}`); process.exit(1); }
console.log("\nВсё в порядке");
