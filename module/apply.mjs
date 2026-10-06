import { NOIR } from "./config.mjs";
import { CreationWizard } from "./creation.mjs";
const MOD = "noir-d20";
const L = k => game.i18n.localize(k);
const ABIL = Object.keys(NOIR.abilities);
const abilOpts = keys => Object.fromEntries(keys.map(k => [k, L(NOIR.abilities[k])]));
const sel = (name, opts, selected) => `<select name="${name}">${Object.entries(opts).map(([k, v]) => `<option value="${k}"${String(k) === String(selected) ? " selected" : ""}>${v}</option>`).join("")}</select>`;
const FD = () => foundry.applications.ux.FormDataExtended;
const sign = n => (n > 0 ? `+${n}` : `${n}`);
const ask = (title, content, label = "OK") => foundry.applications.api.DialogV2.prompt({
  window: { title }, content, ok: { label, callback: (ev, btn) => new (FD())(btn.form).object }, rejectClose: false
});

const emptyDelta = () => ({ abilities: {}, stress: 0, evasion: 0, wounds: 0, cash: 0 });
const clone = (doc, extra = {}) => { const o = doc.toObject(); delete o._id; return foundry.utils.mergeObject(o, extra); };

export async function packDocs(name) {
  const pack = game.packs.get(`noir-d20.${name}`) ?? game.packs.get(`world.${name}`);
  if (!pack) { ui.notifications.warn(L("NOIR.NoPack")); return []; }
  return pack.getDocuments();
}

async function commit(actor, src, d, grants = []) {
  const s = actor.system, upd = {};
  for (const [k, n] of Object.entries(d.abilities)) upd[`system.abilities.${k}.value`] = Math.min(NOIR.statMax, s.abilities[k].value + n);
  if (d.stress) upd["system.stressBonus"] = s.stressBonus + d.stress;
  if (d.evasion) upd["system.evasionBonus"] = s.evasionBonus + d.evasion;
  if (d.wounds) upd["system.woundsBonus"] = s.woundsBonus + d.wounds;
  if (d.cash) upd["system.cash"] = s.cash + d.cash;
  if (Object.keys(upd).length) await actor.update(upd, { noirSkip: true });
  const [created] = await actor.createEmbeddedDocuments("Item", [clone(src, { flags: { [MOD]: { delta: d } } })]);
  if (grants.length) await actor.createEmbeddedDocuments("Item", grants.map(g => clone(g, { flags: { [MOD]: { grantedBy: created.id } } })));
  return created;
}

/** Откатывает всё, что применили раса, происхождение, класс или подкласс. */
export async function revert(actor, item) {
  const d = item.getFlag(MOD, "delta");
  if (d) {
    const s = actor.system, upd = {};
    for (const [k, n] of Object.entries(d.abilities ?? {})) upd[`system.abilities.${k}.value`] = s.abilities[k].value - n;
    if (d.stress) upd["system.stressBonus"] = s.stressBonus - d.stress;
    if (d.evasion) upd["system.evasionBonus"] = s.evasionBonus - d.evasion;
    if (d.wounds) upd["system.woundsBonus"] = s.woundsBonus - d.wounds;
    if (d.cash) upd["system.cash"] = Math.max(0, s.cash - d.cash);
    if (Object.keys(upd).length) await actor.update(upd, { noirSkip: true });
  }
  if (item.type === "class") {
    for (const sub of actor.items.filter(i => i.type === "subclass")) { await revert(actor, sub); await sub.delete({ noirReverted: true }); }
  }
  const ids = actor.items.filter(i => i.getFlag(MOD, "grantedBy") === item.id).map(i => i.id);
  if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
}

async function clearOld(actor, type) {
  const old = actor.items.find(i => i.type === type);
  if (old) { await revert(actor, old); await old.delete({ noirReverted: true }); }
}

/** Выбор N характеристик (для свободных бонусов расы). */
async function pickAbilities(hint, from, count) {
  if (!count) return [];
  const fields = Array.from({ length: count }, (_, i) => `<label style="display:block">${sel(`p${i}`, abilOpts(from))}</label>`).join("");
  const r = await ask(L("NOIR.PickTitle"), `<p>${hint}</p>${fields}`);
  return r ? Array.from({ length: count }, (_, i) => r[`p${i}`]) : [];
}

async function applySpecies(actor, src, picks) {
  const s = src.system, d = emptyDelta();
  for (const k of ABIL) if (s.bonuses[k]) d.abilities[k] = s.bonuses[k];
  const from = s.freeFrom?.length ? s.freeFrom : ABIL;
  for (const k of picks ?? await pickAbilities(L("NOIR.PickAsi"), from, s.freeAsi)) d.abilities[k] = (d.abilities[k] ?? 0) + 1;
  d.stress = s.stressBonus; d.evasion = s.evasion; d.wounds = s.wounds;
  return commit(actor, src, d);
}

