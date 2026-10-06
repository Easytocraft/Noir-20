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
    this.actor = actor; this.state = emptyState(); this.docs = null;
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
    return buildContext(this.state, this.docs, L);
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
        if (doc?.type === SLOT_TYPE[kind]) { this.state[kind] = doc; this.render(); }
        else ui.notifications.warn(L(`NOIR.Pick.${kind}`));
      });
    }
  }

  #refreshButtons() {
    const next = this.element.querySelector("[data-action=next],[data-action=finish]");
    if (!next) return;
    const last = this.state.tab === TABS.at(-1);
    next.disabled = last ? !TABS.every(t => isDone(t, this.state)) : !isDone(this.state.tab, this.state);
  }

  #set(path, value) {
    const st = this.state;
    if (path.startsWith("stat.")) st.stats[path.slice(5)] = value === "" ? null : Number(value);
    else if (path.startsWith("pick.")) st.picks[Number(path.slice(5))] = value || null;
    else st[path] = value;
  }

  static goTab(event, target) { this.state.tab = target.dataset.tab; return this.render(); }
  static next() { this.state.tab = TABS[Math.min(TABS.length - 1, TABS.indexOf(this.state.tab) + 1)]; return this.render(); }
  static back() { this.state.tab = TABS[Math.max(0, TABS.indexOf(this.state.tab) - 1)]; return this.render(); }
  static cancel() { return this.close(); }
  static clear(event, target) { this.state[target.dataset.kind] = null; if (target.dataset.kind === "species") this.state.picks = []; return this.render(); }
  static recommended() { const rec = this.state.class?.system.stats; if (rec) for (const k of ABIL) this.state.stats[k] = rec[k]; return this.render(); }

  static chip(event, target) {
    const { field, value } = target.dataset;
    if (field === "choiceA" || field === "choiceB") this.state[field] = this.docs.gear.find(d => d.id === value) ?? null;
    else this.state[field] = value;
    return this.render();
  }

  static pick(event, target) {
    const kind = target.dataset.kind, type = SLOT_TYPE[kind];
    const docs = type === "weapon" ? this.docs.starters.weapon : kind === "armor" ? this.docs.starters.armor : this.docs[type];
    const picker = new DocPicker({ kind: type, docs, onPick: doc => {
      if (kind === "species" && this.state.species?.id !== doc.id) this.state.picks = [];
      this.state[kind] = doc; this.render();
    } });
    return picker.render(true);
  }

  static async finish() {
    if (!TABS.every(t => isDone(t, this.state))) return;
    const st = this.state;
    await this.close();
    await finishCreation(this.actor, { cls: st.class, species: st.species, bg: st.background, stats: st.stats, picks: st.picks,
      vice: st.vice.trim(), drive: st.drive.trim(), past: st.past.trim(), armor: st.armor, main: st.main, sub: st.sub, choices: [st.choiceA, st.choiceB] });
  }
}
