import { NOIR } from "../config.mjs";
const f = foundry.data.fields;
const num = (initial = 0, extra = {}) => new f.NumberField({ required: true, integer: true, initial, ...extra });

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      abilities: new f.SchemaField(Object.fromEntries(Object.keys(NOIR.abilities).map(k => [k,
        new f.SchemaField({ value: num(10, { min: 1, max: 30 }), saveProf: new f.BooleanField({ initial: false }) })]))),
      skills: new f.SchemaField(Object.fromEntries(Object.keys(NOIR.skills).map(k => [k,
        new f.SchemaField({ prof: num(0, { min: 0, max: 2 }) })]))),
      details: new f.SchemaField({
        level: num(1, { min: 1, max: 20 }), xp: num(0, { min: 0 }),
        vice: new f.StringField({ initial: "" }), drive: new f.StringField({ initial: "" }),
        scars: new f.StringField({ initial: "" }), debts: new f.StringField({ initial: "" })
      }),
      hp: new f.SchemaField({ value: num(10), max: num(10, { min: 0 }), temp: num(0, { min: 0 }) }),
      nerve: new f.SchemaField({ value: num(10, { min: 0 }) }),
      heat: num(0, { min: 0, max: 5 }),
      cash: num(0, { min: 0 }),
      luck: new f.BooleanField({ initial: false }),
      speed: new f.NumberField({ required: true, initial: 9, min: 0 }),
      nerveBonus: num(0),
      biography: new f.HTMLField()
    };
  }
}

export class NpcData extends CharacterData {
  static defineSchema() {
    return { ...super.defineSchema(), cr: new f.StringField({ initial: "1" }), acFlat: num(12, { min: 0 }) };
  }
}
