import { NOIR } from "../config.mjs";
const f = foundry.data.fields;
const num = (initial = 0, extra = {}) => new f.NumberField({ required: true, integer: true, initial, ...extra });

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      abilities: new f.SchemaField(Object.fromEntries(Object.keys(NOIR.abilities).map(k => [k,
        new f.SchemaField({ value: num(0, { min: NOIR.statMin, max: NOIR.statMax + 1 }) })]))),
      details: new f.SchemaField({
        level: num(0, { min: 0, max: NOIR.maxLevel }), xp: num(0, { min: 0 }),
        vice: new f.StringField({ initial: "" }), drive: new f.StringField({ initial: "" }),
        scars: new f.StringField({ initial: "" }), debts: new f.StringField({ initial: "" }), enemies: new f.StringField({ initial: "" })
      }),
      wounds: new f.SchemaField({ value: num(0, { min: 0 }) }),
      stress: new f.SchemaField({ value: num(0, { min: 0 }) }),
      courage: num(0, { min: -5, max: 5 }),
      cash: num(0, { min: 0 }),
      evasionBonus: num(0), woundsBonus: num(0), stressBonus: num(0),
      biography: new f.HTMLField(),
      notes: new f.HTMLField()
    };
  }
}

export class NpcData extends CharacterData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      cr: new f.StringField({ initial: "1" }),
      foe: new f.SchemaField({ evasion: num(10, { min: 0 }), minor: num(5, { min: 1 }), medium: num(10, { min: 1 }), wounds: num(4, { min: 1 }) })
    };
  }
}
