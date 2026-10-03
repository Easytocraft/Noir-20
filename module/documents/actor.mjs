import { NOIR } from "../config.mjs";

export class NoirActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    const s = this.system;
    if (!s.abilities) return;
    s.prof = 2 + Math.floor((s.details.level - 1) / 4);
    for (const a of Object.values(s.abilities)) {
      a.mod = Math.floor((a.value - 10) / 2);
      a.save = a.mod + (a.saveProf ? s.prof : 0);
    }
    for (const [k, sk] of Object.entries(s.skills)) {
      sk.total = s.abilities[NOIR.skills[k].ability].mod + Math.floor(sk.prof * s.prof);
    }
    s.nerve.max = Math.max(1, 8 + s.abilities.wis.mod + s.details.level + s.nerveBonus);
    s.passive = 10 + s.skills.perception.total;

    const dex = s.abilities.dex.mod;
    if (this.type === "npc") s.ac = s.acFlat;
    else {
      const worn = this.items.find(i => i.type === "armor" && i.system.kind === "armor" && i.system.equipped);
      let ac = worn ? worn.system.ac + Math.min(dex, worn.system.maxDex ?? 99) : 10 + dex;
      for (const sh of this.items.filter(i => i.type === "armor" && i.system.kind === "shield" && i.system.equipped)) ac += sh.system.ac;
      s.ac = ac;
    }
  }

  static _mode(event) {
    if (event?.shiftKey) return 1;
    if (event?.ctrlKey || event?.metaKey) return -1;
    return 0;
  }

  async _d20(mod, flavor, event) {
    const m = NoirActor._mode(event);
    const die = m > 0 ? "2d20kh" : m < 0 ? "2d20kl" : "1d20";
    const roll = await new Roll(`${die} + @mod`, { mod }).evaluate();
    return roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor });
  }

  rollAbility(key, event) {
    const L = game.i18n.localize(NOIR.abilities[key]);
    return this._d20(this.system.abilities[key].mod, `${L}: ${game.i18n.localize("NOIR.Check")}`, event);
  }
  rollSave(key, event) {
    const L = game.i18n.localize(NOIR.abilities[key]);
    return this._d20(this.system.abilities[key].save, `${L}: ${game.i18n.localize("NOIR.Save")}`, event);
  }
  rollSkill(key, event) {
    return this._d20(this.system.skills[key].total, game.i18n.localize(NOIR.skills[key].label), event);
  }

  _weaponAbilityMod(w) {
    const a = this.system.abilities;
    return w.ability === "finesse" ? Math.max(a.str.mod, a.dex.mod) : a[w.ability].mod;
  }

  async rollAttack(item, event) {
    const w = item.system;
    if (w.ammo.max > 0) {
      if (w.ammo.value <= 0) return ui.notifications.warn(game.i18n.format("NOIR.NoAmmo", { name: item.name }));
      await item.update({ "system.ammo.value": w.ammo.value - 1 });
    }
    const mod = this._weaponAbilityMod(w) + (w.proficient ? this.system.prof : 0) + w.attackBonus;
    return this._d20(mod, `${item.name}: ${game.i18n.localize("NOIR.Attack")}`, event);
  }

  async rollDamage(item, event) {
    const w = item.system;
    const crit = !!event?.shiftKey;
    const roll = new Roll(`${w.damage} + @mod`, { mod: this._weaponAbilityMod(w) });
    if (crit) roll.alter(2, 0, { multiplyNumeric: false });
    await roll.evaluate();
    const tag = crit ? ` (${game.i18n.localize("NOIR.Crit")})` : "";
    return roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: `${item.name}: ${game.i18n.localize("NOIR.Damage")} ${w.damageType}${tag}` });
  }
}
