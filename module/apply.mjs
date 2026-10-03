import { NOIR } from "./config.mjs";
const MOD = "noir-d20";
const L = k => game.i18n.localize(k);
const ABIL = Object.keys(NOIR.abilities);
const skillOpts = keys => Object.fromEntries(keys.map(k => [k, L(NOIR.skills[k].label)]));
const abilOpts = keys => Object.fromEntries(keys.map(k => [k, L(NOIR.abilities[k])]));
const sel = (name, opts) => `<select name="${name}">${Object.entries(opts).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>`;
const FormData = () => foundry.applications.ux.FormDataExtended;

/** Диалог выбора N пунктов из списка. */
async function choose(hint, options, count) {
  const keys = Object.keys(options);
  if (!count || !keys.length) return [];
  if (keys.length <= count) return keys;
  const boxes = keys.map(k => `<label style="display:block"><input type="checkbox" name="${k}"> ${options[k]}</label>`).join("");
  const res = await foundry.applications.api.DialogV2.prompt({
    window: { title: L("NOIR.PickTitle") },
    content: `<p>${hint} (${count})</p><div>${boxes}</div>`,
    ok: { label: "OK", callback: (ev, btn) => { const fd = new (FormData())(btn.form).object; return keys.filter(k => fd[k]); } },
    rejectClose: false
  });
  return (res ?? []).slice(0, count);
}

const emptyDelta = () => ({ abilities: {}, skills: {}, saves: [], hp: 0, nerve: 0, speedPrev: null, cash: 0 });
const clone = (doc, extra = {}) => { const o = doc.toObject(); delete o._id; return foundry.utils.mergeObject(o, extra); };

async function packDocs(name) {
  const pack = game.packs.get(`noir-d20.${name}`) ?? game.packs.get(`world.${name}`);
  if (!pack) { ui.notifications.warn(L("NOIR.NoPack")); return []; }
  return pack.getDocuments();
}

async function commit(actor, src, d, grants = []) {
  const s = actor.system, upd = {};
  for (const [k, n] of Object.entries(d.abilities)) upd[`system.abilities.${k}.value`] = s.abilities[k].value + n;
  for (const [k, prev] of Object.entries(d.skills)) upd[`system.skills.${k}.prof`] = Math.max(prev, 1);
  for (const k of d.saves) upd[`system.abilities.${k}.saveProf`] = true;
  if (d.hp) { upd["system.hp.max"] = s.hp.max + d.hp; upd["system.hp.value"] = s.hp.value + d.hp; }
  if (d.nerve) upd["system.nerveBonus"] = s.nerveBonus + d.nerve;
  if (d.speedSet != null) upd["system.speed"] = d.speedSet;
  if (d.cash) upd["system.cash"] = s.cash + d.cash;
  if (Object.keys(upd).length) await actor.update(upd, { noirSkip: true });
  const [created] = await actor.createEmbeddedDocuments("Item", [clone(src, { flags: { [MOD]: { delta: d } } })]);
  if (grants.length) await actor.createEmbeddedDocuments("Item", grants.map(g => clone(g, { flags: { [MOD]: { grantedBy: created.id } } })));
  ui.notifications.info(game.i18n.format("NOIR.Applied", { name: src.name, actor: actor.name }));
  return created;
}

/** Откатывает всё, что применили класс, раса, происхождение или подкласс. */
export async function revert(actor, item) {
  const d = item.getFlag(MOD, "delta");
  if (d) {
    const s = actor.system, upd = {};
    for (const [k, n] of Object.entries(d.abilities)) upd[`system.abilities.${k}.value`] = Math.max(1, s.abilities[k].value - n);
    for (const [k, prev] of Object.entries(d.skills)) upd[`system.skills.${k}.prof`] = prev;
    for (const k of d.saves) upd[`system.abilities.${k}.saveProf`] = false;
    if (d.hp) { upd["system.hp.max"] = Math.max(1, s.hp.max - d.hp); upd["system.hp.value"] = Math.min(s.hp.value, upd["system.hp.max"]); }
    if (d.nerve) upd["system.nerveBonus"] = s.nerveBonus - d.nerve;
    if (d.speedPrev != null) upd["system.speed"] = d.speedPrev;
    if (d.cash) upd["system.cash"] = Math.max(0, s.cash - d.cash);
    if (Object.keys(upd).length) await actor.update(upd, { noirSkip: true });
  }
  if (item.type === "class") {
    for (const sub of actor.items.filter(i => i.type === "subclass")) { await revert(actor, sub); await sub.delete({ noirReverted: true }); }
  }
  const ids = actor.items.filter(i => i.getFlag(MOD, "grantedBy") === item.id).map(i => i.id);
  if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
}

