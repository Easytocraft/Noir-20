const f = foundry.data.fields;
const num = (initial = 0, extra = {}) => new f.NumberField({ required: true, integer: true, initial, ...extra });
const money = () => new f.NumberField({ required: true, initial: 0, min: 0 });
const desc = () => ({ description: new f.HTMLField() });

export class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      damage: new f.StringField({ initial: "1d6" }),
      damageType: new f.StringField({ initial: "" }),
      ability: new f.StringField({ initial: "dex", choices: ["str", "dex", "finesse"] }),
      range: new f.StringField({ initial: "" }),
      properties: new f.StringField({ initial: "" }),
      proficient: new f.BooleanField({ initial: true }),
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
      ac: num(11, { min: 0 }),
      maxDex: new f.NumberField({ integer: true, nullable: true, initial: null }),
      stealthDis: new f.BooleanField({ initial: false }),
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
    return {
      ...desc(),
      hitDie: new f.StringField({ initial: "d8" }),
      saves: new f.StringField({ initial: "" }),
      proficiencies: new f.StringField({ initial: "" }),
      skills: new f.StringField({ initial: "" }),
      saveKeys: new f.ArrayField(new f.StringField()),
      skillKeys: new f.ArrayField(new f.StringField()),
      skillCount: num(0, { min: 0 })
    };
  }
}

export class SpeciesData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      asi: new f.StringField({ initial: "" }),
      size: new f.StringField({ initial: "Средний" }),
      speed: new f.NumberField({ required: true, initial: 9, min: 0 }),
      bonuses: new f.SchemaField(Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map(k => [k, num(0)]))),
      freeAsi: num(0, { min: 0 }),
      freeFrom: new f.ArrayField(new f.StringField()),
      freeSkills: num(0, { min: 0 }),
      nerveBonus: num(0)
    };
  }
}

export class BackgroundData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      skills: new f.StringField({ initial: "" }),
      tools: new f.StringField({ initial: "" }),
      equipment: new f.StringField({ initial: "" }),
      skillKeys: new f.ArrayField(new f.StringField()),
      startItems: new f.ArrayField(new f.StringField()),
      startCash: num(0, { min: 0 })
    };
  }
}

export class FeatureData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...desc(),
      level: num(1, { min: 0, max: 20 }),
      source: new f.StringField({ initial: "" }),
      cost: new f.StringField({ initial: "" })
    };
  }
}

export class SubclassData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...desc(), class: new f.StringField({ initial: "" }) };
  }
}
