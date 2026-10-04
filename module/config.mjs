export const NOIR = {
  // Значение характеристики — это сразу модификатор (как в Daggerheart): от −3 до +5.
  abilities: {
    str: "NOIR.Ability.str", dex: "NOIR.Ability.dex", int: "NOIR.Ability.int",
    con: "NOIR.Ability.con", luck: "NOIR.Ability.luck", cha: "NOIR.Ability.cha"
  },
  statArray: [2, 1, 1, 0, 0, -1],
  statMin: -3, statMax: 5, maxLevel: 10,
  weaponAbilities: { str: "NOIR.Ability.str", dex: "NOIR.Ability.dex", finesse: "NOIR.Finesse" },
  armorKinds: { armor: "NOIR.Armor", shield: "NOIR.Shield" },
  vices: ["Выпивка", "Азарт", "Табак", "Романы", "Ложь", "Лёгкие деньги"],
  drives: ["Месть", "Искупление", "Правда", "Деньги", "Семья", "Выжить"],
  scars: {
    limp: { label: "Хромота (помеха при погоне и беге)" },
    insomnia: { label: "Бессонница (−1 к запасу Стресса)", stress: -1 },
    tremor: { label: "Дрожь (помеха на первую атаку в бою)" },
    face: { label: "Шрам на лице (помеха на первое впечатление)" },
    cough: { label: "Кашель (помеха на скрытность в тишине)" },
    custom: { label: "Свой вариант (поле рядом)" }
  }
};