async function applySpecies(actor, src) {
  const s = src.system, d = emptyDelta();
  for (const k of ABIL) if (s.bonuses[k]) d.abilities[k] = s.bonuses[k];
  const from = s.freeFrom?.length ? s.freeFrom : ABIL;
  for (const k of await choose(L("NOIR.PickAsi"), abilOpts(from), s.freeAsi)) d.abilities[k] = (d.abilities[k] ?? 0) + 1;
  if (s.freeSkills) {
    const open = Object.keys(NOIR.skills).filter(k => actor.system.skills[k].prof < 1);
    for (const k of await choose(L("NOIR.PickSkills"), skillOpts(open), s.freeSkills)) d.skills[k] = actor.system.skills[k].prof;
  }
  d.nerve = s.nerveBonus; d.speedPrev = actor.system.speed; d.speedSet = s.speed;
  return commit(actor, src, d);
}

async function applyBackground(actor, src) {
  const s = actor.system, b = src.system, d = emptyDelta();
  for (const k of b.skillKeys) if (s.skills[k].prof < 1) d.skills[k] = s.skills[k].prof;
  d.cash = b.startCash;
  const gear = await packDocs("noir-gear");
  return commit(actor, src, d, b.startItems.map(n => gear.find(g => g.name === n)).filter(Boolean));
}

const faces = cls => Number(String(cls.system.hitDie).replace(/\D/g, "")) || 8;
const hpPerLevel = (cls, con) => Math.max(1, Math.floor(faces(cls) / 2) + 1 + con);

async function featuresFor(src, from, to) {
  return (await packDocs("noir-features")).filter(f => f.system.source === src.name && f.system.level > from && f.system.level <= to);
}

async function applyClass(actor, src) {
  const s = actor.system, c = src.system, d = emptyDelta(), lvl = s.details.level, con = s.abilities.con.mod;
  d.hp = Math.max(1, faces(src) + con) + (lvl - 1) * hpPerLevel(src, con);
  d.saves = c.saveKeys.filter(k => !s.abilities[k].saveProf);
  const open = c.skillKeys.filter(k => s.skills[k].prof < 1);
  for (const k of await choose(L("NOIR.PickSkills"), skillOpts(open), c.skillCount)) d.skills[k] = s.skills[k].prof;
  return commit(actor, src, d, await featuresFor(src, 0, lvl));
}

async function applySubclass(actor, src, lvl) {
  const cls = actor.items.find(i => i.type === "class");
  if (!cls || cls.name !== src.system.class) return ui.notifications.warn(L("NOIR.WrongClass"));
  lvl ??= actor.system.details.level;
  if (lvl < 3) return ui.notifications.warn(L("NOIR.TooEarly"));
  return commit(actor, src, emptyDelta(), await featuresFor(src, 0, lvl));
}

/** Применение перетащенных на лист расы, происхождения, класса или подкласса. */
export async function applyOrigin(actor, src, lvl) {
  if (src.type === "subclass") {
    const cls = actor.items.find(i => i.type === "class");
    if (!cls || cls.name !== src.system.class) return ui.notifications.warn(L("NOIR.WrongClass"));
    if ((lvl ?? actor.system.details.level) < 3) return ui.notifications.warn(L("NOIR.TooEarly"));
  }
  const old = actor.items.find(i => i.type === src.type);
  if (old) { await revert(actor, old); await old.delete({ noirReverted: true }); }
  const fn = { species: applySpecies, background: applyBackground, class: applyClass, subclass: applySubclass }[src.type];
  return fn(actor, src, lvl);
}

/** Повышение уровня: умения класса и подкласса, хиты. */
export async function levelUp(actor, oldLevel, newLevel) {
  const cls = actor.items.find(i => i.type === "class");
  if (!cls || newLevel <= oldLevel) return;
  const gain = (newLevel - oldLevel) * hpPerLevel(cls, actor.system.abilities.con.mod);
  const have = new Set(actor.items.filter(i => i.type === "feature").map(i => i.name));
  const docs = [];
  for (const src of actor.items.filter(i => ["class", "subclass"].includes(i.type))) {
    for (const f of await featuresFor(src, oldLevel, newLevel)) if (!have.has(f.name)) { have.add(f.name); docs.push(clone(f, { flags: { [MOD]: { grantedBy: src.id } } })); }
  }
  await actor.update({ "system.hp.max": actor.system.hp.max + gain, "system.hp.value": actor.system.hp.value + gain }, { noirSkip: true });
  const delta = cls.getFlag(MOD, "delta");
  if (delta) await cls.setFlag(MOD, "delta", { ...delta, hp: delta.hp + gain });
  if (docs.length) await actor.createEmbeddedDocuments("Item", docs);
  ui.notifications.info(game.i18n.format("NOIR.LevelUp", { actor: actor.name, level: newLevel, n: docs.length, hp: gain }));
}

