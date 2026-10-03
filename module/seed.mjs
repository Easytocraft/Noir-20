const ROOT = "systems/noir-d20/data";
const load = async n => (await fetch(foundry.utils.getRoute(`${ROOT}/${n}.json`))).json();

async function ensurePack(name, label) {
  if (game.packs.get(`noir-d20.${name}`)) return null; // готовые пакеты системы
  let pack = game.packs.get(`world.${name}`);
  if (!pack) pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ name, label, type: "Item" });
  await pack.getIndex();
  return pack;
}

const classHtml = c => `<p>${c.summary}</p><h3>Умения</h3>` +
  c.features.map(f => `<p><strong>${f.level} ур. — ${f.name}.</strong> ${f.cost ? `<em>(${f.cost})</em> ` : ""}${f.desc}</p>`).join("");

/** Создаёт мировые компендиумы и наполняет их контентом системы. */
export async function seed({ force = false } = {}) {
  const [classes, species, backgrounds, items, subclasses, talents] = await Promise.all(["classes", "species", "backgrounds", "items", "subclasses", "talents"].map(load));
  const featDocs = (list, owner) => list.flatMap(c => c.features.map(f => ({ name: f.name, type: "feature", system: { level: f.level, source: c.name, cost: f.cost ?? "", description: `<p>${f.desc}</p>` } })));
  const sets = {
    "noir-classes": ["Нуар: Классы", classes.map(c => ({ name: c.name, type: "class", system: { ...c.system, description: classHtml(c) } }))],
    "noir-features": ["Нуар: Умения классов", [...featDocs(classes), ...featDocs(subclasses)]],
    "noir-subclasses": ["Нуар: Подклассы", subclasses.map(c => ({ name: c.name, type: "subclass", system: { class: c.class, description: classHtml(c) } }))],
    "noir-talents": ["Нуар: Приёмы", talents],
    "noir-species": ["Нуар: Расы", species.map(s => ({ name: s.name, type: "species", system: s.system }))],
    "noir-backgrounds": ["Нуар: Происхождения", backgrounds.map(b => ({ name: b.name, type: "background", system: b.system }))],
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
