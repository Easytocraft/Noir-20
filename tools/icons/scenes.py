# Виньетки «сущности»: классы и происхождения как сцены в духе нуара (силуэты, свет, дым). Холст 128×128.
from core import *
SIL="#0b0907"; RIMC="#cbbf9f"
DEFS=('<defs><radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f3e3ae" stop-opacity=".9"/><stop offset=".5" stop-color="#e0c98a" stop-opacity=".35"/><stop offset="1" stop-color="#e0c98a" stop-opacity="0"/></radialGradient>'
      '<linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbbf9f" stop-opacity="0"/><stop offset="1" stop-color="#cbbf9f" stop-opacity=".22"/></linearGradient>'
      '<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e3ae" stop-opacity=".55"/><stop offset="1" stop-color="#f3e3ae" stop-opacity=".05"/></linearGradient>'
      '<linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3228"/><stop offset="1" stop-color="#17130f"/></linearGradient></defs>')
def glow(cx,cy,r): return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#gl)"/>'
def fog(): return '<rect y="92" width="128" height="36" fill="url(#fg)"/>'
def moon(cx,cy,r): return f'<circle cx="{cx}" cy="{cy}" r="{r*1.8}" fill="url(#gl)" opacity=".6"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="#e6dcc0"/><circle cx="{cx-r*.3}" cy="{cy-r*.2}" r="{r*.25}" fill="#b9ac88" opacity=".6"/>'
def rain(n=18,seed=3):
    import random; r=random.Random(seed); out=""
    for _ in range(n):
        x=r.randint(0,128); y=r.randint(0,110); out+=f'<path d="M{x} {y}l-3 9" stroke="#e6dcc0" stroke-opacity=".28" stroke-width="1"/>'
    return out
def lamp(x,y,h=64): return f'{glow(x,y,26)}<path d="M{x} {y+2}V{y+h}" stroke="{SIL}" stroke-width="3"/><path d="M{x-6} {y+2}H{x+6}L{x+4} {y-3}H{x-4}Z" fill="{SIL}"/><circle cx="{x}" cy="{y}" r="3" fill="#fff4cf"/>'
def stars(seed=5,n=14):
    import random; r=random.Random(seed); return "".join(f'<circle cx="{r.randint(4,124)}" cy="{r.randint(4,60)}" r="{r.choice([.6,.8,1.1])}" fill="#e6dcc0" opacity=".7"/>' for _ in range(n))
def skyline(y=100,seed=2,lit=True):
    import random; r=random.Random(seed); out=""; x=0
    while x<128:
        w=r.randint(10,18); h=r.randint(22,56); out+=f'<rect x="{x}" y="{y-h}" width="{w}" height="{h+30}" fill="#14110d" stroke="{RIMC}" stroke-opacity=".12"/>'
        if lit:
            for _ in range(r.randint(2,5)):
                wx=x+r.randint(2,max(3,w-4)); wy=y-h+r.randint(4,max(5,h-6)); out+=f'<rect x="{wx}" y="{wy}" width="2.4" height="3" fill="#f0dca0" opacity="{r.choice([.5,.8,.9])}"/>'
        x+=w
    return out

HAT={"fedora":'<ellipse cx="0" cy="-80" rx="13" ry="3" fill="{c}"/><path d="M-8 -80Q-8 -93 0 -93Q8 -93 8 -80Z" fill="{c}"/><rect x="-8" y="-84" width="16" height="2" fill="#7a2e27" opacity=".8"/>',
     "cap":'<path d="M-8 -80Q0 -91 8 -80Z" fill="{c}"/><rect x="2" y="-82" width="10" height="2.4" fill="{c}"/>',
     "top":'<ellipse cx="0" cy="-81" rx="11" ry="2.4" fill="{c}"/><rect x="-7" y="-98" width="14" height="17" fill="{c}"/><rect x="-7" y="-86" width="14" height="2.6" fill="#7a2e27" opacity=".8"/>',
     "none":'',
     "hood":'<path d="M-11 -66Q-12 -92 0 -94Q12 -92 11 -66Z" fill="{c}"/>',
     "peak":'<path d="M-9 -81Q0 -92 9 -81Z" fill="{c}"/><rect x="-10" y="-82" width="20" height="3" fill="{c}"/><circle cx="0" cy="-85" r="1.8" fill="#d8cdb0"/>',
     "helmet":'<path d="M-10 -78Q-10 -92 0 -92Q10 -92 10 -78Q14 -76 15 -75L-15 -75Q-14 -76 -10 -78Z" fill="{c}"/>',
     "beret":'<ellipse cx="1" cy="-83" rx="11" ry="4" fill="{c}"/><circle cx="1" cy="-87" r="1.4" fill="{c}"/>',
     "witch":'<ellipse cx="0" cy="-81" rx="14" ry="2.6" fill="{c}"/><path d="M-7 -81L0 -108L7 -81Z" fill="{c}"/>'}
