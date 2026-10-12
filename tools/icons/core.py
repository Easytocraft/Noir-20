# Общие кирпичики для генерации иконок: палитра, подложки, транслитерация.
import math
INK="#1f1913"; INK2="#4a3f31"; RED="#7a2e27"; CREAM="#d8cdb0"; CREAM2="#b9ac88"; BRASS="#a48a4e"
S=f'fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
S3=f'fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'
F=f'fill="{INK}"'; R=f'fill="{RED}"'; RS=f'fill="none" stroke="{RED}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
PAPER=f'fill="{CREAM}"'

TR=dict(zip("абвгдежзийклмнопрстуфхцчшщъыьэюя",["a","b","v","g","d","e","zh","z","i","y","k","l","m","n","o","p","r","s","t","u","f","h","c","ch","sh","sch","","y","","e","yu","ya"]))
def slug(name):
    out=""
    for ch in name.lower().replace("ё","e"):
        out+=TR.get(ch, ch if ch.isalnum() else "-")
    while "--" in out: out=out.replace("--","-")
    return out.strip("-")

import re
def dedupe(svg):
    """Убирает повторяющиеся атрибуты в одном теге (остаётся последний): так можно дописывать stroke-width после общего стиля."""
    def fix(m):
        tag=m.group(0)
        pairs=re.findall(r'([\w:-]+)="([^"]*)"',tag)
        seen={}
        for k,v in pairs: seen[k]=v
        if len(seen)==len(pairs): return tag
        name=re.match(r'<([\w:-]+)',tag).group(1); end="/>" if tag.endswith("/>") else ">"
        return f'<{name} '+" ".join(f'{k}="{v}"' for k,v in seen.items())+end
    return re.sub(r'<[a-zA-Z][^>]*>',fix,svg)

HEAD='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">'
def grain(op=.45):
    return ('<defs><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>'
            '<feColorMatrix values="0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .1  0 0 0 .38 0"/></filter></defs>'
            f'<rect width="128" height="128" rx="10" filter="url(#g)" opacity="{op}"/>')

def emblem(symbol, accent="#46607f", badge=None, ring=True):
    symbol=dedupe(symbol)
    b=""
    if badge is not None:
        b=(f'<rect x="88" y="94" width="30" height="24" rx="3" fill="{INK}"/><rect x="90" y="96" width="26" height="20" rx="2" fill="none" stroke="{CREAM}" stroke-opacity=".5"/>'
           f'<text x="103" y="111" text-anchor="middle" font-family="Courier New, monospace" font-weight="bold" font-size="15" fill="{CREAM}">{badge}</text>')
    rg=f'<circle cx="64" cy="62" r="45" fill="{accent}" fill-opacity=".12" stroke="{accent}" stroke-opacity=".55" stroke-width="2"/>' if ring else ""
    return (HEAD+'<defs><radialGradient id="p" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="#e6dcc2"/><stop offset="1" stop-color="#bcae88"/></radialGradient></defs>'
            '<rect width="128" height="128" rx="10" fill="url(#p)"/>'+grain()+
            f'<rect x="5" y="5" width="118" height="118" rx="6" fill="none" stroke="{INK}" stroke-opacity=".55" stroke-width="1.5"/>'
            f'<rect x="9" y="9" width="110" height="110" rx="4" fill="none" stroke="{accent}" stroke-opacity=".6" stroke-width="1"/>'
            +rg+f'<g transform="translate(25 23) scale(.78)">{symbol}</g>'+b+'</svg>')

def plate(item):
    item=dedupe(item)
    """Предмет: кремовый силуэт на тёмной «улике-фотографии»."""
    return (HEAD+'<defs><radialGradient id="d" cx="40%" cy="30%" r="90%"><stop offset="0" stop-color="#4a3f31"/><stop offset="1" stop-color="#14100c"/></radialGradient>'
            '<linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2e9ce"/><stop offset=".45" stop-color="#d8cdb0"/><stop offset="1" stop-color="#8f8466"/></linearGradient>'
            '<linearGradient id="m2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfc29c"/><stop offset="1" stop-color="#6f6650"/></linearGradient>'
            '<radialGradient id="lt" cx="30%" cy="22%" r="60%"><stop offset="0" stop-color="#f3e3ae" stop-opacity=".35"/><stop offset="1" stop-color="#f3e3ae" stop-opacity="0"/></radialGradient>'
            '<pattern id="b" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><rect width="14" height="4" fill="#fff" opacity=".05"/></pattern></defs>'
            '<rect width="128" height="128" rx="10" fill="url(#d)"/><rect width="128" height="128" rx="10" fill="url(#b)"/><rect width="128" height="128" rx="10" fill="url(#lt)"/>'+grain(.3)+
            f'<rect x="5" y="5" width="118" height="118" rx="6" fill="none" stroke="{CREAM}" stroke-opacity=".28" stroke-width="1.2"/>'
            '<ellipse cx="66" cy="108" rx="40" ry="5" fill="#000" opacity=".4"/>'
            f'<g transform="translate(14 12) scale(1)" stroke-linejoin="round" stroke-linecap="round">{item}</g></svg>')

def portrait(body):
    body=dedupe(body)
    return (HEAD+'<defs><radialGradient id="d" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="#5a4f40"/><stop offset=".55" stop-color="#241e18"/><stop offset="1" stop-color="#0d0a08"/></radialGradient>'
            '<linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a7060"/><stop offset="1" stop-color="#26211b"/></linearGradient>'
            '<pattern id="b" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><rect width="14" height="4" fill="#fff" opacity=".06"/></pattern></defs>'
            '<rect width="128" height="128" rx="10" fill="url(#d)"/><rect width="128" height="128" rx="10" fill="url(#b)"/>'+body+grain(.3)+
            f'<rect x="5" y="5" width="118" height="118" rx="6" fill="none" stroke="{CREAM}" stroke-opacity=".3" stroke-width="1.2"/></svg>')

def cog(cx,cy,r1,r2,n):
    pts=[]
    for i in range(n*2):
        a=math.pi*2*i/(n*2)-math.pi/2; r=r2 if i%2==0 else r1
        for da in (-.12,.12):
            pass
        pts.append((cx+r*math.cos(a-.11),cy+r*math.sin(a-.11))); pts.append((cx+r*math.cos(a+.11),cy+r*math.sin(a+.11)))
    return "M"+" L".join(f"{x:.1f} {y:.1f}" for x,y in pts)+" Z"
