import { NOIR } from "./config.mjs";
import { CreationWizard } from "./creation.mjs";
const MOD = "noir-d20";
const L = k => game.i18n.localize(k);
const ABIL = Object.keys(NOIR.abilities);
const abilOpts = keys => Object.fromEntries(keys.map(k => [k, L(NOIR.abilities[k])]));
const sel = (name, opts, selected) => `<select name="${name}">${Object.entries(opts).map(([k, v]) => `<option value="${k}"${String(k) === String(selected) ? " selected" : ""}>${v}</option>`).join("")}</select>`;
const FD = () => foundry.applications.ux.FormDataExtended;
const ask = (title, content, label = "OK") => foundry.applications.api.DialogV2.prompt({
  window: { title }, content, ok: { label, callback: (ev, btn) => new (FD())(btn.form).object }, rejectClose: false
});
const clone = (doc, extra = {}) => { const o = doc.toObject(); delete o._id; return foundry.utils.mergeObject(o, extra); };
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function packDocs(name) {
  const pack = game.packs.get(`noir-d20.${name}`) ?? game.packs.get(`world.${name}`);
  if (!pack) { ui.notifications.warn(L("NOIR.NoPack")); return []; }
  return pack.getDocuments();
}

/** Создаёт встроенную копию src и выдаёт связанные с ней особенности (grants). Все выданные предметы помечены владельцем. */
async function commit(actor, src, d = {}, grants = []) {
  if (d.cash) await actor.update({ "system.cash": actor.system.cash + d.cash }, { noirSkip: true });
  const [created] = await actor.createEmbeddedDocuments("Item", [clone(src, { flags: { [MOD]: { delta: d } } })]);
  if (grants.length) await actor.createEmbeddedDocuments("Item", grants.map(g => clone(g, { flags: { [MOD]: { grantedBy: created.id } } })));
  return created;
}

/** Откатывает то, что дали класс, раса или происхождение: деньги и выданные ими особенности. */
export async function revert(actor, item) {
  const d = item.getFlag(MOD, "delta");
  if (d?.cash) await actor.update({ "system.cash": Math.max(0, actor.system.cash - d.cash) }, { noirSkip: true });
  const ids = actor.items.filter(i => i.getFlag(MOD, "grantedBy") === item.id).map(i => i.id);
  if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
}

async function clearOld(actor, type) {
  for (const old of actor.items.filter(i => i.type === type)) { await revert(actor, old); await old.delete({ noirReverted: true }); }
}

const featuresOf = (feats, kind, source) => feats.filter(f => f.system.kind === kind && f.system.source === source);

/** species — один документ расы или два (смешанная родословная); traits — выбранные особенности (если не заданы, берутся все особенности расы). */
export async function applySpecies(actor, species, traits) {
  const feats = traits ? [] : await packDocs("noir-features");
  await clearOld(actor, "species");
  for (const sp of species) {
    const own = traits ? traits.filter(t => t.system.source === sp.name) : featuresOf(feats, "racial", sp.name);
    await commit(actor, sp, {}, own);
  }
}

export async function applyBackground(actor, bg) {
  const [gear, feats] = await Promise.all([packDocs("noir-gear"), packDocs("noir-features")]);
  await clearOld(actor, "background");
  return commit(actor, bg, { cash: bg.system.startCash }, [...bg.system.startItems.map(n => gear.find(g => g.name === n)).filter(Boolean), ...featuresOf(feats, "origin", bg.name)]);
}

export async function applyClass(actor, cls, abilities) {
  const feats = await packDocs("noir-features");
  await clearOld(actor, "class");
  return commit(actor, cls, {}, [...featuresOf(feats, "trait", cls.name), ...(abilities ?? [])]);
}

/** Применение перетащенных на лист расы, происхождения или класса. */
export async function applyOrigin(actor, src) {
  if (src.type === "species") await applySpecies(actor, [src]);
  else if (src.type === "background") await applyBackground(actor, src);
  else await applyClass(actor, src, []);
  ui.notifications.info(game.i18n.format("NOIR.Applied", { name: src.name, actor: actor.name }));
}