def man(hat="fedora",x=64,y=124,s=1.0,flip=1,extra="",wide=1.0,col=SIL):
    h=HAT[hat].format(c=col)
    body=(f'<path d="M-8 0V-28H8V0Z" fill="{col}"/><path d="M{-16*wide} -66Q0 -73 {16*wide} -66L{21*wide} -24H{-21*wide}Z" fill="{col}"/><circle cx="0" cy="-76" r="7" fill="{col}"/>{h}'
          f'<path d="M{-16*wide} -66Q0 -73 {16*wide} -66" fill="none" stroke="{RIMC}" stroke-opacity=".4" stroke-width="1"/><path d="M{16*wide} -66L{21*wide} -24" fill="none" stroke="{RIMC}" stroke-opacity=".28" stroke-width="1"/>{extra}')
    return f'<g transform="translate({x} {y}) scale({s*flip} {s})">{body}</g>'
def car(x,y,s=1,flip=1):
    return (f'<g transform="translate({x} {y}) scale({s*flip} {s})"><path d="M-34 0V-12L-26 -24Q-14 -32 6 -32L22 -24L36 -20V0Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".22"/>'
            f'<path d="M-20 -22L-12 -28H4L14 -22Z" fill="#2a241d"/><circle cx="-20" cy="0" r="8" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><circle cx="22" cy="0" r="8" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><circle cx="36" cy="-12" r="3" fill="#fff4cf"/></g>')

S={}
# ---------------- КЛАССЫ ----------------
tommy='<g transform="rotate(-22 4 -44)"><rect x="-6" y="-48" width="34" height="5" fill="{c}"/><circle cx="2" cy="-38" r="6" fill="{c}"/><rect x="22" y="-50" width="12" height="3" fill="{c}"/></g><circle cx="4" cy="-72" r="1.6" fill="#ff7a4a"/>'.format(c=SIL)
S["Гангстер"]=DEFS+skyline(96,4)+glow(104,32,30)+car(96,108,.9,-1)+fog()+man("fedora",44,126,1.15,1,tommy)
S["Вышибала"]=DEFS+'<rect x="72" y="22" width="48" height="88" fill="url(#wl)" stroke="#cbbf9f" stroke-opacity=".3"/>'+glow(96,70,40)+f'<rect x="76" y="12" width="40" height="12" fill="none" stroke="#c0483b" stroke-width="2"/><path d="M82 18H110" stroke="#c0483b" stroke-width="2" stroke-dasharray="6 3"/>'+fog()\
    +f'<g transform="translate(44 126) scale(1.2)"><path d="M-30 -62Q0 -72 30 -62L28 -24H-28Z" fill="{SIL}"/><path d="M-8 0V-28H-2V0ZM2 0V-28H8V0Z" fill="{SIL}"/><circle cx="0" cy="-74" r="8" fill="{SIL}"/><path d="M-9 -78Q0 -88 9 -78Z" fill="{SIL}"/><path d="M-26 -52Q0 -40 26 -52" fill="none" stroke="{RIMC}" stroke-opacity=".5" stroke-width="2"/><path d="M-30 -62Q0 -72 30 -62" fill="none" stroke="{RIMC}" stroke-opacity=".4"/></g>'
