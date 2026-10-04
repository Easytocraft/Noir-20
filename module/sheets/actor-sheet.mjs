import { NOIR } from "../config.mjs";
import { applyOrigin, advance } from "../apply.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const L = k => game.i18n.localize(k);
const TABS = ["traits", "abilities", "items", "biography", "notes"];
const sign = n => (n > 0 ? `+${n}` : `${n}`);

export class NoirActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noir", "actor"],
    position: { width: 1000, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      tab: NoirActorSheet.tab, rollAbility: NoirActorSheet.rollAbility, rollAttack: NoirActorSheet.rollAttack,
      rollDamage: NoirActorSheet.rollDamage, reload: NoirActorSheet.reload, toggleEquip: NoirActorSheet.toggleEquip,
      editItem: NoirActorSheet.editItem, deleteItem: NoirActorSheet.deleteItem, createItem: NoirActorSheet.createItem,
      useItem: NoirActorSheet.useItem, setWound: NoirActorSheet.setWound, setStress: NoirActorSheet.setStress, spendCourage: NoirActorSheet.spendCourage,
      setMark: NoirActorSheet.setMark, takeDamage: NoirActorSheet.takeDamage, advance: NoirActorSheet.advance
    }
  };

  static PARTS = { sheet: { template: "systems/noir-d20/templates/actor-sheet.hbs", scrollable: [".tab-body"] } };

  _tab = "traits";

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const doc = this.document, sys = doc.system;
    const enrich = html => foundry.applications.ux.TextEditor.implementation.enrichHTML(html ?? "", { relativeTo: doc });
    const by = t => doc.items.filter(i => i.type === t).sort((a, b) => a.sort - b.sort);
    const lvl = sys.details.level, need = lvl === 0 ? 0 : lvl >= NOIR.maxLevel ? 0 : 4 + lvl;

    ctx.actor = doc; ctx.system = sys; ctx.isNpc = doc.type === "npc";
    ctx.level = lvl; ctx.caseNo = doc.id.slice(0, 6).toUpperCase();
    ctx.tabs = TABS.map(id => ({ id, label: L(`NOIR.Tab.${id}`), active: id === this._tab }));
    ctx.t = { [this._tab]: true };

    ctx.abilities = Object.entries(NOIR.abilities).map(([key, label]) => ({
      key, label: L(label), value: sys.abilities[key].value,
      tip: `<strong>${L(label)}</strong><ul>${L(`NOIR.AbilityTip.${key}`).split("|").map(x => `<li>${x}</li>`).join("")}</ul>`
    }));
    const th = sys.thresholds;
    ctx.ranges = { minor: `1–${th.minor}`, medium: `${th.minor + 1}–${th.medium}`, heavy: `${th.medium + 1}+` };
    ctx.wounds = Array.from({ length: sys.wounds.max }, (_, i) => ({ i, on: i < sys.wounds.value }));
    ctx.stressPips = Array.from({ length: sys.stress.max }, (_, i) => ({ i, on: i < sys.stress.value }));
    ctx.courageUp = sys.courage > 0; ctx.courageDown = sys.courage < 0;
    ctx.showXp = lvl >= 1 && lvl < NOIR.maxLevel; ctx.xpNeed = need;
    ctx.xpMarks = Array.from({ length: need }, (_, i) => ({ i, on: i < sys.details.xp }));
    ctx.canAdvance = lvl === 0 || (lvl < NOIR.maxLevel && sys.details.xp >= need);
    ctx.vices = NOIR.vices; ctx.drives = NOIR.drives;

    ctx.origin = ["species", "class", "subclass", "background"].flatMap(t => by(t).map(i => ({ id: i.id, name: i.name, type: L(`TYPES.Item.${t}`) })));
    ctx.traits = await Promise.all(["species", "background"].flatMap(t => by(t)).map(async i => ({ id: i.id, name: i.name, type: L(`TYPES.Item.${i.type}`), desc: await enrich(i.system.description) })));

    const groups = new Map();
    for (const f of by("feature").sort((a, b) => a.system.level - b.system.level)) {
      const g = f.system.source || L("NOIR.Other");
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push({ id: f.id, name: f.name, level: f.system.level, cost: f.system.cost, desc: await enrich(f.system.description) });
    }
    ctx.featureGroups = [...groups].map(([name, list]) => ({ name, list }));
    ctx.weapons = by("weapon"); ctx.armor = by("armor"); ctx.gear = by("gear");
    ctx.bio = await enrich(sys.biography); ctx.notes = await enrich(sys.notes);
    return ctx;
  }

  /** Раса, происхождение, класс и подкласс применяются автоматически. */
  async _onDropItem(event, item) {
    if (!this.document.isOwner) return;
    if (["species", "background", "class", "subclass"].includes(item.type) && item.parent !== this.document) return applyOrigin(this.document, item);
    return super._onDropItem(event, item);
  }

  static _item(sheet, target) { return sheet.document.items.get(target.closest("[data-item-id]")?.dataset.itemId); }
  static tab(event, target) { this._tab = target.dataset.tab; return this.render(); }
  static rollAbility(event, target) { return this.document.rollAbility(target.dataset.ability, event); }
  static rollAttack(event, target) { return this.document.rollAttack(NoirActorSheet._item(this, target), event); }
  static rollDamage(event, target) { return this.document.rollDamage(NoirActorSheet._item(this, target), event); }
  static reload(event, target) { const it = NoirActorSheet._item(this, target); return it.update({ "system.ammo.value": it.system.ammo.max }); }
  static toggleEquip(event, target) { const it = NoirActorSheet._item(this, target); return it.update({ "system.equipped": !it.system.equipped }); }
  static editItem(event, target) { return NoirActorSheet._item(this, target)?.sheet.render(true); }
  static deleteItem(event, target) { return NoirActorSheet._item(this, target)?.deleteDialog(); }
  static createItem(event, target) {
    const type = target.dataset.type;
    return this.document.createEmbeddedDocuments("Item", [{ name: L(`TYPES.Item.${type}`), type }]);
  }
  static async useItem(event, target) {
    const it = NoirActorSheet._item(this, target);
    if (it.type === "gear" && it.system.quantity > 0) await it.update({ "system.quantity": it.system.quantity - 1 });
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.document }), content: `<h3>${it.name}</h3>${it.system.description ?? ""}` });
  }
  static #toggle(path, current, i) { return { [path]: current === i + 1 ? i : i + 1 }; }
  static setWound(event, target) { return this.document.update(NoirActorSheet.#toggle("system.wounds.value", this.document.system.wounds.value, Number(target.dataset.index))); }
  static setStress(event, target) { return this.document.update(NoirActorSheet.#toggle("system.stress.value", this.document.system.stress.value, Number(target.dataset.index))); }
  static spendCourage() { return this.document.spendCourage(); }
  static setMark(event, target) { return this.document.update(NoirActorSheet.#toggle("system.details.xp", this.document.system.details.xp, Number(target.dataset.index))); }
  static async takeDamage() {
    const r = await foundry.applications.api.DialogV2.prompt({
      window: { title: L("NOIR.TakeDamage") },
      content: `<label>${L("NOIR.DamageAmount")} <input type="number" name="amount" value="1" min="1" autofocus></label>`,
      ok: { label: "OK", callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object }, rejectClose: false
    });
    if (r) return this.document.takeDamage(Number(r.amount));
  }
  static advance() { return advance(this.document); }
}
