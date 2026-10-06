// Выбор шрифтов досье. Три роли: машинопись (основной текст), заголовки (штампы, вкладки, подписи), рукопись (почерк).
// Шрифты Google подключаются только если включена настройка (нужен интернет); системные работают всегда.
// Все перечисленные шрифты поддерживают кириллицу (Google-шрифты проверяются на странице docs/fonts-lab.html).
export const MOD = "noir-d20";
const MONO = '"Courier New", Courier, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Arial Narrow", Arial, sans-serif';
const SCRIPT = '"Segoe Script", "Comic Sans MS", cursive';
const g = (key, name, label, fallback) => ({ key, label, google: name, css: `"${name}", ${fallback}` });
const sys = (key, label, css) => ({ key, label, css });

export const DEFAULT_CSS = {
  type: '"Courier Prime", "Cutive Mono", "American Typewriter", "Courier New", Courier, monospace',
  head: '"Runtti SP", "Courier New", monospace',
  hand: '"Segoe Script", "Bradley Hand", "Comic Sans MS", "Marker Felt", cursive'
};

export const FONTS = {
  type: [
    sys("default", "По умолчанию (Courier)", DEFAULT_CSS.type),
    sys("courierNew", "Courier New (Windows)", MONO),
    sys("lucida", "Lucida Console (Windows)", '"Lucida Console", "Lucida Sans Typewriter", monospace'),
    sys("consolas", "Consolas (Windows)", 'Consolas, "Courier New", monospace'),
    g("underdog", "Underdog", "Underdog — рваная машинопись", MONO),
    g("plexMono", "IBM Plex Mono", "IBM Plex Mono — плотная, со slab-засечками", MONO),
    g("anonymous", "Anonymous Pro", "Anonymous Pro — классический моно", MONO),
    g("cousine", "Cousine", "Cousine — как Courier, но без засечек", MONO),
    g("ptMono", "PT Mono", "PT Mono — чистая машинопись", MONO),
    g("ubuntuMono", "Ubuntu Mono", "Ubuntu Mono — узкая", MONO),
    g("firaMono", "Fira Mono", "Fira Mono", MONO),
    g("robotoMono", "Roboto Mono", "Roboto Mono", MONO),
    g("sourceCode", "Source Code Pro", "Source Code Pro", MONO),
    g("notoMono", "Noto Sans Mono", "Noto Sans Mono", MONO),
    { key: "file", label: "Свой файл: fonts/type.woff2 (или .woff, .ttf, .otf)", file: "type" }
  ],
  head: [
    sys("runtti", "Runtti SP Bold (встроенный)", '"Runtti SP", "Courier New", monospace'),
    sys("same", "Как машинопись", null),
    g("oswald", "Oswald", "Oswald — узкий плакатный", SANS),
    g("robotoCondensed", "Roboto Condensed", "Roboto Condensed", SANS),
    g("playfair", "Playfair Display", "Playfair Display — газетная антиква", SERIF),
    g("oldStandard", "Old Standard TT", "Old Standard TT — старая газета", SERIF),
    g("forum", "Forum", "Forum — римские капители", SERIF),
    g("oranienbaum", "Oranienbaum", "Oranienbaum — контрастная", SERIF),
    g("yeseva", "Yeseva One", "Yeseva One — афишная", SERIF),
    g("tenor", "Tenor Sans", "Tenor Sans — строгая", SANS),
    g("russo", "Russo One", "Russo One — блочная", SANS),
    sys("impact", "Impact (Windows)", 'Impact, "Arial Narrow", sans-serif'),
    { key: "file", label: "Свой файл: fonts/head.woff2 (или .woff, .ttf, .otf)", file: "head" }
  ],
  hand: [
    sys("default", "По умолчанию (Segoe Script)", DEFAULT_CSS.hand),
    sys("segoePrint", "Segoe Print (Windows)", '"Segoe Print", "Comic Sans MS", cursive'),
    sys("inkFree", "Ink Free (Windows)", '"Ink Free", "Segoe Print", cursive'),
    sys("comic", "Comic Sans MS", '"Comic Sans MS", cursive'),
    g("caveat", "Caveat", "Caveat — быстрый почерк", SCRIPT),
    g("marck", "Marck Script", "Marck Script — наклонное перо", SCRIPT),
    g("neucha", "Neucha", "Neucha — детективный блокнот", SCRIPT),
    g("pangolin", "Pangolin", "Pangolin — округлый", SCRIPT),
    g("badScript", "Bad Script", "Bad Script — небрежный", SCRIPT),
    g("amatic", "Amatic SC", "Amatic SC — тонкие капители", SCRIPT),
    { key: "file", label: "Свой файл: fonts/hand.woff2 (или .woff, .ttf, .otf)", file: "hand" }
  ]
};

