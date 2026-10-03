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

const ABIL = Object.keys(NOIR.abilities), SK = Object.keys(NOIR.skills);
const classes = json("data/classes.json"), subs = json("data/subclasses.json"), species = json("data/species.json");
const bgs = json("data/backgrounds.json"), items = json("data/items.json"), talents = json("data/talents.json");
const system = json("system.json"), lang = json("lang/ru.json");

// классы
for (const c of classes) {
  c.system.saveKeys.forEach(k => ABIL.includes(k) || err(`${c.name}: неверный спасбросок ${k}`));
  c.system.skillKeys.forEach(k => SK.includes(k) || err(`${c.name}: неверный навык ${k}`));
  if (c.system.skillCount > c.system.skillKeys.length) err(`${c.name}: выбор навыков больше списка`);
  const lv = c.features.map(f => f.level);
  for (const need of [1, 2, 3, 5, 6, 7, 9, 10]) lv.includes(need) || err(`${c.name}: нет умения ${need} уровня`);
  const names = [...c.features.map(f => f.name), ...subs.filter(s => s.class === c.name).flatMap(s => s.features.map(f => f.name)), ...talents.map(t => t.name)];
  names.filter((n, i) => names.indexOf(n) !== i).forEach(n => err(`${c.name}: дубль названия умения «${n}» (ломает автовыдачу)`));
}
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
// расы и происхождения
for (const s of species) {
  Object.keys(s.system.bonuses).forEach(k => ABIL.includes(k) || err(`${s.name}: бонус ${k}`));
  s.system.freeFrom.forEach(k => ABIL.includes(k) || err(`${s.name}: freeFrom ${k}`));
}
const gearNames = new Set(items.map(i => i.name));
for (const b of bgs) {
  b.system.skillKeys.forEach(k => SK.includes(k) || err(`${b.name}: навык ${k}`));
  b.system.startItems.forEach(n => gearNames.has(n) || err(`${b.name}: нет предмета «${n}»`));
}
ok(`расы: ${species.length}, происхождения: ${bgs.length}`);
// предметы
const types = Object.keys(system.documentTypes.Item);
for (const i of items) {
  types.includes(i.type) || err(`предмет ${i.name}: тип ${i.type}`);
  if (i.type === "weapon" && !["str", "dex", "finesse"].includes(i.system.ability)) err(`${i.name}: ability`);
}
new Set(items.map(i => i.name)).size === items.length || err("дубли названий предметов");
ok(`предметы: ${items.length}, приёмы: ${talents.length}`);

// локализация
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? flat(v, p + k + ".") : [p + k]);
const keys = new Set(flat(lang));
const files = ["templates/actor-sheet.hbs", "templates/item-sheet.hbs", "module/config.mjs", "module/apply.mjs", "module/sheets/actor-sheet.mjs",
  "module/sheets/item-sheet.mjs", "module/documents/actor.mjs", "module/noir.mjs"];
const used = new Set();
for (const f of files) for (const m of read(f).matchAll(/["'`](NOIR\.[A-Za-z.]+)["'`]/g)) used.add(m[1]);
for (const f of files.slice(0, 2)) for (const m of read(f).matchAll(/localize "([A-Za-z.]+)"/g)) used.add(m[1]);
for (const a of ABIL) used.add(`NOIR.AbilityShort.${a}`);
for (const k of used) keys.has(k) || err(`нет ключа локализации ${k}`);
for (const t of types) keys.has(`TYPES.Item.${t}`) || err(`нет TYPES.Item.${t}`);
ok(`ключей локализации проверено: ${used.size}`);

// манифест и типы данных
const reg = read("module/noir.mjs");
for (const t of types) new RegExp(`\\b${t}: \\w+Data`).test(reg) || err(`тип ${t} не зарегистрирован в noir.mjs`);
fs.existsSync(path.join(root, system.esmodules[0])) || err("нет esmodule");
system.styles.forEach(s => fs.existsSync(path.join(root, s)) || err(`нет стиля ${s}`));
system.languages.forEach(l => fs.existsSync(path.join(root, l.path)) || err(`нет языка ${l.path}`));
ok("манифест");
if (errors) { console.error(`\nОшибок: ${errors}`); process.exit(1); }
console.log("\nВсё в порядке");