S["Лекарь"]=DEFS+glow(24,34,34)+f'<path d="M24 8V30" stroke="{SIL}" stroke-width="1.6"/><rect x="19" y="30" width="10" height="14" rx="2" fill="#2a241d" stroke="{RIMC}" stroke-opacity=".5"/><rect x="21" y="33" width="6" height="8" fill="#fff4cf" opacity=".85"/>'+fog()\
    +man("cap",70,126,1.15,1,f'<circle cx="-3" cy="-76" r="2.6" fill="none" stroke="{RIMC}" stroke-width="1"/><circle cx="3" cy="-76" r="2.6" fill="none" stroke="{RIMC}" stroke-width="1"/><g transform="translate(18 -26)"><path d="M-12 -8H12L10 10H-10Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".5"/><path d="M-5 -8Q0 -16 5 -8" fill="none" stroke="{RIMC}" stroke-width="1.6"/><path d="M0 -4V8M-4 2H4" stroke="#c0483b" stroke-width="2.2"/></g>')
S["Оккультист"]=DEFS+stars(7,10)+moon(98,26,11)+'<ellipse cx="64" cy="112" rx="40" ry="9" fill="none" stroke="#d8cdb0" stroke-opacity=".5" stroke-width="1.4"/><path d="M64 103L78 117L50 109H78L50 117Z" fill="none" stroke="#c0483b" stroke-opacity=".7" stroke-width="1"/>'+glow(64,66,30)+fog()\
    +f'<g transform="translate(64 120) scale(1.2)"><path d="M-22 0Q-18 -50 -8 -66Q0 -74 8 -66Q18 -50 22 0Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".35"/><path d="M-12 -66Q-13 -92 0 -94Q13 -92 12 -66Z" fill="{SIL}"/><ellipse cx="0" cy="-74" rx="5" ry="6" fill="#1c1813"/><circle cx="-2" cy="-75" r="1" fill="#e0664f"/><circle cx="2" cy="-75" r="1" fill="#e0664f"/><rect x="14" y="-52" width="3" height="12" fill="#e6dcc0"/><path d="M15.5 -52C12 -58 16 -60 15.5 -64C19 -60 19 -56 15.5 -52Z" fill="#ffd27a"/></g>'
S["Шоумен"]=DEFS+'<path d="M64 0L36 104H92Z" fill="url(#cone)"/><path d="M0 0H26L18 128H0Z" fill="#1a1512" stroke="#cbbf9f" stroke-opacity=".2"/><path d="M128 0H102L110 128H128Z" fill="#1a1512" stroke="#cbbf9f" stroke-opacity=".2"/><ellipse cx="64" cy="112" rx="34" ry="8" fill="#d8cdb0" opacity=".28"/>'\
    +man("top",64,122,1.0,1,f'<path d="M-6 -66L-12 -24" stroke="{SIL}" stroke-width="2"/><path d="M14 -48L26 -22" stroke="{SIL}" stroke-width="2"/><circle cx="26" cy="-22" r="2.4" fill="#d8cdb0"/><path d="M-14 -44L-24 -20H-6Z" fill="{SIL}"/>')
S["Сыщик"]=DEFS+rain(26,9)+lamp(98,22,70)+skyline(100,3,False)+fog()\
    +man("fedora",52,126,1.2,1,f'<circle cx="26" cy="-50" r="9" fill="none" stroke="{RIMC}" stroke-width="2"/><path d="M32 -44L40 -34" stroke="{RIMC}" stroke-width="2.4"/><path d="M12 -48L22 -50" stroke="{SIL}" stroke-width="3"/><path d="M-16 -62L-16 -30" stroke="#cbbf9f" stroke-opacity=".3"/>')
S["Взломщик"]=DEFS+stars(2,12)+moon(98,30,13)+f'<path d="M0 98H128V128H0Z" fill="{SIL}"/><rect x="14" y="76" width="12" height="24" fill="{SIL}"/><path d="M0 98H128" stroke="{RIMC}" stroke-opacity=".3"/>'\
    +f'<g transform="translate(60 98) scale(1.2)"><path d="M-18 0Q-22 -22 -10 -34Q-2 -40 6 -36L16 -28Q22 -14 18 0Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".35"/><circle cx="12" cy="-36" r="7" fill="{SIL}"/><path d="M6 -40Q12 -46 18 -40Z" fill="{SIL}"/><path d="M18 -26L30 -18" stroke="{SIL}" stroke-width="3"/><path d="M30 -18l6 -2M30 -18l6 3" stroke="{RIMC}" stroke-width="1.6"/><circle cx="14" cy="-37" r="1.1" fill="#f0dca0"/></g>'
