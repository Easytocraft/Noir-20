// Чистая логика мастера создания: состояние, проверки и построение контекста шаблона (без Foundry — тестируется отдельно).
import { NOIR } from "./config.mjs";

export const TABS = ["class", "species", "background", "stats", "persona", "gear"];
export const ABIL = Object.keys(NOIR.abilities);
const POOL = [...new Set(NOIR.statArray)].sort((a, b) => b - a);
const sign = n => (n > 0 ? `+${n}` : `${n}`);
const short = label => label.slice(0, 3).toUpperCase();
const firstParagraph = html => (String(html ?? "").match(/<p>([\s\S]*?)<\/p>/) ?? [])[1] ?? "";
export const START_ABILITIES = 2;

export const emptyState = () => ({
  tab: "class", class: null, abilities: [], species: null, species2: null, mixed: false, traitA: null, traitB: null, background: null,
  stats: Object.fromEntries(ABIL.map(k => [k, null])),
  vice: "", drive: "", past: "", armor: null, main: null, sub: null, choiceA: null, choiceB: null
});

export function statsValid(stats) {
  const v = ABIL.map(k => stats[k]);
  if (v.some(x => x == null || Number.isNaN(x))) return false;
  return JSON.stringify([...v].sort()) === JSON.stringify([...NOIR.statArray].sort());
}

export function starterSets(gear) {
  const byName = list => list.map(n => gear.find(g => g.name === n)).filter(Boolean);
  return {
    armor: gear.filter(g => g.type === "armor" && g.system.kind === "armor" && g.system.price <= NOIR.starter.armorMax),
    weapon: gear.filter(g => g.type === "weapon" && g.system.price <= NOIR.starter.weaponMax),
    choiceA: byName(NOIR.starter.choiceA), choiceB: byName(NOIR.starter.choiceB)
  };
}

export function isDone(tab, st) {
  switch (tab) {
    case "class": return !!st.class && st.abilities.length === START_ABILITIES;
    case "species":
      if (!st.mixed) return !!st.species;
      return !!(st.species && st.species2 && st.species.id !== st.species2.id && st.traitA && st.traitB
        && st.traitA.system.source === st.species.name && st.traitB.system.source === st.species2.name);
    case "background": return !!st.background;
    case "stats": return statsValid(st.stats);
    case "persona": return !!st.vice.trim() && !!st.drive.trim();
    case "gear": return !!st.armor && !!st.main && !!st.choiceA && !!st.choiceB;
  }
  return false;
}

const slot = (doc, detail) => (doc ? { name: doc.name, detail, img: doc.img } : null);
const featOf = (feats, kind, source) => feats.filter(f => f.system.kind === kind && f.system.source === source);

/** Подпись модификаторов особенности: «Раны +1, Уклонение −1». */
export function modsText(m, L) {
  const names = { wounds: "NOIR.Wounds", evasion: "NOIR.Evasion", stress: "NOIR.Stress", threshold: "NOIR.Thresholds" };
  return Object.entries(names).filter(([k]) => m?.[k]).map(([k, key]) => `${L(key)} ${sign(m[k])}`).join(", ");
}

const feat = (f, L, on) => ({ id: f.id, name: f.name, img: f.img, cost: f.system.cost, desc: f.system.description, modsText: modsText(f.system.mods, L), on });

