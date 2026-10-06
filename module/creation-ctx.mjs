// Чистая логика мастера создания: состояние, проверки и построение контекста шаблона (без Foundry — тестируется отдельно).
import { NOIR } from "./config.mjs";

export const TABS = ["class", "species", "background", "stats", "persona", "gear"];
export const ABIL = Object.keys(NOIR.abilities);
const POOL = [...new Set(NOIR.statArray)].sort((a, b) => b - a);
const sign = n => (n > 0 ? `+${n}` : `${n}`);
const short = label => label.slice(0, 3).toUpperCase();
const firstParagraph = html => (String(html ?? "").match(/<p>([\s\S]*?)<\/p>/) ?? [])[1] ?? "";

export const emptyState = () => ({
  tab: "class", class: null, species: null, background: null,
  stats: Object.fromEntries(ABIL.map(k => [k, null])), picks: [],
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
    case "class": return !!st.class;
    case "species": return !!st.species && Array.from({ length: st.species.system.freeAsi }, (_, i) => st.picks[i]).every(Boolean);
    case "background": return !!st.background;
    case "stats": return statsValid(st.stats);
    case "persona": return !!st.vice.trim() && !!st.drive.trim();
    case "gear": return !!st.armor && !!st.main && !!st.choiceA && !!st.choiceB;
  }
  return false;
}

const slot = (doc, detail) => (doc ? { name: doc.name, detail } : null);

/** Всё, что нужно шаблону creation.hbs. docs = { features, gear } (остальное хранится в состоянии). */
export function buildContext(st, docs, L) {
  const done = Object.fromEntries(TABS.map(t => [t, isDone(t, st)]));
  const idx = TABS.indexOf(st.tab);
  const cls = st.class, sp = st.species, bg = st.background;
  const starters = starterSets(docs.gear);

  const bonus = Object.fromEntries(ABIL.map(k => [k, (sp?.system.bonuses?.[k] ?? 0) + (st.picks ?? []).filter(p => p === k && sp).length]));
  const rec = cls ? cls.system.stats : null;
  const assigned = ABIL.filter(k => st.stats[k] != null).length;

  const ctx = {
    tab: st.tab, t: { [st.tab]: true }, allDone: TABS.every(t => done[t]), isLast: idx === TABS.length - 1,
    canBack: idx > 0, canNext: done[st.tab],
    tabs: TABS.map((id, i) => ({ id, n: i + 1, label: L(`NOIR.Creation.Tab.${id}`), active: id === st.tab, done: done[id] })),
    cls: cls && { name: cls.name, focus: cls.system.focus, summary: firstParagraph(cls.system.description),
      features: docs.features.filter(f => f.system.source === cls.name && f.system.level === 1).map(f => ({ name: f.name, cost: f.system.cost, desc: f.system.description })) },
    species: sp && { name: sp.name, asi: sp.system.asi, size: sp.system.size, desc: sp.system.description,
      picks: Array.from({ length: sp.system.freeAsi }, (_, i) => ({ i, options: (sp.system.freeFrom?.length ? sp.system.freeFrom : ABIL).map(k => ({ key: k, label: L(NOIR.abilities[k]), selected: st.picks[i] === k })) })) },
    background: bg && { name: bg.name, desc: bg.system.description, cash: bg.system.startCash, items: bg.system.startItems },
    recommended: rec ? ABIL.map(k => ({ key: k, label: short(L(NOIR.abilities[k])), value: sign(rec[k]) })) : [],
    statsAssigned: assigned, statsOk: done.stats,
    cells: ABIL.map(k => ({
      key: k, label: L(NOIR.abilities[k]), bonus: bonus[k], bonusText: sign(bonus[k]), final: st.stats[k] == null ? "" : sign(Math.min(NOIR.statMax, st.stats[k] + bonus[k])),
      hasFinal: st.stats[k] != null,
      options: [{ v: "", label: "—", selected: st.stats[k] == null }, ...POOL.map(v => ({ v, label: sign(v), selected: st.stats[k] === v }))]
    })),
    vice: st.vice, drive: st.drive, past: st.past,
    vices: NOIR.vices.map(value => ({ value, on: st.vice === value })), drives: NOIR.drives.map(value => ({ value, on: st.drive === value })),
    armor: slot(st.armor, st.armor && `${L("NOIR.Protection")} ${st.armor.system.protection} · ${L("NOIR.Evasion")} ${st.armor.system.evasion}`),
    main: slot(st.main, st.main && `${st.main.system.damage} ${st.main.system.damageType}`),
    sub: slot(st.sub, st.sub && `${st.sub.system.damage} ${st.sub.system.damageType}`),
    cash: bg?.system.startCash ?? 0,
    kitItems: [...(bg?.system.startItems ?? []), ...(cls?.system.startItems ?? [])],
    choiceA: starters.choiceA.map(d => ({ id: d.id, name: d.name, on: st.choiceA?.id === d.id })),
    choiceB: starters.choiceB.map(d => ({ id: d.id, name: d.name, on: st.choiceB?.id === d.id })),
    hasClass: !!cls
  };
  return ctx;
}

const COLS = {
  class: ["NOIR.Focus"], species: ["NOIR.ASI", "NOIR.Size"], background: ["NOIR.StartCash", "NOIR.StartItems"],
  armor: ["NOIR.Protection", "NOIR.Evasion", "NOIR.ItemPrice"], weapon: ["NOIR.Damage", "NOIR.Range", "NOIR.ItemPrice"]
};
const CELLS = {
  class: d => [d.system.focus], species: d => [d.system.asi, d.system.size], background: d => [`$${d.system.startCash}`, d.system.startItems.join(", ")],
  armor: d => [d.system.protection, sign(d.system.evasion), `$${d.system.price}`], weapon: d => [d.system.damage, d.system.range || "—", `$${d.system.price}`]
};

/** Строки обозревателя для выбора документа указанного вида. */
export function buildPicker(kind, docs, L) {
  return {
    kind, cols: COLS[kind].map(L),
    rows: docs.map(d => ({ id: d.id, name: d.name, lname: d.name.toLowerCase(), glyph: kind, cols: CELLS[kind](d) }))
  };
}