S["Водила"]=DEFS+'<path d="M64 60L8 128H120Z" fill="url(#cone)" opacity=".7"/><path d="M62 70L60 128M66 70L68 128" stroke="#cbbf9f" stroke-opacity=".35" stroke-dasharray="6 5"/>'+glow(36,88,22)+glow(92,88,22)\
    +f'<path d="M20 100Q22 80 40 74H88Q106 80 108 100V112H20Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><path d="M36 76L42 58Q64 50 86 58L92 76Z" fill="#241f19"/><circle cx="36" cy="90" r="8" fill="#fff4cf"/><circle cx="92" cy="90" r="8" fill="#fff4cf"/><path d="M48 96H80M48 102H80M48 108H80" stroke="{RIMC}" stroke-opacity=".5" stroke-width="1.4"/>'\
    +f'<path d="M56 74Q56 62 64 62Q72 62 72 74Z" fill="{SIL}"/><circle cx="64" cy="58" r="5" fill="{SIL}"/><path d="M58 54Q64 48 70 54Z" fill="{SIL}"/>'
S["Наёмник"]=DEFS+skyline(88,6,True)+glow(104,24,20)+f'<path d="M0 100H128V128H0Z" fill="{SIL}"/><path d="M0 100H128" stroke="{RIMC}" stroke-opacity=".3"/>'\
    +f'<g transform="translate(34 100)"><path d="M0 0Q4 -12 16 -12L40 -8L40 0Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".35"/><circle cx="12" cy="-18" r="6" fill="{SIL}"/><path d="M6 -22Q12 -28 18 -22Z" fill="{SIL}"/><path d="M26 -8L88 -16" stroke="{SIL}" stroke-width="3.4"/><rect x="42" y="-24" width="14" height="4" fill="{SIL}"/><circle cx="92" cy="-16" r="2" fill="#ff7a4a"/></g><circle cx="106" cy="40" r="14" fill="none" stroke="#c0483b" stroke-opacity=".6"/><path d="M106 22V58M88 40H124" stroke="#c0483b" stroke-opacity=".5"/>'
# ---------------- ПРОИСХОЖДЕНИЯ ----------------
bust=lambda hat,y=88: f'<path d="M14 128Q14 104 36 96L64 {y}L92 96Q114 104 114 128Z" fill="{SIL}"/><rect x="56" y="78" width="16" height="16" fill="{SIL}"/><ellipse cx="64" cy="64" rx="17" ry="21" fill="#1c1813"/>'
S["Правопорядок"]=DEFS+lamp(104,18,70)+rain(14,4)+bust("peak")+f'<g transform="translate(64 126) scale(1.0)">{HAT["peak"].format(c=SIL).replace("-81","-78")}</g>'.replace("translate(64 126)","translate(64 130)")\
    +f'<path d="M48 100L64 116L80 100" fill="none" stroke="{RIMC}" stroke-opacity=".4"/><path d="M56 100H72L70 112H58Z" fill="#a48a4e" opacity=".9"/><path d="M64 102L66 107L71 108L67 111L68 116L64 113L60 116L61 111L57 108L62 107Z" fill="{SIL}"/><circle cx="58" cy="62" r="1.6" fill="#eadfc4"/><circle cx="70" cy="62" r="1.6" fill="#eadfc4"/>'
S["Трущобы"]=DEFS+f'<rect x="0" y="0" width="52" height="128" fill="#15110d" stroke="{RIMC}" stroke-opacity=".15"/>'+"".join(f'<rect x="{6+c*14}" y="{10+r*20}" width="8" height="11" fill="{"#f0dca0" if (r*3+c)%4==1 else "#2a241d"}" opacity=".9"/>' for r in range(5) for c in range(3))\
    +f'<path d="M52 36L120 28" stroke="{SIL}" stroke-width="1.4"/><path d="M62 35l-2 12h8l-1 -12ZM84 33l-3 16h9l-1-16ZM104 30l-2 11h7l-1-11Z" fill="#cbbf9f" opacity=".55"/>'+fog()\
    +man("cap",96,126,.62,1,'')+f'<rect x="76" y="108" width="12" height="16" fill="{SIL}"/><path d="M0 128V112L52 116V128Z" fill="{SIL}"/>'
