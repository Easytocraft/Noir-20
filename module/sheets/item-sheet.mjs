import { NOIR } from "../config.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class NoirItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noir", "item"],
    position: { width: 540, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };
  static PARTS = { sheet: { template: "systems/noir-d20/templates/item-sheet.hbs", scrollable: [".sheet-body"] } };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const doc = this.document;
    ctx.item = doc; ctx.system = doc.system;
    ctx.is = { [doc.type]: true };
    ctx.hasPrice = ["weapon", "armor", "gear"].includes(doc.type);
    ctx.weaponAbilities = NOIR.weaponAbilities; ctx.armorKinds = NOIR.armorKinds;
    ctx.enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(doc.system.description, { relativeTo: doc });
    return ctx;
  }
}