/** Диалог повышения уровня: цена роста, подкласс, приём или характеристики. */
export async function advance(actor) {
  const s = actor.system, lvl = s.details.level, need = 4 + lvl, next = lvl + 1;
  if (lvl >= 10) return ui.notifications.info(L("NOIR.MaxLevel"));
  if (s.details.xp < need) return ui.notifications.warn(L("NOIR.NotEnoughXp"));
  const cls = actor.items.find(i => i.type === "class");
  const needPrice = [3, 5, 7, 9].includes(next);
  const needSub = next === 3 && cls && !actor.items.some(i => i.type === "subclass");
  const needPick = [4, 8].includes(next);
  const subs = needSub ? (await packDocs("noir-subclasses")).filter(d => d.system.class === cls.name) : [];
  const have = new Set(actor.items.map(i => i.name));
  const talents = needPick ? (await packDocs("noir-talents")).filter(d => !have.has(d.name)) : [];

  let html = `<p><b>Уровень ${next}</b></p>`;
  if (needPrice) html += `<fieldset><legend>Цена роста</legend>
    <label style="display:block"><input type="radio" name="price" value="scar" checked> Шрам: ${sel("scar", Object.fromEntries(Object.entries(NOIR.scars).map(([k, v]) => [k, v.label])))} <input type="text" name="scarText" placeholder="свой вариант"></label>
    <label style="display:block"><input type="radio" name="price" value="debt"> Долг: <input type="text" name="debtText" placeholder="кому вы должны"></label>
    <label style="display:block"><input type="radio" name="price" value="heat"> Жар +1</label></fieldset>`;
  if (subs.length) html += `<fieldset><legend>Подкласс</legend>${sel("sub", Object.fromEntries(subs.map(d => [d.id, d.name])))}</fieldset>`;
  if (needPick) html += `<fieldset><legend>Приём или характеристики</legend>
    <label style="display:block"><input type="radio" name="pick" value="talent" checked> Приём: ${sel("talent", Object.fromEntries(talents.map(d => [d.id, d.name])))}</label>
    <label style="display:block"><input type="radio" name="pick" value="asi"> +1 к двум характеристикам: ${sel("a1", abilOpts(ABIL))} ${sel("a2", abilOpts(ABIL))}</label></fieldset>`;

  let data = {};
  if (needPrice || subs.length || needPick) {
    data = await foundry.applications.api.DialogV2.prompt({
      window: { title: `Повышение уровня: ${actor.name}` }, content: html,
      ok: { label: `Уровень ${next}`, callback: (ev, btn) => new (FormData())(btn.form).object }, rejectClose: false
    });
    if (!data) return;
  }

  const upd = {}, notes = [], d = s.details;
  if (needPrice) {
    if (data.price === "heat") { upd["system.heat"] = Math.min(5, s.heat + 1); notes.push("Жар +1"); }
    else if (data.price === "debt") {
      const t = data.debtText?.trim() || "безымянный кредитор";
      upd["system.details.debts"] = (d.debts ? d.debts + "\n" : "") + `• ${t} (ур. ${next})`; notes.push(`Долг: ${t}`);
    } else {
      const sc = NOIR.scars[data.scar] ?? NOIR.scars.custom;
      const t = data.scarText?.trim() || sc.label;
      upd["system.details.scars"] = (d.scars ? d.scars + "\n" : "") + `• ${t} (ур. ${next})`; notes.push(`Шрам: ${t}`);
      if (sc.speed) upd["system.speed"] = Math.max(0, s.speed + sc.speed);
      if (sc.nerve) upd["system.nerveBonus"] = s.nerveBonus + sc.nerve;
    }
  }
  if (needPick && data.pick === "asi") {
    for (const k of [data.a1, data.a2]) {
      const path = `system.abilities.${k}.value`;
      upd[path] = Math.min(20, (upd[path] ?? s.abilities[k].value) + 1);
    }
    notes.push(`+1 к ${L(NOIR.abilities[data.a1])} и ${L(NOIR.abilities[data.a2])}`);
  }
  if (Object.keys(upd).length) await actor.update(upd, { noirSkip: true });
  if (needPick && data.pick === "talent") {
    const t = talents.find(x => x.id === data.talent);
    if (t) { await actor.createEmbeddedDocuments("Item", [clone(t)]); notes.push(`Приём: ${t.name}`); }
  }
  if (subs.length) {
    const sub = subs.find(x => x.id === data.sub);
    if (sub) { await applyOrigin(actor, sub, next); notes.push(`Подкласс: ${sub.name}`); }
  }
  await actor.update({ "system.details.xp": s.details.xp - need, "system.details.level": next });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<h3>Уровень ${next}</h3>${notes.length ? `<p>${notes.join("<br>")}</p>` : ""}`
  });
}
