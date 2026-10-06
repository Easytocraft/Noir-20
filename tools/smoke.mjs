// Дымовой тест без Foundry: загружает все модули на заглушках и проверяет формулы.  node tools/smoke.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = f => import(path.join(root, f));

class Field { constructor(o = {}) { this.o = o; } }
const fields = Object.fromEntries(["NumberField", "StringField", "BooleanField", "HTMLField", "ArrayField"].map(n => [n, class extends Field {}]));
fields.SchemaField = class extends Field { constructor(s, o) { super(o); this.schema = s; } };
const sheetBase = class { static DEFAULT_OPTIONS = {}; static PARTS = {}; };
const hooks = {};
globalThis.foundry = {
  data: { fields }, abstract: { TypeDataModel: class {} },
  applications: { api: { HandlebarsApplicationMixin: B => class extends B {}, ApplicationV2: class { constructor(o) { Object.assign(this, { options: o }); } } }, sheets: { ActorSheetV2: sheetBase, ItemSheetV2: sheetBase } },
  documents: { collections: { Actors: { registerSheet() {} }, Items: { registerSheet() {} } } },
  utils: { hasProperty: (o, p) => p.split(".").reduce((a, k) => a?.[k], o) !== undefined }
};
globalThis.Actor = class { prepareDerivedData() {} };
globalThis.Hooks = { once: (n, f) => (hooks[n] = f), on: (n, f) => (hooks[n] = f) };
globalThis.CONFIG = { Actor: {}, Item: {}, Combat: {} };
globalThis.game = { settings: { register() {} }, i18n: { localize: k => k, format: k => k } };
const rolls = [];
globalThis.Roll = class { constructor(f, d) { this.f = f; this.d = d; } async evaluate() { rolls.push(this.f); return { toMessage: async () => {} }; } };
globalThis.ChatMessage = { getSpeaker: () => ({}), create: async () => {} };

let fail = 0;
const eq = (a, b, m) => { if (a !== b) { fail++; console.error(`✗ ${m}: ${a} ≠ ${b}`); } else console.log("✓", m); };

await imp("module/noir.mjs");
hooks.init();
eq(Object.keys(CONFIG.Actor.dataModels).join(), "character,npc", "модели акторов зарегистрированы");
eq(Object.keys(CONFIG.Item.dataModels).length, 8, "модели предметов зарегистрированы");
for (const M of [...Object.values(CONFIG.Actor.dataModels), ...Object.values(CONFIG.Item.dataModels)]) M.defineSchema();
console.log("✓ схемы данных строятся");

const mk = (level, v = {}, items = [], type = "character") => {
  const a = Object.create(CONFIG.Actor.documentClass.prototype);
  const ab = k => ({ value: v[k] ?? 0 });
  a.type = type; a.items = items;
  a.system = {
    abilities: Object.fromEntries(["str", "dex", "int", "con", "luck", "cha"].map(k => [k, ab(k)])),
    details: { level }, wounds: { value: 0 }, stress: { value: v.stressNow ?? 0 }, courage: 0, evasionBonus: 0, woundsBonus: 0, stressBonus: 0,
    foe: { evasion: 13, minor: 6, medium: 12, wounds: 5 }
  };
  return a;
};
const armor = (kind, protection, evasion) => ({ type: "armor", system: { kind, protection, evasion, equipped: true } });
const D = a => (a.prepareDerivedData(), a.system);

let s = D(mk(0));
eq(s.evasion, 10, "уклонение 0 ур.");
eq(`${s.thresholds.minor}/${s.thresholds.medium}`, "4/9", "пороги урона без брони");
eq(s.wounds.max, 6, "раны 0 ур.");
eq(s.stress.max, 6, "запас Стресса 0 ур.");
eq(s.breakdown, false, "срыв: нет при пустом Стрессе");

s = D(mk(3, { con: 2, dex: 1, luck: 1 }, [armor("armor", 3, -1)]));
eq(s.evasion, 10, "уклонение: 10 + ЛОВ − штраф брони");
eq(`${s.thresholds.minor}/${s.thresholds.medium}`, "9/14", "пороги: 4 + ТЕЛ + защита");
eq(s.wounds.max, 9, "раны: 6 + ТЕЛ + уровень/3");
eq(s.stress.max, 7, "запас Стресса: 6 + Удача");

s = D(mk(1, { dex: 1 }, [armor("armor", 1, 0), armor("shield", 0, 1)]));
eq(s.evasion, 12, "щит даёт +1 к Уклонению");
s = D(mk(1, { con: -1 }));
eq(s.thresholds.minor, 4, "отрицательное Телосложение не снижает порог");
eq(s.wounds.max, 5, "отрицательное Телосложение снижает раны");
s = D(mk(1, {}, [], "npc"));
eq(`${s.evasion}/${s.thresholds.minor}/${s.thresholds.medium}/${s.wounds.max}`, "13/6/12/5", "НПС берёт значения из foe");

const W = CONFIG.Actor.documentClass.woundsFor, th = { minor: 5, medium: 10 };
eq([W(0, th), W(1, th), W(5, th), W(6, th), W(10, th), W(11, th)].join(), "0,1,1,2,2,3", "ступени урона → раны");

s = D(mk(1, { stressNow: 6 }));
eq(s.breakdown, true, "срыв: Стресс заполнен");
const roll = async (a, ev) => { rolls.length = 0; await a._d20(1, "x", ev); return rolls[0]; };
let b = mk(1); b.prepareDerivedData();
eq(await roll(b, {}), "1d20 + @mod", "бросок без модификаторов");
eq(await roll(b, { shiftKey: true }), "2d20kh + @mod", "Shift = преимущество");
b = mk(1, { stressNow: 6 }); b.prepareDerivedData();
eq(await roll(b, {}), "2d20kl + @mod", "срыв = помеха");
eq(await roll(b, { shiftKey: true }), "1d20 + @mod", "срыв и преимущество гасятся");

const a = mk(5, { str: -1, dex: 3 });
eq(a._weaponAbilityMod({ ability: "finesse" }), 3, "оружие: лучшая из СИЛ/ЛОВ");
eq(a._weaponAbilityMod({ ability: "str" }), -1, "оружие: сила");
eq(a.constructor._mode({ shiftKey: true }), 1, "Shift = преимущество");
eq(a.constructor._mode({ ctrlKey: true }), -1, "Ctrl = помеха");

const cc = await imp("module/creation-ctx.mjs");
eq(cc.statsValid({ str: 2, dex: 1, int: 1, con: 0, luck: 0, cha: -1 }), true, "набор характеристик принят");
eq(cc.statsValid({ str: 2, dex: 2, int: 1, con: 0, luck: 0, cha: -1 }), false, "повтор значения отклонён");
eq(cc.statsValid({ str: 2, dex: 1, int: 1, con: 0, luck: 0, cha: null }), false, "неполный набор отклонён");
const st = cc.emptyState();
eq(cc.isDone("class", st), false, "пустой выбор класса не завершён");
console.log(fail ? `\nПровалов: ${fail}` : "\nВсё в порядке");
process.exit(fail ? 1 : 0);
