import { NOIR } from "../config.mjs";

export class NoirActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    const s = this.system;
    if (!s.abilities) return;
    const lvl = s.details.level;
    for (const a of Object.values(s.abilities)) a.mod = a.value;
    const { con, dex, luck } = Object.fromEntries(Object.entries(s.abilities).map(([k, a]) => [k, a.value]));

    const worn = this.items.filter(i => i.type === "armor" && i.system.equipped);
    const protection = worn.reduce((n, i) => n + i.system.protection, 0);
    const evasionMod = worn.reduce((n, i) => n + i.system.evasion, 0);

    if (this.type === "npc") {
      s.evasion = s.foe.evasion;
      s.thresholds = { minor: s.foe.minor, medium: s.foe.medium };
      s.wounds.max = s.foe.wounds;
    } else {
      s.evasion = 10 + dex + evasionMod + s.evasionBonus;
      const minor = 4 + Math.max(0, con) + protection;
      s.thresholds = { minor, medium: minor + 5 };
      s.wounds.max = Math.max(3, 6 + con + Math.floor(lvl / 3) + s.woundsBonus);
    }
    s.stress.max = Math.max(3, 6 + luck + s.stressBonus);
    s.breakdown = s.stress.value >= s.stress.max;
  }

  static _mode(event) {
    if (event?.shiftKey) return 1;
    if (event?.ctrlKey || event?.metaKey) return -1;
    return 0;
  }

  async _d20(mod, flavor, event) {
    const m = Math.max(-1, Math.min(1, NoirActor._mode(event) - (this.system.breakdown ? 1 : 0)));
    if (this.system.breakdown) flavor += ` (${game.i18n.localize("NOIR.Breakdown")})`;
    const die = m > 0 ? "2d20kh" : m < 0 ? "2d20kl" : "1d20";
    const roll = await new Roll(`${die} + @mod`, { mod }).evaluate();
    return roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor });
  }

  rollAbility(key, event) {
    return this._d20(this.system.abilities[key].value, game.i18n.localize(NOIR.abilities[key]), event);
  }

  _weaponAbilityMod(w) {
    const a = this.system.abilities;
    return w.ability === "finesse" ? Math.max(a.str.value, a.dex.value) : a[w.ability].value;
  }

  async rollAttack(item, event) {
    const w = item.system;
    if (w.ammo.max > 0) {
      if (w.ammo.value <= 0) return ui.notifications.warn(game.i18n.format("NOIR.NoAmmo", { name: item.name }));
      await item.update({ "system.ammo.value": w.ammo.value - 1 });
    }
    return this._d20(this._weaponAbilityMod(w) + w.attackBonus, `${item.name}: ${game.i18n.localize("NOIR.Attack")}`, event);
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

  /** Ступень урона: сколько ран отмечается при получении amount урона. */
  static woundsFor(amount, th) {
    if (amount <= 0) return 0;
    return amount <= th.minor ? 1 : amount <= th.medium ? 2 : 3;
  }

  async takeDamage(amount) {
    const s = this.system, n = NoirActor.woundsFor(amount, s.thresholds);
    if (!n) return;
    const value = Math.min(s.wounds.max, s.wounds.value + n);
    await this.update({ "system.wounds.value": value });
    const tier = game.i18n.localize(`NOIR.Tier.${n}`);
    const down = value >= s.wounds.max ? `<p><b>${game.i18n.localize("NOIR.Down")}</b></p>` : "";
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<p>${game.i18n.format("NOIR.DamageTaken", { amount, tier, n })}</p>${down}`
    });
  }
}
