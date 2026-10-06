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
const classes = json("data/classes.json"), subs = json("data/subclasses.json"), species = json("data/species.json");
const bgs = json("data/backgrounds.json"), items = json("data/items.json"), talents = json("data/talents.json");
const system = json("system.json"), lang = json("lang/ru.json");

ABIL.join() === "str,dex,int,con,luck,cha" || err(`порядок характеристик: ${ABIL}`);
const arr = JSON.stringify([...NOIR.statArray].sort());

// классы
for (const c of classes) {
  Object.keys(c.system.stats).sort().join() === [...ABIL].sort().join() || err(`${c.name}: набор характеристик`);
  JSON.stringify(Object.values(c.system.stats).sort()) === arr || err(`${c.name}: стартовые характеристики не совпадают с набором ${NOIR.statArray}`);
  const lv = c.features.map(f => f.level);
  for (const need of [1, 2, 3, 5, 6, 7, 9, 10]) lv.includes(need) || err(`${c.name}: нет умения ${need} уровня`);
  const names = [...c.features.map(f => f.name), ...subs.filter(s => s.class === c.name).flatMap(s => s.features.map(f => f.name)), ...talents.map(t => t.name)];
  names.filter((n, i) => names.indexOf(n) !== i).forEach(n => err(`${c.name}: дубль названия умения «${n}» (ломает автовыдачу)`));
}
const gearAll = new Map(items.map(i => [i.name, i]));
for (const c of classes) c.system.startItems.forEach(n => gearAll.has(n) || err(`${c.name}: нет стартового предмета «${n}»`));
[...NOIR.starter.choiceA, ...NOIR.starter.choiceB].forEach(n => gearAll.has(n) || err(`стартовый выбор: нет предмета «${n}»`));
if (!items.some(i => i.type === "armor" && i.system.kind === "armor" && i.system.price <= NOIR.starter.armorMax)) err("нет стартовой брони");
if (!items.some(i => i.type === "weapon" && i.system.price <= NOIR.starter.weaponMax)) err("нет стартового оружия");
ok(`классы: ${classes.length}`);
// подклассы
const per = {};
for (const s of subs) {
  classes.some(c => c.name === s.class) || err(`подкласс ${s.name}: нет класса ${s.class}`);
  per[s.class] = (per[s.class] ?? 0) + 1;
  JSON.stringify(s.features.map(f => f.level)) === "[3,6,9]" || err(`подкласс ${s.name}: уровни умений не 3/6/9`);
}
classes.forEach(c => per[c.name] === 2 || err(`${c.name}: подклассов ${per[c.name] ?? 0}, ожидалось 2`));
ok(`подклассы: ${subs.length}`);
// расы
const RACES = ["Человек", "Эльф", "Дворф", "Гоблин", "Крысолюд", "Котари", "Демон", "Голиаф", "Лилипут"];
JSON.stringify(species.map(s => s.name)) === JSON.stringify(RACES) || err(`расы: ${species.map(s => s.name)}`);
for (const s of species) Object.keys(s.system.bonuses).sort().join() === [...ABIL].sort().join() || err(`${s.name}: ключи бонусов`);
// происхождения
const gearNames = new Set(items.map(i => i.name));
for (const b of bgs) b.system.startItems.forEach(n => gearNames.has(n) || err(`${b.name}: нет предмета «${n}»`));
ok(`расы: ${species.length}, происхождения: ${bgs.length}`);
// предметы
const types = Object.keys(system.documentTypes.Item);
for (const i of items) {
  types.includes(i.type) || err(`предмет ${i.name}: тип ${i.type}`);
  if (i.type === "weapon" && !["str", "dex", "finesse"].includes(i.system.ability)) err(`${i.name}: ability`);
  if (i.type === "armor" && (i.system.protection == null || i.system.evasion == null)) err(`${i.name}: защита/уклонение`);
}
new Set(items.map(i => i.name)).size === items.length || err("дубли названий предметов");
ok(`предметы: ${items.length}, приёмы: ${talents.length}`);