/** Завершение мастера создания: применяет выбор, выдаёт снаряжение, ставит 1 уровень. */
export async function finishCreation(actor, p) {
  await actor.update(Object.fromEntries(ABIL.map(k => [`system.abilities.${k}.value`, p.stats[k]])), { noirSkip: true });
  await applySpecies(actor, p.species, p.traits);
  await applyBackground(actor, p.bg);
  await applyClass(actor, p.cls, p.abilities);

  const gear = await packDocs("noir-gear");
  const docs = [p.armor, p.main, p.sub, ...p.choices].filter(Boolean).map(d => clone(d, d.type === "armor" ? { system: { equipped: true } } : {}));
  const counts = new Map();
  for (const n of p.cls.system.startItems) counts.set(n, (counts.get(n) ?? 0) + 1);
  for (const [n, q] of counts) { const g = gear.find(x => x.name === n); if (g) docs.push(clone(g, { system: { quantity: q } })); }
  const merged = [];   // одинаковые расходники складываем в одну стопку
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
    content: `<h3>${L("NOIR.FileOpened")}</h3><p>${p.species.map(s => s.name).join(" / ")} · ${p.cls.name} · ${p.bg.name}</p>`
  });
}

async function create(actor) {
  const open = foundry.applications?.instances?.get?.(`noir-creation-${actor.id}`);
  if (open) return open.bringToFront();
  return new CreationWizard(actor).render(true);
}

/** Диалог повышения уровня: цена роста, новая способность класса, приём или характеристики. */
export async function advance(actor) {
  if (!game.user.isGM) return ui.notifications.warn(L("NOIR.GmOnly"));
  const s = actor.system, lvl = s.details.level;
  if (lvl === 0) return create(actor);
  if (lvl >= NOIR.maxLevel) return ui.notifications.info(L("NOIR.MaxLevel"));
  const need = 4 + lvl, next = lvl + 1;
  if (s.details.xp < need) return ui.notifications.warn(L("NOIR.NotEnoughXp"));
  const cls = actor.items.find(i => i.type === "class");
  const needPrice = [3, 5, 7, 9].includes(next);
  const needPick = [4, 8].includes(next);
  const owned = new Set(actor.items.map(i => i.name));
  const feats = await packDocs("noir-features");
  const pool = needPrice && cls ? featuresOf(feats, "ability", cls.name).filter(f => !owned.has(f.name)) : [];
  const talents = needPick ? (await packDocs("noir-talents")).filter(d => !owned.has(d.name)) : [];

  let html = `<p><b>${game.i18n.format("NOIR.LevelN", { n: next })}</b></p>`;
  if (pool.length) html += `<fieldset><legend>${L("NOIR.NewAbility")}</legend>${sel("ability", Object.fromEntries(pool.map(d => [d.id, d.name])))}</fieldset>`;
  if (needPrice) html += `<fieldset><legend>${L("NOIR.Price")}</legend>
    <label style="display:block"><input type="radio" name="price" value="scar" checked> ${L("NOIR.PriceScar")}: ${sel("scar", Object.fromEntries(Object.entries(NOIR.scars).map(([k, v]) => [k, v.label])))} <input type="text" name="scarText" placeholder="${L("NOIR.Custom")}"></label>
    <label style="display:block"><input type="radio" name="price" value="debt"> ${L("NOIR.PriceDebt")}: <input type="text" name="debtText" placeholder="${L("NOIR.DebtHint")}"></label>
    <label style="display:block"><input type="radio" name="price" value="enemy"> ${L("NOIR.PriceEnemy")}: <input type="text" name="enemyText" placeholder="${L("NOIR.EnemyHint")}"></label></fieldset>`;
  if (needPick) html += `<fieldset><legend>${L("NOIR.TalentOrStats")}</legend>
    <label style="display:block"><input type="radio" name="pick" value="talent" checked> ${L("NOIR.Talent")}: ${sel("talent", Object.fromEntries(talents.map(d => [d.id, d.name])))}</label>
    <label style="display:block"><input type="radio" name="pick" value="asi"> ${L("NOIR.PlusTwo")}: ${sel("a1", abilOpts(ABIL))} ${sel("a2", abilOpts(ABIL))}</label></fieldset>`;

  let data = {};
  if (needPrice || needPick) {
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
  if (pool.length) {
    const a = pool.find(x => x.id === data.ability);
    if (a) { await actor.createEmbeddedDocuments("Item", [clone(a, { flags: { [MOD]: { grantedBy: cls.id } } })]); notes.push(`${L("NOIR.NewAbility")}: ${a.name}`); }
  }
  await actor.update({ "system.details.xp": s.details.xp - need, "system.details.level": next });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<h3>${game.i18n.format("NOIR.LevelN", { n: next })}</h3>${notes.length ? `<p>${notes.join("<br>")}</p>` : ""}`
  });
}