async function applyBackground(actor, src) {
  const b = src.system, d = emptyDelta();
  d.cash = b.startCash;
  const gear = await packDocs("noir-gear");
  return commit(actor, src, d, b.startItems.map(n => gear.find(g => g.name === n)).filter(Boolean));
}

async function featuresFor(src, from, to) {
  return (await packDocs("noir-features")).filter(f => f.system.source === src.name && f.system.level > from && f.system.level <= to);
}

async function applyClass(actor, src) {
  return commit(actor, src, emptyDelta(), await featuresFor(src, 0, actor.system.details.level));
}

async function applySubclass(actor, src, lvl) {
  return commit(actor, src, emptyDelta(), await featuresFor(src, 0, lvl ?? actor.system.details.level));
}

/** Применение перетащенных на лист расы, происхождения, класса или подкласса. */
export async function applyOrigin(actor, src, lvl) {
  if (src.type === "subclass") {
    const cls = actor.items.find(i => i.type === "class");
    if (!cls || cls.name !== src.system.class) return ui.notifications.warn(L("NOIR.WrongClass"));
    if ((lvl ?? actor.system.details.level) < 3) return ui.notifications.warn(L("NOIR.TooEarly"));
  }
  await clearOld(actor, src.type);
  const created = await { species: () => applySpecies(actor, src), background: () => applyBackground(actor, src),
    class: () => applyClass(actor, src), subclass: () => applySubclass(actor, src, lvl) }[src.type]();
  ui.notifications.info(game.i18n.format("NOIR.Applied", { name: src.name, actor: actor.name }));
  return created;
}

/** Повышение уровня: умения класса и подкласса. */
export async function levelUp(actor, oldLevel, newLevel) {
  if (newLevel <= oldLevel) return;
  const have = new Set(actor.items.filter(i => i.type === "feature").map(i => i.name));
  const docs = [];
  for (const src of actor.items.filter(i => ["class", "subclass"].includes(i.type))) {
    for (const f of await featuresFor(src, oldLevel, newLevel)) if (!have.has(f.name)) { have.add(f.name); docs.push(clone(f, { flags: { [MOD]: { grantedBy: src.id } } })); }
  }
  if (docs.length) await actor.createEmbeddedDocuments("Item", docs);
  if (oldLevel > 0) ui.notifications.info(game.i18n.format("NOIR.LevelUp", { actor: actor.name, level: newLevel, n: docs.length }));
}