/** Всё, что нужно шаблону creation.hbs. docs = { features, gear }. */
export function buildContext(st, docs, L) {
  const done = Object.fromEntries(TABS.map(t => [t, isDone(t, st)]));
  const idx = TABS.indexOf(st.tab);
  const cls = st.class, sp = st.species, sp2 = st.species2, bg = st.background;
  const starters = starterSets(docs.gear);
  const rec = cls ? cls.system.stats : null;
  const assigned = ABIL.filter(k => st.stats[k] != null).length;
  const chosen = new Set(st.abilities.map(a => a.id));
  const spTraits = sp ? featOf(docs.features, "racial", sp.name) : [];
  const sp2Traits = sp2 ? featOf(docs.features, "racial", sp2.name) : [];

  return {
    tab: st.tab, t: { [st.tab]: true }, allDone: TABS.every(t => done[t]), isLast: idx === TABS.length - 1,
    canBack: idx > 0, canNext: done[st.tab],
    tabs: TABS.map((id, i) => ({ id, n: i + 1, label: L(`NOIR.Creation.Tab.${id}`), active: id === st.tab, done: done[id] })),
    cls: cls && {
      name: cls.name, img: cls.img, focus: cls.system.focus, summary: firstParagraph(cls.system.description),
      evasion: 10 + cls.system.mods.evasion, wounds: 6 + cls.system.mods.wounds, stress: sign(cls.system.mods.stress),
      trait: featOf(docs.features, "trait", cls.name).map(f => feat(f, L, true))
    },
    abilities: cls ? featOf(docs.features, "ability", cls.name).map(f => feat(f, L, chosen.has(f.id))) : [],
    abilitiesLeft: START_ABILITIES - st.abilities.length, abilitiesNeeded: START_ABILITIES,
    mixed: st.mixed,
    species: sp && { name: sp.name, img: sp.img, size: sp.system.size, desc: sp.system.description,
      traits: spTraits.map(f => feat(f, L, st.mixed ? st.traitA?.id === f.id : true)) },
    species2: sp2 && { name: sp2.name, img: sp2.img, size: sp2.system.size, desc: sp2.system.description,
      traits: sp2Traits.map(f => feat(f, L, st.traitB?.id === f.id)) },
    background: bg && { name: bg.name, img: bg.img, desc: bg.system.description, cash: bg.system.startCash, items: bg.system.startItems,
      trait: featOf(docs.features, "origin", bg.name).map(f => feat(f, L, true)) },
    recommended: rec ? ABIL.map(k => ({ key: k, label: short(L(NOIR.abilities[k])), value: sign(rec[k]) })) : [],
    statsAssigned: assigned, statsOk: done.stats,
    cells: ABIL.map(k => ({
      key: k, label: L(NOIR.abilities[k]),
      options: [{ v: "", label: "—", selected: st.stats[k] == null }, ...POOL.map(v => ({ v, label: sign(v), selected: st.stats[k] === v }))]
    })),
    vice: st.vice, drive: st.drive, past: st.past,
    vices: NOIR.vices.map(value => ({ value, on: st.vice === value })), drives: NOIR.drives.map(value => ({ value, on: st.drive === value })),
    armor: slot(st.armor, st.armor && `${L("NOIR.Protection")} ${st.armor.system.protection} · ${L("NOIR.Evasion")} ${st.armor.system.evasion}`),
    main: slot(st.main, st.main && `${st.main.system.damage} ${st.main.system.damageType}`),
    sub: slot(st.sub, st.sub && `${st.sub.system.damage} ${st.sub.system.damageType}`),
    cash: bg?.system.startCash ?? 0,
    kitItems: [...(bg?.system.startItems ?? []), ...(cls?.system.startItems ?? [])],
    choiceA: starters.choiceA.map(d => ({ id: d.id, name: d.name, img: d.img, on: st.choiceA?.id === d.id })),
    choiceB: starters.choiceB.map(d => ({ id: d.id, name: d.name, img: d.img, on: st.choiceB?.id === d.id })),
    hasClass: !!cls
  };
}

const COLS = {
  class: ["NOIR.Evasion", "NOIR.Wounds", "NOIR.Focus"], species: ["NOIR.Size", "NOIR.Features"], background: ["NOIR.StartCash", "NOIR.StartItems"],
  armor: ["NOIR.Protection", "NOIR.Evasion", "NOIR.ItemPrice"], weapon: ["NOIR.Damage", "NOIR.Range", "NOIR.ItemPrice"]
};
const CELLS = (features) => ({
  class: d => [10 + d.system.mods.evasion, 6 + d.system.mods.wounds, d.system.focus],
  species: d => [d.system.size, featOf(features, "racial", d.name).map(f => f.name).join(", ")],
  background: d => [`$${d.system.startCash}`, d.system.startItems.join(", ")],
  armor: d => [d.system.protection, sign(d.system.evasion), `$${d.system.price}`], weapon: d => [d.system.damage, d.system.range || "—", `$${d.system.price}`]
});

/** Строки обозревателя для выбора документа указанного вида. */
export function buildPicker(kind, docs, L, features = []) {
  const cells = CELLS(features)[kind];
  return {
    kind, cols: COLS[kind].map(L), n: COLS[kind].length,
    rows: docs.map(d => ({ id: d.id, name: d.name, img: d.img, lname: d.name.toLowerCase(), glyph: kind, cols: cells(d) }))
  };
}
