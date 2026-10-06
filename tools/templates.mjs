// Рендер шаблонов на тестовых данных:  node tools/templates.mjs   (+ --write DIR — сохранить HTML для предпросмотра)
import fs from "node:fs";
import path from "node:path";
import { renderTemplate } from "./render.mjs";
import { actorContext, wizardDocs } from "./mock.mjs";
import { emptyState, buildContext, buildPicker, TABS, isDone, statsValid } from "../module/creation-ctx.mjs";
let fail = 0;
const out = process.argv.includes("--write") ? process.argv[process.argv.indexOf("--write") + 1] : null;
if (out) fs.mkdirSync(out, { recursive: true });
for (const tab of ["traits", "abilities", "items", "biography", "notes"]) {
  for (const [npc, gm] of [[false, true], [true, true], [false, false]]) {
    const { html, problems } = renderTemplate("templates/actor-sheet.hbs", actorContext(tab, { npc, gm }));
    if (!gm && (html.includes("advance-btn") || html.includes('class="xp"'))) { fail++; console.error(`✗ игрок видит шкалу опыта или кнопку «Прокачаться» (вкладка ${tab})`); }
    if (gm && tab === "traits" && !npc && !html.includes("advance-btn")) { fail++; console.error("✗ у мастера нет кнопки «Прокачаться»"); }
    const bad = [...problems, ...(html.includes("undefined") ? ["в HTML есть undefined"] : []), ...(html.includes("{{") ? ["остались нераскрытые теги"] : [])];
    if (bad.length) { fail++; console.error(`✗ лист актора, вкладка ${tab}${npc ? " (НПС)" : gm ? "" : " (игрок)"}: ${bad.join("; ")}`); }
    else console.log(`✓ лист актора, вкладка ${tab}${npc ? " (НПС)" : gm ? "" : " (игрок)"}`);
    if (out && !npc && gm) fs.writeFileSync(path.join(out, `${tab}.html`), html);
  }
}
// --- мастер создания и обозреватель
const lang0 = JSON.parse(fs.readFileSync(new URL("../lang/ru.json", import.meta.url), "utf8"));
const Lk = k => k.split(".").reduce((a, p) => a?.[p], lang0) ?? k;
const D = wizardDocs();
const full = emptyState();
Object.assign(full, { class: D.class[0], species: D.species[0], background: D.background[0], vice: "Выпивка", drive: "Правда", past: "Ушёл из участка.",
  armor: D.gear.find(g => g.type === "armor"), main: D.gear.find(g => g.type === "weapon"), sub: null });
full.picks = ["int"]; full.choiceA = D.gear.find(g => g.name === "Бутылка виски"); full.choiceB = D.gear.find(g => g.name === "Отмычки");
for (const k of Object.keys(D.class[0].system.stats)) full.stats[k] = D.class[0].system.stats[k];
for (const tab of TABS) {
  for (const [label, st] of [["полное", { ...full, tab }], ["пустое", { ...emptyState(), tab }]]) {
    const ctx = buildContext(st, D, Lk);
    const { html, problems } = renderTemplate("templates/creation.hbs", ctx);
    const bad = [...problems, ...(html.includes("undefined") ? ["undefined в HTML"] : [])];
    if (bad.length) { fail++; console.error(`✗ мастер, вкладка ${tab} (${label}): ${bad.join("; ")}`); } else console.log(`✓ мастер, вкладка ${tab} (${label})`);
    if (out && label === "полное") fs.writeFileSync(path.join(out, `wizard-${tab}.html`), html);
  }
}
if (!TABS.every(t => isDone(t, full))) { fail++; console.error("✗ полное состояние мастера не проходит проверки"); }
if (statsValid({ str: 2, dex: 2, int: 1, con: 0, luck: 0, cha: -1 })) { fail++; console.error("✗ набор характеристик с повтором принят"); }
for (const [kind, docs] of [["class", D.class], ["species", D.species], ["background", D.background], ["armor", D.gear.filter(g => g.type === "armor")], ["weapon", D.gear.filter(g => g.type === "weapon")]]) {
  const { html, problems } = renderTemplate("templates/picker.hbs", buildPicker(kind, docs, Lk));
  if (problems.length || html.includes("undefined")) { fail++; console.error(`✗ обозреватель ${kind}: ${problems.join("; ")}`); } else console.log(`✓ обозреватель ${kind}`);
  if (out && kind === "class") fs.writeFileSync(path.join(out, "picker.html"), html);
}
const { NOIR } = await import("../module/config.mjs");
const lang = JSON.parse(fs.readFileSync(new URL("../lang/ru.json", import.meta.url), "utf8")).NOIR;
const six = Object.entries(NOIR.abilities).map(([key]) => ({ key, label: lang.Ability[key], value: 1, bonus: 1 }));
const sys = { description: "", damage: "1d8", damageType: "x", ability: "dex", range: "", properties: "", attackBonus: 0, ammo: { value: 6, max: 6 }, kind: "armor", protection: 1, evasion: 0,
  equipped: true, quantity: 1, focus: "", asi: "", size: "Средний", freeAsi: 0, stressBonus: 0, wounds: 0, startCash: 0, equipment: "", class: "", level: 1, source: "", cost: "", weight: 0, price: 0 };
for (const type of ["weapon", "armor", "gear", "class", "species", "background", "feature", "subclass"]) {
  const ctx = { item: { name: "Тест", img: "" }, system: sys, is: { [type]: true }, hasPrice: ["weapon", "armor", "gear"].includes(type), abilityList: six,
    weaponAbilities: NOIR.weaponAbilities, armorKinds: NOIR.armorKinds, enriched: "" };
  const { html, problems } = renderTemplate("templates/item-sheet.hbs", ctx);
  const bad = [...problems, ...(html.includes("undefined") ? ["undefined в HTML"] : [])];
  if (bad.length) { fail++; console.error(`✗ лист предмета ${type}: ${bad.join("; ")}`); } else console.log(`✓ лист предмета ${type}`);
}
process.exit(fail ? 1 : 0);
