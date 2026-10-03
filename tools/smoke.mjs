// Дымовой тест без Foundry: загружает все модули на заглушках и проверяет формулы.  node tools/smoke.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = f => import(path.join(root, f));

class Field { constructor(o = {}) { this.o = o; } }
const fields = Object.fromEntries(["NumberField", "StringField", "BooleanField", "HTMLField", "ArrayField"].map(n => [n, class extends Field {}]));
fields.SchemaField = class extends Field { constructor(s, o) { super(o); this.schema = s; } };
class Base { constructor(o) { Object.assign(this, o); } }
const sheetBase = class { static DEFAULT_OPTIONS = {}; static PARTS = {}; };
const hooks = {};
globalThis.foundry = {
  data: { fields }, abstract: { TypeDataModel: class {} },
  applications: { api: { HandlebarsApplicationMixin: B => class extends B {} }, sheets: { ActorSheetV2: sheetBase, ItemSheetV2: sheetBase } },
  documents: { collections: { Actors: { registerSheet() {} }, Items: { registerSheet() {} } } },
  utils: { hasProperty: (o, p) => p.split(".").reduce((a, k) => a?.[k], o) !== undefined }
};
globalThis.Actor = class { prepareDerivedData() {} };
globalThis.Hooks = { once: (n, f) => (hooks[n] = f), on: (n, f) => (hooks[n] = f) };
globalThis.CONFIG = { Actor: {}, Item: {}, Combat: {} };
globalThis.game = { settings: { register() {} } };

let fail = 0;
const eq = (a, b, m) => { if (a !== b) { fail++; console.error(`✗ ${m}: ${a} ≠ ${b}`); } else console.log("✓", m); };

await imp("module/noir.mjs");
hooks.init();
eq(Object.keys(CONFIG.Actor.dataModels).join(), "character,npc", "модели акторов зарегистрированы");
eq(Object.keys(CONFIG.Item.dataModels).length, 8, "модели предметов зарегистрированы");
for (const M of [...Object.values(CONFIG.Actor.dataModels), ...Object.values(CONFIG.Item.dataModels)]) M.defineSchema();
console.log("✓ схемы данных строятся");

const mk = (level, dex, items = []) => {
  const a = Object.create(CONFIG.Actor.documentClass.prototype);
  const ab = v => ({ value: v, saveProf: false });
  a.type = "character"; a.items = items;
  a.system = {
    abilities: { str: ab(10), dex: ab(dex), con: ab(10), int: ab(10), wis: ab(14), cha: ab(10) },
    skills: Object.fromEntries(["acrobatics","athletics","deception","driving","insight","intimidation","investigation","law","mechanics","medicine","occult","perception","persuasion","sleight","stealth","streetwise"].map(k => [k, { prof: 0 }])),
    details: { level }, nerve: { value: 5 }, nerveBonus: 0
  };
  a.system.skills.perception.prof = 1; a.system.skills.stealth.prof = 2;
  return a;
};
const armor = (kind, ac, maxDex) => ({ type: "armor", system: { kind, ac, maxDex, equipped: true } });

let a = mk(1, 14); a.prepareDerivedData();
eq(a.system.prof, 2, "мастерство 1 ур.");
eq(a.system.ac, 12, "КД без брони (10 + ЛОВ)");
eq(a.system.nerve.max, 8 + 2 + 1, "максимум Нерва");
eq(a.system.skills.perception.total, 2 + 2, "навык с мастерством");
eq(a.system.skills.stealth.total, 2 + 4, "навык с экспертизой");

a = mk(5, 14, [armor("armor", 14, 2), armor("shield", 1, null)]); a.prepareDerivedData();
eq(a.system.prof, 3, "мастерство 5 ур.");
eq(a.system.ac, 14 + 2 + 1, "КД: броня с лимитом ЛОВ + щит");
a = mk(10, 18, [armor("armor", 16, 0)]); a.prepareDerivedData();
eq(a.system.prof, 4, "мастерство 10 ур.");
eq(a.system.ac, 16, "КД тяжёлой брони не зависит от ЛОВ");
eq(a.system.nerve.max, 8 + 2 + 10, "максимум Нерва 10 ур.");

const w = (ability) => ({ ability });
eq(a._weaponAbilityMod(w("finesse")), 4, "оружие: лучшая из СИЛ/ЛОВ");
eq(a._weaponAbilityMod(w("str")), 0, "оружие: сила");
eq(a.constructor._mode({ shiftKey: true }), 1, "Shift = преимущество");
eq(a.constructor._mode({ ctrlKey: true }), -1, "Ctrl = помеха");

console.log(fail ? `\nПровалов: ${fail}` : "\nВсё в порядке");
process.exit(fail ? 1 : 0);
