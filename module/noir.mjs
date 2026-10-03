import { NOIR } from "./config.mjs";
import { NoirActor } from "./documents/actor.mjs";
import { CharacterData, NpcData } from "./data/actor.mjs";
import { WeaponData, ArmorData, GearData, ClassData, SpeciesData, BackgroundData, FeatureData, SubclassData } from "./data/item.mjs";
import { NoirActorSheet } from "./sheets/actor-sheet.mjs";
import { NoirItemSheet } from "./sheets/item-sheet.mjs";
import { seed } from "./seed.mjs";
import { revert, levelUp } from "./apply.mjs";

Hooks.once("init", () => {
  CONFIG.NOIR = NOIR;
  CONFIG.Actor.documentClass = NoirActor;
  CONFIG.Actor.dataModels = { character: CharacterData, npc: NpcData };
  CONFIG.Item.dataModels = {
    weapon: WeaponData, armor: ArmorData, gear: GearData, class: ClassData,
    species: SpeciesData, background: BackgroundData, feature: FeatureData, subclass: SubclassData
  };
  CONFIG.Combat.initiative = { formula: "1d20 + @abilities.dex.mod", decimals: 2 };

  const { Actors, Items } = foundry.documents.collections;
  Actors.registerSheet("noir-d20", NoirActorSheet, { types: ["character", "npc"], makeDefault: true, label: "NOIR.Sheet.Actor" });
  Items.registerSheet("noir-d20", NoirItemSheet, {
    types: ["weapon", "armor", "gear", "class", "species", "background", "feature", "subclass"], makeDefault: true, label: "NOIR.Sheet.Item"
  });

  game.settings.register("noir-d20", "seeded", { scope: "world", config: false, type: Boolean, default: false });
});

Hooks.once("ready", async () => {
  game.noir = { seed };
  if (game.user.isGM && !game.settings.get("noir-d20", "seeded")) {
    await seed();
    await game.settings.set("noir-d20", "seeded", true);
  }
});

const oldLevels = new Map();
Hooks.on("preUpdateActor", (actor, changes) => {
  if (foundry.utils.hasProperty(changes, "system.details.level")) oldLevels.set(actor.id, actor.system.details.level);
});
Hooks.on("updateActor", async (actor, changes, options, userId) => {
  if (userId !== game.user.id) return;
  const old = oldLevels.get(actor.id);
  oldLevels.delete(actor.id);
  if (old == null || options.noirSkip) return;
  try { await levelUp(actor, old, actor.system.details.level); } catch (e) { console.error("noir-d20 | levelUp", e); }
});
Hooks.on("deleteItem", async (item, options, userId) => {
  if (userId !== game.user.id || options.noirReverted || !(item.parent instanceof Actor)) return;
  try { await revert(item.parent, item); } catch (e) { console.warn("noir-d20 | revert", e); }
});