S["Богема"]=DEFS+glow(100,48,30)+f'<path d="M92 70Q108 50 120 52L120 78Q108 74 92 76Z" fill="#a48a4e" opacity=".9"/><path d="M92 76H108V96H92Z" fill="{SIL}"/><path d="M100 96V110M92 112H108" stroke="{SIL}" stroke-width="3"/>'+bust("beret")\
    +f'<g transform="translate(40 130)">{HAT["beret"].format(c=SIL)}</g>'.replace("translate(40 130)","translate(62 142)")+'<path d="M72 74L96 66" stroke="#d8cdb0" stroke-width="2"/><circle cx="96" cy="66" r="1.6" fill="#ff7a4a"/><path d="M98 62Q108 50 100 40Q94 34 104 24" stroke="#d8cdb0" stroke-opacity=".5" fill="none"/><circle cx="58" cy="62" r="1.6" fill="#eadfc4"/><circle cx="70" cy="62" r="1.6" fill="#eadfc4"/>'
S["Докарь"]=DEFS+moon(104,20,9)+f'<path d="M20 100V16H70" stroke="{SIL}" stroke-width="5" fill="none"/><path d="M20 100V16H70" stroke="{RIMC}" stroke-opacity=".3" stroke-width="1" fill="none"/><path d="M62 16V56" stroke="{SIL}" stroke-width="1.4"/><path d="M62 56q-5 4 0 8" stroke="{SIL}" stroke-width="2" fill="none"/><path d="M0 100H128V128H0Z" fill="#14110d"/><path d="M0 108Q16 104 32 108T64 108T96 108T128 108" stroke="{RIMC}" stroke-opacity=".3" fill="none"/>'\
    +f'<rect x="78" y="82" width="22" height="18" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><rect x="100" y="86" width="18" height="14" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><rect x="84" y="66" width="18" height="16" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><path d="M78 91H100M84 74H102" stroke="{RIMC}" stroke-opacity=".25"/>'+fog()\
    +man("cap",44,106,.95,1,f'<path d="M14 -60L26 -46" stroke="{SIL}" stroke-width="2.6"/><path d="M26 -46q4 -2 3 4" stroke="{RIMC}" stroke-width="2" fill="none"/>')
S["Мафиози"]=DEFS+glow(112,84,22)+car(96,104,1.0,-1)+rain(10,8)+fog()\
    +man("fedora",44,126,1.25,1,f'<path d="M-12 -68L-6 -52L0 -68L6 -52L12 -68" fill="#d8cdb0" opacity=".55"/><path d="M0 -72L8 -70" stroke="#d8cdb0" stroke-width="2"/><circle cx="9" cy="-70" r="1.8" fill="#ff7a4a"/><path d="M10 -70Q16 -80 10 -88" stroke="#d8cdb0" stroke-opacity=".5" fill="none"/>',1.15)
S["Консилум"]=DEFS+glow(64,34,34)+f'<circle cx="64" cy="34" r="18" fill="none" stroke="#e6dcc0" stroke-width="2"/><path d="M52 34Q64 22 76 34Q64 46 52 34Z" fill="none" stroke="#e6dcc0" stroke-width="1.8"/><circle cx="64" cy="34" r="4" fill="#e6dcc0"/><path d="M64 12V4M64 56V64M42 34H34M86 34H94" stroke="#e6dcc0" stroke-width="1.6"/>'+f'<path d="M0 100H128V128H0Z" fill="#14110d"/><rect x="26" y="96" width="76" height="8" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><rect x="60" y="86" width="3" height="10" fill="#e6dcc0"/><path d="M61.5 86C58 80 62 79 61.5 74C65 79 65 82 61.5 86Z" fill="#ffd27a"/>'\
    +"".join(man("hood",x,100,s,1) for x,s in ((28,.9),(64,1.0),(100,.9)))+fog()
