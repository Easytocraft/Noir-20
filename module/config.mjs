export const NOIR = {
  // Значение характеристики — это сразу модификатор (как в Daggerheart): от −3 до +5.
  abilities: {
    str: "NOIR.Ability.str", dex: "NOIR.Ability.dex", int: "NOIR.Ability.int",
    con: "NOIR.Ability.con", luck: "NOIR.Ability.luck", cha: "NOIR.Ability.cha"
  },

  // Иконки характеристик (контурные, 24×24)
  icons: {
    str: '<svg viewBox="0 0 24 24"><path d="M2.5 9.5v5M5.5 7v10M18.5 7v10M21.5 9.5v5M5.5 12h13"/></svg>',
    dex: '<svg viewBox="0 0 24 24"><path d="M4 18c0-7 5-11 15-10"/><path d="M15 4l4.5 4L15 12"/><path d="M4 21h8"/></svg>',
    int: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L21 21"/><path d="M7.5 9.5a3 3 0 0 1 3-2.5"/></svg>',
    con: '<svg viewBox="0 0 24 24"><path d="M12 20.5S3.5 15.5 3.5 9.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.2c0 6.3-8.5 11.3-8.5 11.3z"/></svg>',
    luck: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><g fill="currentColor" stroke="none"><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="9" cy="15" r="1.2"/><circle cx="15" cy="15" r="1.2"/></g></svg>',
    cha: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H11l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/></svg>'
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
