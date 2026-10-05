// Тестовые контексты листов (повторяют то, что собирают _prepareContext в листах).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = f => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const { NOIR } = await import(path.join(root, "module/config.mjs"));
const lang = json("lang/ru.json").NOIR;
const classes = json("data/classes.json"), species = json("data/species.json"), items = json("data/items.json"), talents = json("data/talents.json");
const sign = n => (n > 0 ? `+${n}` : `${n}`);

export function actorContext(tab = "traits", { level = 3, npc = false, gm = true } = {}) {
  const vals = { str: -1, dex: 1, int: 2, con: 0, luck: 1, cha: 1 };
  const sys = {
    abilities: Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, { value: v }])),
    details: { level, xp: 3, vice: "Выпивка", drive: "Правда", scars: "• Хромота (3)", debts: "• Большой Лу (3)", enemies: "• Инспектор Хейл (3)" },
    wounds: { value: 2, max: 8 }, stress: { value: 3, max: 7 }, courage: 2, cash: 35, breakdown: false,
    evasion: 11, thresholds: { minor: 7, medium: 12 }, biography: "", notes: "", foe: { evasion: 13, minor: 6, medium: 12, wounds: 5 }
  };
  const tabs = ["traits", "abilities", "items", "biography", "notes"];
  const cls = classes[0];
  const itemDoc = (n, extra = {}) => ({ id: "id" + n.length, name: n, sort: 0, ...extra });
  const L = k => k.split(".").reduce((a, p) => a?.[p], lang);
  return {
    actor: { id: "a1b2c3d4e5", name: "Сэм Тёрнер", img: "" }, system: sys, isNpc: npc, level, caseNo: "A1B2C3",
    tabs: tabs.map((id, i) => ({ id, n: String(i + 1).padStart(2, "0"), label: lang.Tab[id], active: id === tab })), t: { [tab]: true },
    abilities: Object.entries(NOIR.abilities).map(([key]) => ({ key, label: lang.Ability[key], value: vals[key],
      tip: `<strong>${lang.Ability[key]}</strong><ul>${lang.AbilityTip[key].split("|").map(x => `<li>${x}</li>`).join("")}</ul>` })),
    ranges: { minor: "1–7", medium: "8–12", heavy: "13+" },
    wounds: Array.from({ length: 8 }, (_, i) => ({ i, on: i < 2 })), stressPips: Array.from({ length: 7 }, (_, i) => ({ i, on: i < 3 })),
    courageUp: true, isGM: gm, rings: Array(12).fill(0), showXp: gm, xpNeed: 7, xpMarks: Array.from({ length: 7 }, (_, i) => ({ i, on: i < 3 })), canAdvance: false,
    vices: NOIR.vices, drives: NOIR.drives,
    origin: [{ id: "o1", name: "Эльф", type: "Раса" }, { id: "o2", name: cls.name, type: "Класс" }, { id: "o3", name: "Следователь", type: "Подкласс" }, { id: "o4", name: "Бывший коп", type: "Происхождение" }],
    traits: [{ id: "t1", name: "Эльф", type: "Раса", desc: species[1].system.description }, { id: "t2", name: "Бывший коп", type: "Происхождение", desc: "<p>Вас вышвырнули из участка — или вы сами ушли.</p>" }],
    featureGroups: [
      { name: cls.name, list: cls.features.slice(0, 5).map(f => ({ id: "f" + f.name.length, name: f.name, level: f.level, cost: f.cost, desc: `<p>${f.desc}</p>` })) },
      { name: "Приём", list: talents.slice(0, 2).map(t => ({ id: "p" + t.name.length, name: t.name, level: 0, cost: "", desc: t.system.description })) }],
    weapons: items.filter(i => i.type === "weapon").slice(6, 9).map(i => itemDoc(i.name, { system: i.system })),
    armor: items.filter(i => i.type === "armor").slice(1, 3).map((i, n) => itemDoc(i.name, { system: { ...i.system, equipped: n === 0 } })),
    gear: items.filter(i => i.type === "gear").slice(0, 4).map(i => itemDoc(i.name, { system: i.system })),
    bio: "<p>Родился в порту, служил в участке Седьмого округа. Ушёл после дела Рэнсома.</p>",
    notes: "<p>— Спросить у Лу про склад на Док-стрит.<br>— Проверить алиби Хейла.<br>— Купить новую шляпу.</p>"
  };
}
