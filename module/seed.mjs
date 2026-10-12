const ROOT = "systems/noir-d20/data";
const load = async n => (await fetch(foundry.utils.getRoute(`${ROOT}/${n}.json`))).json();

async function ensurePack(name, label) {
  if (game.packs.get(`noir-d20.${name}`)) return null; // готовые пакеты системы
  let pack = game.packs.get(`world.${name}`);
  if (!pack) pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ name, label, type: "Item" });
  await pack.getIndex();
  return pack;
}

const classHtml = c => `<p>${c.summary}</p><h3>Особенность</h3><p><strong>${c.trait.name}.</strong> ${c.trait.desc}</p><h3>Способности (на выбор)</h3>` +
  c.abilities.map(f => `<p><strong>${f.name}.</strong> ${f.cost ? `<em>(${f.cost})</em> ` : ""}${f.desc}</p>`).join("");

/** Создаёт мировые компендиумы и наполняет их контентом системы. */
export async function seed({ force = false } = {}) {
  const [classes, species, backgrounds, items, talents] = await Promise.all(["classes", "species", "backgrounds", "items", "talents"].map(load));
  const abilityDocs = c => [
    { name: c.trait.name, type: "feature", img: c.trait.img, system: { kind: "trait", source: c.name, level: 1, cost: c.trait.cost ?? "", description: `<p>${c.trait.desc}</p>` } },
    ...c.abilities.map(a => ({ name: a.name, type: "feature", img: a.img, system: { kind: "ability", source: c.name, level: 1, cost: a.cost ?? "", description: `<p>${a.desc}</p>` } }))
  ];
  const racialDocs = s => s.traits.map(t => ({ name: t.name, type: "feature", img: t.img, system: { kind: "racial", source: s.name, level: 1, cost: "", mods: t.mods, description: `<p>${t.desc}</p>` } }));
  const originDocs = b => ({ name: b.trait.name, type: "feature", img: b.trait.img, system: { kind: "origin", source: b.name, level: 1, cost: "", description: `<p>${b.trait.desc}</p>` } });
  const sets = {
    "noir-classes": ["Нуар: Классы", classes.map(c => ({ name: c.name, type: "class", img: c.img, system: { ...c.system, description: classHtml(c) } }))],
    "noir-features": ["Нуар: Особенности и способности", [...classes.flatMap(abilityDocs), ...species.flatMap(racialDocs), ...backgrounds.map(originDocs)]],
    "noir-talents": ["Нуар: Приёмы", talents.map(t => ({ ...t, system: { ...t.system, kind: "talent" } }))],
    "noir-species": ["Нуар: Расы", species.map(s => ({ name: s.name, type: "species", img: s.img, system: s.system }))],
    "noir-backgrounds": ["Нуар: Происхождения", backgrounds.map(b => ({ name: b.name, type: "background", img: b.img, system: b.system }))],
    "noir-gear": ["Нуар: Снаряжение", items]
  };
  for (const [name, [label, docs]] of Object.entries(sets)) {
    const pack = await ensurePack(name, label);
    if (!pack) continue;
    if (pack.index.size && !force) continue;
    if (pack.index.size) await Item.implementation.deleteDocuments(pack.index.map(i => i._id), { pack: pack.collection });
    await Item.implementation.createDocuments(docs, { pack: pack.collection });
  }
  ui.notifications.info("Нуар d20: компендиумы созданы.");
}