// удалённые механики не должны всплывать в тексте
const banned = /(^|\s)(хит(ы|ов|а|ах)?|КД|Жар|навык\w*|спасбросок|спасброски|мастерств\w*|Нерв(а|у|ом|е)?)(\s|[.,;:)]|$)/i;
const texts = [...classes.flatMap(c => c.features.map(f => [c.name + "/" + f.name, f.desc])), ...subs.flatMap(c => c.features.map(f => [c.name + "/" + f.name, f.desc])),
  ...talents.map(t => [t.name, t.system.description]), ...species.map(s => [s.name, s.system.description]), ...bgs.map(b => [b.name, b.system.description]),
  ...items.map(i => [i.name, i.system.description ?? ""])];
for (const [n, t] of texts) if (banned.test(t)) err(`устаревшая механика в тексте «${n}»`);
ok("устаревшие механики в текстах не найдены");

// шрифты
const { FONTS } = await import(path.join(root, "module/fonts.mjs"));
for (const [role, list] of Object.entries(FONTS)) {
  new Set(list.map(f => f.key)).size === list.length || err(`шрифты ${role}: дубли ключей`);
  list.forEach(f => { if (!f.label) err(`шрифт ${role}/${f.key}: нет подписи`); if (!f.file && f.key !== "same" && !f.css) err(`шрифт ${role}/${f.key}: нет css`); if (f.google && !/^[A-Za-z0-9 ]+$/.test(f.google)) err(`шрифт ${f.key}: имя Google`); });
}
ok(`шрифты: ${Object.values(FONTS).map(l => l.length).join(" + ")}`);
// локализация
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? flat(v, p + k + ".") : [p + k]);
const keys = new Set(flat(lang));
const files = ["templates/actor-sheet.hbs", "templates/item-sheet.hbs", "templates/creation.hbs", "templates/picker.hbs", "module/creation.mjs", "module/creation-ctx.mjs", "module/config.mjs", "module/apply.mjs", "module/sheets/actor-sheet.mjs",
  "module/sheets/item-sheet.mjs", "module/documents/actor.mjs", "module/noir.mjs", "module/fonts.mjs"];
const used = new Set();
for (const role of ["Type", "Head", "Hand"]) { used.add(`NOIR.Settings.Font${role}`); used.add(`NOIR.Settings.Font${role}Hint`); used.add(`NOIR.Settings.Font${role}Custom`); }
for (const f of files) for (const m of read(f).matchAll(/["'`](NOIR\.[A-Za-z0-9.]+)["'`]/g)) used.add(m[1]);
for (const f of files.filter(f => f.endsWith(".hbs"))) for (const m of read(f).matchAll(/localize "([A-Za-z0-9.]+)"/g)) used.add(m[1]);
for (const m of read("lang/ru.json").matchAll(/"[A-Za-z0-9]+":/g)) { /* ключи читаются ниже */ }
["traits", "abilities", "items", "biography", "notes"].forEach(t => used.add(`NOIR.Tab.${t}`));
[1, 2, 3].forEach(n => used.add(`NOIR.Tier.${n}`));
TABS_.forEach(t => used.add(`NOIR.Creation.Tab.${t}`)); ["class", "species", "background", "armor", "main", "sub"].forEach(k => used.add(`NOIR.Pick.${k}`)); ["class", "species", "background", "stats"].forEach(k => used.add(`NOIR.Group.${k}`));
ABIL.forEach(a => { used.add(`NOIR.AbilityTip.${a}`); used.add(`NOIR.Ability.${a}`); });
for (const k of used) keys.has(k) || err(`нет ключа локализации ${k}`);
for (const t of types) keys.has(`TYPES.Item.${t}`) || err(`нет TYPES.Item.${t}`);
const raw = read("lang/ru.json").match(/"([A-Za-z0-9]+)":/g) ?? [];
ok(`ключей локализации проверено: ${used.size}`);

// манифест и типы данных
const reg = read("module/noir.mjs");
for (const t of types) new RegExp(`\\b${t}: \\w+Data`).test(reg) || err(`тип ${t} не зарегистрирован в noir.mjs`);
fs.existsSync(path.join(root, system.esmodules[0])) || err("нет esmodule");
system.styles.forEach(s => fs.existsSync(path.join(root, s)) || err(`нет стиля ${s}`));
system.languages.forEach(l => fs.existsSync(path.join(root, l.path)) || err(`нет языка ${l.path}`));
// ссылки на скачивание и версия
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
