// Мини-рендерер подмножества Handlebars для проверки шаблонов без Foundry.
// Поддерживает: {{path}}, {{{raw}}}, {{#if}}/{{#unless}}/{{#each}} с {{else}}, хелперы localize, numberFormat, checked, selectOptions.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lang = JSON.parse(fs.readFileSync(path.join(root, "lang/ru.json"), "utf8"));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? flat(v, p + k + ".") : [[p + k, v]]);
const L = Object.fromEntries(flat(lang));
export const problems = [];

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const truthy = v => Array.isArray(v) ? v.length > 0 : !!v;

function tokenize(src) {
  const out = []; let i = 0; const re = /\{\{\{([\s\S]+?)\}\}\}|\{\{([\s\S]+?)\}\}/g; let m;
  while ((m = re.exec(src))) {
    if (m.index > i) out.push({ t: "text", v: src.slice(i, m.index) });
    out.push(m[1] !== undefined ? { t: "raw", v: m[1].trim() } : { t: "tag", v: m[2].trim() });
    i = re.lastIndex;
  }
  if (i < src.length) out.push({ t: "text", v: src.slice(i) });
  return out;
}
function parse(tokens) {
  let pos = 0;
  const walk = closing => {
    const nodes = []; let cur = nodes, block = null;
    while (pos < tokens.length) {
      const k = tokens[pos++];
      if (k.t === "text") cur.push(k);
      else if (k.t === "raw") cur.push({ t: "raw", v: k.v });
      else if (k.v.startsWith("#")) {
        const [name, ...rest] = k.v.slice(1).split(/\s+/);
        const b = { t: "block", name, expr: rest.join(" "), body: [], else: [] };
        const inner = walk(name); b.body = inner.body; b.else = inner.else; cur.push(b);
      } else if (k.v.startsWith("/")) { return { body: nodes, else: block ?? [] }; }
      else if (k.v === "else") { block = []; cur = block; const keep = nodes; var _ = keep; }
      else cur.push({ t: "var", v: k.v });
    }
    return { body: nodes, else: block ?? [] };
  };
  return walk().body;
}
function args(expr) {
  const parts = expr.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  return parts;
}
function resolve(p, ctx, root) {
  if (/^["'].*["']$/.test(p)) return p.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(p)) return Number(p);
  if (p === "true") return true; if (p === "false") return false;
  if (p === "this") return ctx.this;
  if (p.startsWith("@root.")) return p.slice(6).split(".").reduce((a, k) => a?.[k], root);
  if (p === "@index") return ctx.index;
  const v = p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), ctx.this);
  return v;
}
const helpers = {
  localize: k => { if (!(k in L)) { problems.push(`нет ключа ${k}`); return `⚠${k}`; } return L[k]; },
  numberFormat: (v, h) => (h.sign && v > 0 ? `+${v}` : `${v}`),
  checked: v => (v ? "checked" : ""),
  selectOptions: (obj, h) => Object.entries(obj).map(([k, v]) => `<option value="${k}"${k === h.selected ? " selected" : ""}>${h.localize ? helpers.localize(v) : v}</option>`).join("")
};
function evalExpr(expr, ctx, root, quiet = false) {
  const [head, ...rest] = args(expr);
  if (head in helpers) {
    const pos = [], hash = {};
    for (const a of rest) { const m = a.match(/^(\w+)=(.+)$/); if (m) hash[m[1]] = resolve(m[2], ctx, root); else pos.push(resolve(a, ctx, root)); }
    return helpers[head](...pos, hash);
  }
  const v = resolve(head, ctx, root);
  if (v === undefined && !quiet) problems.push(`не определено: ${head}`);
  return v;
}
function render(nodes, ctx, root) {
  let out = "";
  for (const n of nodes) {
    if (n.t === "text") out += n.v;
    else if (n.t === "raw") out += evalExpr(n.v, ctx, root) ?? "";
    else if (n.t === "var") out += esc(evalExpr(n.v, ctx, root));
    else if (n.t === "block") {
      const v = evalExpr(n.expr, ctx, root, n.name !== "each");
      if (n.name === "if") out += render(truthy(v) ? n.body : n.else, ctx, root);
      else if (n.name === "unless") out += render(truthy(v) ? n.else : n.body, ctx, root);
      else if (n.name === "each") {
        const list = Array.isArray(v) ? v : [];
        if (!list.length) out += render(n.else, ctx, root);
        list.forEach((item, i) => { out += render(n.body, { this: item, index: i }, root); });
      }
    }
  }
  return out;
}
export function renderTemplate(file, context) {
  problems.length = 0;
  const src = fs.readFileSync(path.join(root, file), "utf8");
  const html = render(parse(tokenize(src)), { this: context }, context);
  return { html, problems: [...new Set(problems)] };
}
