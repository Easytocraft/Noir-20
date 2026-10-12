import { TABS, ABIL, START_ABILITIES, emptyState, buildContext, buildPicker, starterSets, isDone } from "./creation-ctx.mjs";
import { packDocs, finishCreation } from "./apply.mjs";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
const L = k => game.i18n.localize(k);
const SLOT_TYPE = { class: "class", species: "species", species2: "species", background: "background", armor: "armor", main: "weapon", sub: "weapon" };

/** Обозреватель: список документов с поиском (аналог обозревателя компендиума). */
export class DocPicker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noir", "picker"], window: { resizable: true, title: "NOIR.Browser" },
    position: { width: 560, height: 600, left: 24, top: 70 }, actions: { choose: DocPicker.choose }
  };
  static PARTS = { main: { template: "systems/noir-d20/templates/picker.hbs", scrollable: [".rows"] } };

  constructor({ kind, docs, features, onPick }) {
    super({ id: `noir-picker-${kind}` });
    this.kind = kind; this.docs = docs; this.features = features ?? []; this.onPick = onPick;
  }
  async _prepareContext() { return buildPicker(this.kind, this.docs, L, this.features); }
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
    classes: ["noir", "creation"], window: { resizable: true, title: "NOIR.CreateTitle" }, position: { width: 820, height: 740 },
    actions: {
      goTab: CreationWizard.goTab, pick: CreationWizard.pick, clear: CreationWizard.clear, chip: CreationWizard.chip,
      toggleAbility: CreationWizard.toggleAbility, toggleMixed: CreationWizard.toggleMixed, pickTrait: CreationWizard.pickTrait,
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
    if (![cls, species, bg, gear, features].every(l => l.length)) return false;
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
      const live = el.tagName === "TEXTAREA" || el.type === "text";
      el.addEventListener(live ? "input" : "change", () => {
        this.#set(el.dataset.bind, el.value);
        if (live) this.#refreshButtons(); else this.render();
      });
    }
    for (const slot of this.element.querySelectorAll("[data-drop]")) {
      slot.addEventListener("dragover", ev => ev.preventDefault());
      slot.addEventListener("drop", async ev => {
        ev.preventDefault();
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(ev);
        const doc = data?.uuid ? await fromUuid(data.uuid) : null;
        const kind = slot.dataset.drop;
        if (doc?.type === SLOT_TYPE[kind]) this.#assign(kind, doc); else ui.notifications.warn(L(`NOIR.Pick.${kind}`));
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
    else st[path] = value;
  }

  /** Кладёт документ в ячейку и сбрасывает зависящие от неё выборы. */
  #assign(kind, doc) {
    const st = this.draft;
    if (kind === "class" && st.class?.id !== doc.id) st.abilities = [];
    if (kind === "species" && st.species?.id !== doc.id) st.traitA = null;
    if (kind === "species2" && st.species2?.id !== doc.id) st.traitB = null;
    st[kind] = doc;
    this.render();
  }

  static goTab(event, target) { this.draft.tab = target.dataset.tab; return this.render(); }
  static next() { this.draft.tab = TABS[Math.min(TABS.length - 1, TABS.indexOf(this.draft.tab) + 1)]; return this.render(); }
  static back() { this.draft.tab = TABS[Math.max(0, TABS.indexOf(this.draft.tab) - 1)]; return this.render(); }
  static cancel() { return this.close(); }
  static recommended() { const rec = this.draft.class?.system.stats; if (rec) for (const k of ABIL) this.draft.stats[k] = rec[k]; return this.render(); }

  static clear(event, target) {
    const kind = target.dataset.kind, st = this.draft;
    st[kind] = null;
    if (kind === "class") st.abilities = [];
    if (kind === "species") st.traitA = null;
    if (kind === "species2") st.traitB = null;
    return this.render();
  }

  static chip(event, target) {
    const { field, value } = target.dataset;
    if (field === "choiceA" || field === "choiceB") this.draft[field] = this.docs.gear.find(d => d.id === value) ?? null;
    else this.draft[field] = value;
    return this.render();
  }

  static toggleAbility(event, target) {
    const doc = this.docs.features.find(d => d.id === target.dataset.id), list = this.draft.abilities;
    if (!doc) return;
    const i = list.findIndex(a => a.id === doc.id);
    if (i >= 0) list.splice(i, 1);
    else if (list.length < START_ABILITIES) list.push(doc);
    else ui.notifications.info(game.i18n.format("NOIR.AbilitiesFull", { n: START_ABILITIES }));
    return this.render();
  }

  static toggleMixed() {
    const st = this.draft;
    st.mixed = !st.mixed;
    if (!st.mixed) { st.species2 = null; st.traitA = null; st.traitB = null; }
    return this.render();
  }

  static pickTrait(event, target) {
    const doc = this.docs.features.find(d => d.id === target.dataset.id);
    if (doc) this.draft[target.dataset.which === "B" ? "traitB" : "traitA"] = doc;
    return this.render();
  }

  static pick(event, target) {
    const kind = target.dataset.kind, type = SLOT_TYPE[kind];
    const docs = type === "weapon" ? this.docs.starters.weapon : kind === "armor" ? this.docs.starters.armor : this.docs[type];
    return new DocPicker({ kind: type, docs, features: this.docs.features, onPick: doc => this.#assign(kind, doc) }).render(true);
  }

  static async finish() {
    const st = this.draft;
    if (!TABS.every(t => isDone(t, st))) return;
    await this.close();
    try {
      await finishCreation(this.actor, {
        cls: st.class, abilities: st.abilities, species: st.mixed ? [st.species, st.species2] : [st.species], traits: st.mixed ? [st.traitA, st.traitB] : undefined,
        bg: st.background, stats: st.stats, vice: st.vice.trim(), drive: st.drive.trim(), past: st.past.trim(),
        armor: st.armor, main: st.main, sub: st.sub, choices: [st.choiceA, st.choiceB]
      });
    } catch (err) { console.error("noir-d20 | finishCreation", err); ui.notifications.error(`Нуар d20: ${err.message}`); }
  }
}
