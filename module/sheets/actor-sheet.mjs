import { NOIR } from "../config.mjs";
import { applyOrigin, advance } from "../apply.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const L = k => game.i18n.localize(k);

export class NoirActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noir", "actor"],
    position: { width: 760, height: 820 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollAbility: NoirActorSheet.rollAbility, rollSave: NoirActorSheet.rollSave, rollSkill: NoirActorSheet.rollSkill,
      toggleSkill: NoirActorSheet.toggleSkill, rollAttack: NoirActorSheet.rollAttack, rollDamage: NoirActorSheet.rollDamage,
      reload: NoirActorSheet.reload, toggleEquip: NoirActorSheet.toggleEquip, editItem: NoirActorSheet.editItem,
      deleteItem: NoirActorSheet.deleteItem, markXp: NoirActorSheet.markXp, setMark: NoirActorSheet.setMark, indulge: NoirActorSheet.indulge, advance: NoirActorSheet.advance, createItem: NoirActorSheet.createItem, useItem: NoirActorSheet.useItem
    }
  };

  static PARTS = {
    sheet: { template: "systems/noir-d20/templates/actor-sheet.hbs", scrollable: [".sheet-body"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const doc = this.document, sys = doc.system;
    const by = t => doc.items.filter(i => i.type === t).sort((a, b) => a.sort - b.sort);
    ctx.actor = doc; ctx.system = sys; ctx.isNpc = doc.type === "npc";
    ctx.abilities = Object.entries(NOIR.abilities).map(([key, label]) => ({ key, label: L(label), ...sys.abilities[key] }));
    ctx.skills = Object.entries(NOIR.skills).map(([key, s]) => ({
      key, label: L(s.label), abil: L(`NOIR.AbilityShort.${s.ability}`), prof: sys.skills[key].prof, total: sys.skills[key].total
    }));
    const lvl = sys.details.level, need = lvl >= 10 ? 0 : 4 + lvl;
    ctx.xpNeed = need;
    ctx.xpMarks = Array.from({ length: need }, (_, i) => ({ i, on: i < sys.details.xp }));
    ctx.canAdvance = need > 0 && sys.details.xp >= need;
    ctx.vices = NOIR.vices; ctx.drives = NOIR.drives;
    ctx.weapons = by("weapon"); ctx.armor = by("armor"); ctx.gear = by("gear"); ctx.features = by("feature");
    ctx.origin = ["species", "background", "class", "subclass"].flatMap(t => by(t).map(i => ({ id: i.id, name: i.name, type: L(`TYPES.Item.${t}`) })));
    ctx.bio = await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.biography, { relativeTo: doc });
    return ctx;
  }

  /** Раса, происхождение и класс применяются автоматически. */
  async _onDropItem(event, item) {
    if (!this.document.isOwner) return;
    if (["species", "background", "class", "subclass"].includes(item.type) && item.parent !== this.document) return applyOrigin(this.document, item);
    return super._onDropItem(event, item);
  }

  static async markXp(event, target) {
    const sys = this.document.system, need = 4 + sys.details.level;
    if (sys.details.level >= 10) return;
    const src = target.dataset.source;
    await this.document.update({ "system.details.xp": Math.min(need, sys.details.xp + 1) });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content: game.i18n.format("NOIR.XpMarked", { actor: this.document.name, source: L(`NOIR.XpSource.${src}`) })
    });
  }
  static setMark(event, target) {
    const i = Number(target.dataset.index), xp = this.document.system.details.xp;
    return this.document.update({ "system.details.xp": xp === i + 1 ? i : i + 1 });
  }
  static async indulge() {
    const a = this.document, s = a.system, cost = 5 * s.details.level;
    if (s.cash < cost) return ui.notifications.warn(game.i18n.format("NOIR.NoCash", { cost }));
    await a.update({ "system.cash": s.cash - cost, "system.nerve.value": s.nerve.max });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: a }),
      content: `<p><b>${a.name}</b> поддаётся пороку${s.details.vice ? ` («${s.details.vice}»)` : ""}. Потрачено ${cost} баксов, Нерв восстановлен.</p><p><em>Мастер, есть ли осложнение?</em></p>`
    });
  }
  static advance() { return advance(this.document); }

  static _item(sheet, target) {
    return sheet.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
  }
  static rollAbility(event, target) { return this.document.rollAbility(target.dataset.ability, event); }
  static rollSave(event, target) { return this.document.rollSave(target.dataset.ability, event); }
  static rollSkill(event, target) { return this.document.rollSkill(target.dataset.skill, event); }
  static toggleSkill(event, target) {
    const k = target.dataset.skill;
    return this.document.update({ [`system.skills.${k}.prof`]: (this.document.system.skills[k].prof + 1) % 3 });
  }
  static rollAttack(event, target) { return this.document.rollAttack(NoirActorSheet._item(this, target), event); }
  static rollDamage(event, target) { return this.document.rollDamage(NoirActorSheet._item(this, target), event); }
  static reload(event, target) {
    const it = NoirActorSheet._item(this, target);
    return it.update({ "system.ammo.value": it.system.ammo.max });
  }
  static toggleEquip(event, target) {
    const it = NoirActorSheet._item(this, target);
    return it.update({ "system.equipped": !it.system.equipped });
  }
  static editItem(event, target) { return NoirActorSheet._item(this, target)?.sheet.render(true); }
  static deleteItem(event, target) { return NoirActorSheet._item(this, target)?.deleteDialog(); }
  static createItem(event, target) {
    const type = target.dataset.type;
    return this.document.createEmbeddedDocuments("Item", [{ name: L(`TYPES.Item.${type}`), type }]);
  }
  static async useItem(event, target) {
    const it = NoirActorSheet._item(this, target);
    if (it.type === "gear" && it.system.quantity > 0) await it.update({ "system.quantity": it.system.quantity - 1 });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content: `<h3>${it.name}</h3>${it.system.description ?? ""}`
    });
  }
}
