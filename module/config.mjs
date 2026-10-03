export const NOIR = {
  abilities: {
    str: "NOIR.Ability.str", dex: "NOIR.Ability.dex", con: "NOIR.Ability.con",
    int: "NOIR.Ability.int", wis: "NOIR.Ability.wis", cha: "NOIR.Ability.cha"
  },
  skills: {
    acrobatics:    { ability: "dex", label: "NOIR.Skill.acrobatics" },
    athletics:     { ability: "str", label: "NOIR.Skill.athletics" },
    deception:     { ability: "cha", label: "NOIR.Skill.deception" },
    driving:       { ability: "dex", label: "NOIR.Skill.driving" },
    insight:       { ability: "wis", label: "NOIR.Skill.insight" },
    intimidation:  { ability: "cha", label: "NOIR.Skill.intimidation" },
    investigation: { ability: "int", label: "NOIR.Skill.investigation" },
    law:           { ability: "int", label: "NOIR.Skill.law" },
    mechanics:     { ability: "int", label: "NOIR.Skill.mechanics" },
    medicine:      { ability: "wis", label: "NOIR.Skill.medicine" },
    occult:        { ability: "int", label: "NOIR.Skill.occult" },
    perception:    { ability: "wis", label: "NOIR.Skill.perception" },
    persuasion:    { ability: "cha", label: "NOIR.Skill.persuasion" },
    sleight:       { ability: "dex", label: "NOIR.Skill.sleight" },
    stealth:       { ability: "dex", label: "NOIR.Skill.stealth" },
    streetwise:    { ability: "cha", label: "NOIR.Skill.streetwise" }
  },
  weaponAbilities: { str: "NOIR.Ability.str", dex: "NOIR.Ability.dex", finesse: "NOIR.Finesse" },
  armorKinds: { armor: "NOIR.Armor", shield: "NOIR.Shield" },
  vices: ["Выпивка", "Азарт", "Табак", "Романы", "Ложь", "Лёгкие деньги"],
  drives: ["Месть", "Искупление", "Правда", "Деньги", "Семья", "Выжить"],
  scars: {
    limp: { label: "Хромота (−1,5 м скорости)", speed: -1.5 },
    insomnia: { label: "Бессонница (−1 к максимуму Нерва)", nerve: -1 },
    tremor: { label: "Дрожь (помеха на первую атаку в бою)" },
    face: { label: "Шрам на лице (помеха на первое впечатление)" },
    cough: { label: "Кашель (помеха на Скрытность в тишине)" },
    custom: { label: "Свой вариант (поле рядом)" }
  }
};