const ROLES = ["type", "head", "hand"];
const SUFFIX = { type: "Type", head: "Head", hand: "Hand" };
const fallback = { type: DEFAULT_CSS.type, head: SERIF, hand: DEFAULT_CSS.hand };

/** Имя шрифта из текстового поля → безопасное значение font-family. */
export function customFamily(raw, role) {
  const text = String(raw ?? "").replace(/[;{}<>\\@]|url\(|\/\*/gi, "").trim().slice(0, 80);
  if (!text) return null;
  const list = /["',]/.test(text) ? text : `"${text}"`;
  return `${list}, ${fallback[role]}`;
}

export function googleUrl(name) {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}&display=swap`;
}

const loadedFiles = new Map();
async function loadFile(base) {
  if (loadedFiles.has(base)) return loadedFiles.get(base);
  const family = `NoirFile-${base}`;
  for (const ext of ["woff2", "woff", "ttf", "otf"]) {
    try {
      const face = new FontFace(family, `url("${foundry.utils.getRoute(`systems/${MOD}/fonts/${base}.${ext}`)}")`);
      await face.load();
      document.fonts.add(face);
      loadedFiles.set(base, family);
      return family;
    } catch (e) { /* пробуем следующее расширение */ }
  }
  ui.notifications.warn(`Шрифт: файл systems/${MOD}/fonts/${base}.woff2 не найден`);
  loadedFiles.set(base, null);
  return null;
}

/** Применяет выбранные шрифты ко всему интерфейсу досье (CSS-переменные). */
export async function applyFonts() {
  const get = k => game.settings.get(MOD, k);
  const root = document.documentElement.style;
  const wantGoogle = new Set();
  for (const role of ROLES) {
    const preset = FONTS[role].find(f => f.key === get(`font${SUFFIX[role]}`)) ?? FONTS[role][0];
    let css = customFamily(get(`font${SUFFIX[role]}Custom`), role) ?? preset.css;
    if (!customFamily(get(`font${SUFFIX[role]}Custom`), role) && preset.file) {
      const family = await loadFile(preset.file);
      css = family ? `"${family}", ${fallback[role]}` : null;
    }
    if (preset.google && get("fontGoogle")) wantGoogle.add(preset.google);
    if (css) root.setProperty(`--noir-${role}`, css); else root.removeProperty(`--noir-${role}`);
  }
  for (const link of document.head.querySelectorAll("link[data-noir-font]")) if (!wantGoogle.has(link.dataset.noirFont)) link.remove();
  for (const name of wantGoogle) {
    if (document.head.querySelector(`link[data-noir-font="${name}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = googleUrl(name); link.dataset.noirFont = name;
    document.head.append(link);
  }
}

export function registerFontSettings(onChange) {
  const cfg = (key, extra) => game.settings.register(MOD, key, { scope: "client", config: true, onChange, ...extra });
  for (const role of ROLES) {
    const S = SUFFIX[role];
    cfg(`font${S}`, { name: `NOIR.Settings.Font${S}`, hint: `NOIR.Settings.Font${S}Hint`, type: String, default: FONTS[role][0].key,
      choices: Object.fromEntries(FONTS[role].map(f => [f.key, f.label])) });
    cfg(`font${S}Custom`, { name: `NOIR.Settings.Font${S}Custom`, hint: "NOIR.Settings.FontCustomHint", type: String, default: "" });
  }
  cfg("fontGoogle", { name: "NOIR.Settings.FontGoogle", hint: "NOIR.Settings.FontGoogleHint", type: Boolean, default: false });
}