S["Кочевник"]=DEFS+stars(9,16)+f'<path d="M0 104H128V128H0Z" fill="{SIL}"/><g transform="translate(30 104)"><path d="M-22 0V-18Q-22 -36 0 -38Q22 -36 22 -18V0Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".3"/><circle cx="-12" cy="2" r="8" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".4"/><circle cx="14" cy="2" r="8" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".4"/><path d="M22 -6L40 -2" stroke="{SIL}" stroke-width="2"/></g>'+glow(86,104,26)\
    +f'<path d="M78 112L86 96L94 112Z" fill="#ffb454"/><path d="M82 112L86 102L90 112Z" fill="#fff0b0"/><path d="M86 94Q90 84 84 76" stroke="#d8cdb0" stroke-opacity=".4" fill="none"/>'+man("fedora",112,120,.7,-1,f'<path d="M10 -62L20 -90" stroke="{SIL}" stroke-width="2"/><circle cx="20" cy="-92" r="4" fill="{SIL}"/>')+fog()
S["Армейский солдат"]=DEFS+'<g stroke="#cbbf9f" stroke-opacity=".45" stroke-width="1.2" fill="none"><path d="M0 100Q32 84 64 96T128 88M0 112Q32 96 64 108T128 100"/><path d="M14 90l4 8M34 88l-4 9M54 92l4 8M76 94l-4 9M96 90l4 8M116 88l-4 9"/></g>'+bust("helmet")\
    +f'<path d="M30 74Q64 54 98 74L100 78Q64 60 28 78Z" fill="{SIL}"/><path d="M34 76Q64 38 94 76Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".4"/><path d="M26 77Q64 66 102 77" stroke="{RIMC}" stroke-opacity=".5" fill="none"/><path d="M48 100L64 120L80 100" fill="none" stroke="{RIMC}" stroke-opacity=".4"/><circle cx="56" cy="104" r="4" fill="#a48a4e"/><path d="M56 108V118" stroke="#7a2e27" stroke-width="3"/><circle cx="58" cy="82" r="1.6" fill="#eadfc4"/><circle cx="70" cy="82" r="1.6" fill="#eadfc4"/>'
S["Шабаш"]=DEFS+moon(64,30,16)+f'<path d="M0 104H128V128H0Z" fill="{SIL}"/><ellipse cx="64" cy="104" rx="14" ry="5" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".4"/><path d="M52 104Q52 118 64 118Q76 118 76 104Z" fill="{SIL}" stroke="{RIMC}" stroke-opacity=".4"/>'+glow(64,100,22)+f'<path d="M60 100Q56 90 62 84Q64 92 68 88Q70 94 66 100Z" fill="#d8e0a0" opacity=".8"/>'\
    +man("witch",26,118,.95,1)+man("witch",102,118,.95,-1)+man("witch",64,90,.55,1)+'<path d="M16 50l6 -4l6 4l-3 -6M100 40l5 -4l5 4l-3 -5" fill="none" stroke="#0b0907" stroke-width="2"/>'+fog()
S["Шпана"]=DEFS+moon(100,24,11)+f'<path d="M0 88H128V128H0Z" fill="#17130f"/>'+"".join(f'<path d="M0 {92+r*10}H128" stroke="{RIMC}" stroke-opacity=".18"/>' for r in range(4))+"".join(f'<path d="M{(r%2)*12+c*24} {92+r*10}V{102+r*10}" stroke="{RIMC}" stroke-opacity=".15"/>' for r in range(3) for c in range(6))\
    +f'<rect x="10" y="62" width="14" height="28" fill="{SIL}"/><path d="M0 88H128" stroke="{RIMC}" stroke-opacity=".4"/>'\
    +f'<g transform="translate(68 88)"><path d="M-10 0L-10 -22L10 -22L10 0Z" fill="{SIL}"/><circle cx="0" cy="-30" r="7" fill="{SIL}"/>{HAT["cap"].format(c=SIL).replace("-80","-33").replace("-82","-35").replace("-91","-44").replace("-90","-43")}<path d="M10 -16L24 -8L24 6M-10 -4L-14 10L-14 24" stroke="{SIL}" stroke-width="5" fill="none"/><path d="M14 -34L28 -42M14 -34L26 -26" stroke="{RIMC}" stroke-width="1.6"/><circle cx="24" cy="-34" r="1.4" fill="#d8cdb0"/></g>'+fog()
