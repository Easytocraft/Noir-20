import { NOIR } from "./config.mjs";
import { TABS, ABIL, emptyState, buildContext, buildPicker, starterSets, isDone } from "./creation-ctx.mjs";
import { packDocs, finishCreation } from "./apply.mjs";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
const L = k => game.i18n.localize(k);
const SLOT_TYPE = { class: "class", species: "species", background: "background", armor: "armor", main: "weapon", sub: "weapon" };

/** Обозреватель: список документов с поиском (аналог обозревателя компендиума). */
export class DocPicker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noir", "picker"], window: { resizable: true, title: "NOIR.Browser" },
    position: { width: 520, height: 600, left: 24, top: 70 }, actions: { choose: DocPicker.choose }
  };
  static PARTS = { main: { template: "systems/noir-d20/templates/picker.hbs", scrollable: [".rows"] } };

  constructor({ kind, docs, onPick }) {
    super({ id: `noir-picker-${kind}` });
    this.kind = kind; this.docs = docs; this.onPick = onPick;
  }
  async _prepareContext() { return buildPicker(this.kind, this.docs, L); }
  _onRender() {
    const input = this.element.querySelector("[data-search]");
    input?.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      for (const row of this.element.querySelectorAll(".row")) row.hidden = !!q && !row.dataset.name.includes(q);
    });
    input?.focus();
  }
  static choose(event, target) {
    const doc = this.docs.find(d => d.id === target.dataset.id);
    if (doc) this.onPick(doc);
    return this.close();
  }
}

/** Мастер создания персонажа: вкладки, ячейки выбора и обозреватель, как в Daggerheart. */
export class CreationWizard extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noir", "creation"], window: { resizable: true, title: "NOIR.CreateTitle" }, position: { width: 800, height: 720 },
    actions: {
      goTab: CreationWizard.goTab, pick: CreationWizard.pick, clear: CreationWizard.clear, chip: CreationWizard.chip,
      recommended: CreationWizard.recommended, next: CreationWizard.next, back: CreationWizard.back,
      finish: CreationWizard.finish, cancel: CreationWizard.cancel
    }
  };
  static PARTS = { main: { template: "systems/noir-d20/templates/creation.hbs", scrollable: [".body"] } };

  constructor(actor) {
    super({ id: `noir-creation-${actor.id}` });
    this.actor = actor; this.draft = emptyState(); this.docs = null; // не `state`: это геттер ApplicationV2
  }
  get title() { return `${L("NOIR.CreateTitle")}: ${this.actor.name}`; }

  async #load() {
    if (this.docs) return true;
    const [cls, species, bg, gear, features] = await Promise.all(["noir-classes", "noir-species", "noir-backgrounds", "noir-gear", "noir-features"].map(packDocs));
    if (![cls, species, bg, gear].every(l => l.length)) return false;
    this.docs = { class: cls, species, background: bg, gear, features };
    this.docs.starters = starterSets(gear);
    return true;
  }

  async _prepareContext() {
    if (!(await this.#load())) { this.close(); return {}; }
    return buildContext(this.draft, this.docs, L);
  }

  _onRender() {
    for (const el of this.element.querySelectorAll("[data-bind]")) {
      el.addEventListener(el.tagName === "TEXTAREA" || el.type === "text" ? "input" : "change", ev => {
        this.#set(el.dataset.bind, el.value);
        if (!(el.tagName === "TEXTAREA" || el.type === "text")) this.render();
        else this.#refreshButtons();
      });
    }
    for (const slot of this.element.querySelectorAll("[data-drop]")) {
      slot.addEventListener("dragover", ev => ev.preventDefault());
      slot.addEventListener("drop", async ev => {
        ev.preventDefault();
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(ev);
        const doc = data?.uuid ? await fromUuid(data.uuid) : null;
        const kind = slot.dataset.drop;
        if (doc?.type === SLOT_TYPE[kind]) { this.draft[kind] = doc; this.render(); }
        else ui.notifications.warn(L(`NOIR.Pick.${kind}`));
      });
    }
  }

  #refreshButtons() {
    const next = this.element.querySelector("[data-action=next],[data-action=finish]");
    if (!next) return;
    const last = this.draft.tab === TABS.at(-1);
    next.disabled = last ? !TABS.every(t => isDone(t, this.draft)) : !isDone(this.draft.tab, this.draft);
  }

  #set(path, value) {
    const st = this.draft;
    if (path.startsWith("stat.")) st.stats[path.slice(5)] = value === "" ? null : Number(value);
    else if (path.startsWith("pick.")) st.picks[Number(path.slice(5))] = value || null;
    else st[path] = value;
  }

  static goTab(event, target) { this.draft.tab = target.dataset.tab; return this.render(); }
  static next() { this.draft.tab = TABS[Math.min(TABS.length - 1, TABS.indexOf(this.draft.tab) + 1)]; return this.render(); }
  static back() { this.draft.tab = TABS[Math.max(0, TABS.indexOf(this.draft.tab) - 1)]; return this.render(); }
  static cancel() { return this.close(); }
  static clear(event, target) { this.draft[target.dataset.kind] = null; if (target.dataset.kind === "species") this.draft.picks = []; return this.render(); }
  static recommended() { const rec = this.draft.class?.system.stats; if (rec) for (const k of ABIL) this.draft.stats[k] = rec[k]; return this.render(); }

  static chip(event, target) {
    const { field, value } = target.dataset;
    if (field === "choiceA" || field === "choiceB") this.draft[field] = this.docs.gear.find(d => d.id === value) ?? null;
    else this.draft[field] = value;
    return this.render();
  }

  static pick(event, target) {
    const kind = target.dataset.kind, type = SLOT_TYPE[kind];
    const docs = type === "weapon" ? this.docs.starters.weapon : kind === "armor" ? this.docs.starters.armor : this.docs[type];
    const picker = new DocPicker({ kind: type, docs, onPick: doc => {
      if (kind === "species" && this.draft.species?.id !== doc.id) this.draft.picks = [];
      this.draft[kind] = doc; this.render();
    } });
    return picker.render(true);
  }

  static async finish() {
    if (!TABS.every(t => isDone(t, this.draft))) return;
    const st = this.draft;
    await this.close();
    try { await finishCreation(this.actor, { cls: st.class, species: st.species, bg: st.background, stats: st.stats, picks: st.picks,
      vice: st.vice.trim(), drive: st.drive.trim(), past: st.past.trim(), armor: st.armor, main: st.main, sub: st.sub, choices: [st.choiceA, st.choiceB] }); }
    catch (err) { console.error("noir-d20 | finishCreation", err); ui.notifications.error(`Нуар d20: ${err.message}`); }
  }
}