const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Завершение мастера создания: применяет выбор, выдаёт снаряжение, ставит 1 уровень. */
export async function finishCreation(actor, p) {
  const upd = Object.fromEntries(ABIL.map(k => [`system.abilities.${k}.value`, p.stats[k]]));
  await actor.update(upd, { noirSkip: true });
  for (const t of ["species", "background", "class"]) await clearOld(actor, t);
  await applySpecies(actor, p.species, p.picks);
  await applyBackground(actor, p.bg);
  await applyClass(actor, p.cls);

  const gear = await packDocs("noir-gear");
  const docs = [p.armor, p.main, p.sub, ...p.choices].filter(Boolean).map(d => clone(d, d.type === "armor" ? { system: { equipped: true } } : {}));
  const counts = new Map();
  for (const n of p.cls.system.startItems) counts.set(n, (counts.get(n) ?? 0) + 1);
  for (const [n, q] of counts) { const g = gear.find(x => x.name === n); if (g) docs.push(clone(g, { system: { quantity: q } })); }
  // одинаковые расходники складываем в одну стопку
  const merged = [];
  for (const d of docs) {
    const same = d.type === "gear" && merged.find(m => m.type === "gear" && m.name === d.name);
    if (same) same.system.quantity += d.system.quantity ?? 1; else merged.push(d);
  }
  await actor.createEmbeddedDocuments("Item", merged);
  await actor.update({
    "system.details.vice": p.vice, "system.details.drive": p.drive, "system.biography": p.past ? `<p>${esc(p.past)}</p>` : "",
    "system.details.level": 1, "system.details.xp": 0
  });
  await actor.update({ "system.stress.value": 0, "system.wounds.value": 0 }, { noirSkip: true });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<h3>${L("NOIR.FileOpened")}</h3><p>${p.species.name} · ${p.cls.name} · ${p.bg.name}</p>`
  });
}

async function create(actor) {
  const id = `noir-creation-${actor.id}`;
  const open = foundry.applications.instances.get(id);
  if (open) return open.bringToFront();
  return new CreationWizard(actor).render(true);
}

/** Диалог повышения уровня: цена роста, подкласс, приём или характеристики. */
export async function advance(actor) {
  if (!game.user.isGM) return ui.notifications.warn(L("NOIR.GmOnly"));
  const s = actor.system, lvl = s.details.level;
  if (lvl === 0) return create(actor);
  if (lvl >= NOIR.maxLevel) return ui.notifications.info(L("NOIR.MaxLevel"));
  const need = 4 + lvl, next = lvl + 1;
  if (s.details.xp < need) return ui.notifications.warn(L("NOIR.NotEnoughXp"));
  const cls = actor.items.find(i => i.type === "class");
  const needPrice = [3, 5, 7, 9].includes(next);
  const needSub = next === 3 && cls && !actor.items.some(i => i.type === "subclass");
  const needPick = [4, 8].includes(next);
  const subs = needSub ? (await packDocs("noir-subclasses")).filter(d => d.system.class === cls.name) : [];
  const have = new Set(actor.items.map(i => i.name));
  const talents = needPick ? (await packDocs("noir-talents")).filter(d => !have.has(d.name)) : [];

  let html = `<p><b>${game.i18n.format("NOIR.LevelN", { n: next })}</b></p>`;
  if (needPrice) html += `<fieldset><legend>${L("NOIR.Price")}</legend>
    <label style="display:block"><input type="radio" name="price" value="scar" checked> ${L("NOIR.PriceScar")}: ${sel("scar", Object.fromEntries(Object.entries(NOIR.scars).map(([k, v]) => [k, v.label])))} <input type="text" name="scarText" placeholder="${L("NOIR.Custom")}"></label>
    <label style="display:block"><input type="radio" name="price" value="debt"> ${L("NOIR.PriceDebt")}: <input type="text" name="debtText" placeholder="${L("NOIR.DebtHint")}"></label>
    <label style="display:block"><input type="radio" name="price" value="enemy"> ${L("NOIR.PriceEnemy")}: <input type="text" name="enemyText" placeholder="${L("NOIR.EnemyHint")}"></label></fieldset>`;
  if (subs.length) html += `<fieldset><legend>${L("TYPES.Item.subclass")}</legend>${sel("sub", Object.fromEntries(subs.map(d => [d.id, d.name])))}</fieldset>`;
  if (needPick) html += `<fieldset><legend>${L("NOIR.TalentOrStats")}</legend>
    <label style="display:block"><input type="radio" name="pick" value="talent" checked> ${L("NOIR.Talent")}: ${sel("talent", Object.fromEntries(talents.map(d => [d.id, d.name])))}</label>
    <label style="display:block"><input type="radio" name="pick" value="asi"> ${L("NOIR.PlusTwo")}: ${sel("a1", abilOpts(ABIL))} ${sel("a2", abilOpts(ABIL))}</label></fieldset>`;

  let data = {};
  if (needPrice || subs.length || needPick) {
    data = await ask(`${L("NOIR.Advance")}: ${actor.name}`, html, game.i18n.format("NOIR.LevelN", { n: next }));
    if (!data) return;
  }

  const upd = {}, notes = [], d = s.details;
  const addLine = (path, old, text) => { upd[path] = (old ? old + "\n" : "") + `• ${text} (${next})`; };
  if (needPrice) {
    if (data.price === "debt") { const t = data.debtText?.trim() || L("NOIR.Unnamed"); addLine("system.details.debts", d.debts, t); notes.push(`${L("NOIR.PriceDebt")}: ${t}`); }
    else if (data.price === "enemy") { const t = data.enemyText?.trim() || L("NOIR.Unnamed"); addLine("system.details.enemies", d.enemies, t); notes.push(`${L("NOIR.PriceEnemy")}: ${t}`); }
    else {
      const sc = NOIR.scars[data.scar] ?? NOIR.scars.custom, t = data.scarText?.trim() || sc.label;
      addLine("system.details.scars", d.scars, t); notes.push(`${L("NOIR.PriceScar")}: ${t}`);
      if (sc.stress) upd["system.stressBonus"] = s.stressBonus + sc.stress;
    }
  }
  if (needPick && data.pick === "asi") {
    for (const k of [data.a1, data.a2]) {
      const path = `system.abilities.${k}.value`;
      upd[path] = Math.min(NOIR.statMax, (upd[path] ?? s.abilities[k].value) + 1);
    }
    notes.push(`+1 ${L(NOIR.abilities[data.a1])}, +1 ${L(NOIR.abilities[data.a2])}`);
  }
  if (Object.keys(upd).length) await actor.update(upd, { noirSkip: true });
  if (needPick && data.pick === "talent") {
    const t = talents.find(x => x.id === data.talent);
    if (t) { await actor.createEmbeddedDocuments("Item", [clone(t)]); notes.push(`${L("NOIR.Talent")}: ${t.name}`); }
  }
  if (subs.length) {
    const sub = subs.find(x => x.id === data.sub);
    if (sub) { await applyOrigin(actor, sub, next); notes.push(`${L("TYPES.Item.subclass")}: ${sub.name}`); }
  }
  await actor.update({ "system.details.xp": s.details.xp - need, "system.details.level": next });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<h3>${game.i18n.format("NOIR.LevelN", { n: next })}</h3>${notes.length ? `<p>${notes.join("<br>")}</p>` : ""}`
  });
}
