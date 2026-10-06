import { NOIR } from "../config.mjs";
const f = foundry.data.fields;
const num = (initial = 0, extra = {}) => new f.NumberField({ required: true, integer: true, initial, ...extra });
const money = () => new f.NumberField({ required: true, initial: 0, min: 0 });
const desc = () => ({ description: new f.HTMLField() });
const six = () => new f.SchemaField(Object.fromEntries(Object.keys(NOIR.abilities).map(k => [k, num(0)])));

export class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      damage: new f.StringField({ initial: "1d6" }),
      damageType: new f.StringField({ initial: "" }),
      ability: new f.StringField({ initial: "dex", choices: ["str", "dex", "finesse"] }),
      range: new f.StringField({ initial: "" }),
      properties: new f.StringField({ initial: "" }),
      attackBonus: num(0),
      ammo: new f.SchemaField({ value: num(0, { min: 0 }), max: num(0, { min: 0 }) }),
      equipped: new f.BooleanField({ initial: true }),
      weight: money(), price: money()
    };
  }
}

export class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      kind: new f.StringField({ initial: "armor", choices: ["armor", "shield"] }),
      protection: num(1, { min: 0 }),   // прибавка к порогам урона
      evasion: num(0),                  // поправка к Уклонению
      equipped: new f.BooleanField({ initial: false }),
      weight: money(), price: money()
    };
  }
}

export class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...desc(), quantity: num(1, { min: 0 }), weight: money(), price: money() };
  }
}

export class ClassData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...desc(), focus: new f.StringField({ initial: "" }), stats: six(), startItems: new f.ArrayField(new f.StringField()) };
  }
}

export class SpeciesData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      asi: new f.StringField({ initial: "" }),
      size: new f.StringField({ initial: "Средний" }),
      bonuses: six(),
      freeAsi: num(0, { min: 0 }),
      freeFrom: new f.ArrayField(new f.StringField()),
      evasion: num(0), wounds: num(0), stressBonus: num(0)
    };
  }
}

export class BackgroundData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      equipment: new f.StringField({ initial: "" }),
      startItems: new f.ArrayField(new f.StringField()),
      startCash: num(0, { min: 0 })
    };
  }
}

export class FeatureData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...desc(), level: num(1, { min: 0, max: 20 }), source: new f.StringField({ initial: "" }), cost: new f.StringField({ initial: "" }) };
  }
}

export class SubclassData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...desc(), class: new f.StringField({ initial: "" }) };
  }
}
