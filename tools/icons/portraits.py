# Портреты рас: «снимки из дела» с узнаваемой внешностью фэнтези-народов. Холст 128×128.
from core import *
SH='<path d="M4 128C4 102 28 92 48 88H80C100 92 124 102 124 128Z" fill="url(#s)"/>'
NECK='<rect x="54" y="76" width="20" height="18" fill="url(#s)"/>'
def rim(op=.3): return f'fill="none" stroke="#d8cdb0" stroke-opacity="{op}" stroke-width="1.4"'
def eyes(y=60,dx=8,c="#eadfc4",w=3.2,h=1.6,o=.95): return f'<ellipse cx="{64-dx}" cy="{y}" rx="{w}" ry="{h}" fill="{c}" opacity="{o}"/><ellipse cx="{64+dx}" cy="{y}" rx="{w}" ry="{h}" fill="{c}" opacity="{o}"/>'
def shade(): return '<ellipse cx="64" cy="64" rx="22" ry="26" fill="#000" opacity=".12" transform="translate(5 4)"/>'
def fedora(y=44,tilt=0):
    return (f'<g transform="rotate({tilt} 64 {y})"><ellipse cx="64" cy="{y}" rx="38" ry="8" fill="#0f0c09"/><path d="M42 {y}Q44 {y-26} 64 {y-28}Q84 {y-26} 86 {y}Z" fill="#1a1510"/>'
            f'<rect x="43" y="{y-10}" width="42" height="6" fill="#3a3027"/><path d="M44 {y-3}H84" stroke="#7a2e27" stroke-width="2"/><ellipse cx="64" cy="{y+3}" rx="24" ry="5" fill="#000" opacity=".5"/></g>')
def collar(): return '<path d="M46 88L64 112L82 88L74 86L64 98L54 86Z" fill="#cdbf9c" opacity=".6"/><path d="M52 90L64 106L76 90" stroke="#0f0c09" stroke-width="1" fill="none"/>'
def tie(): return f'<path d="M62 100H66L69 124L64 128L59 124Z" fill="{RED}" opacity=".9"/>'
def brow(y=56,dx=9,w=9,t=3): return f'<path d="M{64-dx-w//2} {y}H{64-dx+w//2}M{64+dx-w//2} {y}H{64+dx+w//2}" stroke="#0a0806" stroke-width="{t}" stroke-linecap="round"/>'
def whisk(y,l,r,op=.6): return f'<g stroke="#d8cdb0" stroke-opacity="{op}" stroke-width="1.2" stroke-linecap="round"><path d="M{l[0]} {y}L{l[1]} {y-5}M{l[0]} {y+4}L{l[1]} {y+6}M{r[0]} {y}L{r[1]} {y-5}M{r[0]} {y+4}L{r[1]} {y+6}"/></g>'

P={}
P["Человек"]=(SH+NECK+'<ellipse cx="64" cy="62" rx="19" ry="24" fill="url(#s)"/><ellipse cx="64" cy="62" rx="19" ry="24" '+rim()+'/><path d="M58 70Q64 74 70 70" stroke="#0f0c09" stroke-width="1.4" fill="none" opacity=".6"/>'
    +'<path d="M62 62L60 70H66Z" fill="#0f0c09" opacity=".25"/>'+collar()+tie()+fedora(44)+eyes(63)+brow(58))
P["Демон"]=(SH+NECK+'<path d="M46 46Q20 38 22 4Q34 24 54 30Z" fill="url(#s)"/><path d="M82 46Q108 38 106 4Q94 24 74 30Z" fill="url(#s)"/><path d="M46 46Q20 38 22 4" '+rim(.45)+'/><path d="M82 46Q108 38 106 4" '+rim(.45)+'/>'
    +'<ellipse cx="64" cy="62" rx="19" ry="25" fill="url(#s)"/><ellipse cx="64" cy="62" rx="19" ry="25" '+rim()+'/><path d="M46 46Q64 28 82 46Q70 38 64 42Q58 38 46 46Z" fill="#17120d"/>'
    +'<path d="M60 74Q64 80 68 74" stroke="#0f0c09" stroke-width="1.4" fill="none" opacity=".6"/><path d="M96 126Q118 100 108 80" stroke="url(#s)" stroke-width="5" fill="none" stroke-linecap="round"/>'
    +'<circle cx="55" cy="62" r="8" fill="#c0483b" opacity=".28"/><circle cx="73" cy="62" r="8" fill="#c0483b" opacity=".28"/>'+eyes(62,9,"#ee6a52",3.4,1.5,1)+collar())
P["Голиаф"]=('<path d="M0 128C0 100 24 90 44 86H84C104 90 128 100 128 128Z" fill="url(#s)"/><rect x="44" y="72" width="40" height="22" fill="url(#s)"/><ellipse cx="64" cy="52" rx="28" ry="31" fill="url(#s)"/>'
    +'<path d="M38 66Q42 92 64 94Q86 92 90 66Q82 80 64 80Q46 80 38 66Z" fill="#0f0c09" opacity=".35"/><ellipse cx="64" cy="52" rx="28" ry="31" '+rim()+'/>'
    +'<path d="M37 46Q64 36 91 46L91 52Q64 44 37 52Z" fill="#0d0a07"/><g stroke="#d8cdb0" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"><path d="M42 60L48 74M86 60L80 74M64 20V32M52 24L56 34M76 24L72 34"/></g>'
    +eyes(55,12,h=1.3,w=3)+'<path d="M44 90L64 102L84 90" stroke="#d8cdb0" stroke-opacity=".3" fill="none" stroke-width="2"/>')
P["Эльф"]=(SH+NECK+'<path d="M45 58L8 30L40 72Z" fill="url(#s)"/><path d="M83 58L120 30L88 72Z" fill="url(#s)"/><ellipse cx="64" cy="58" rx="16" ry="27" fill="url(#s)"/><ellipse cx="64" cy="58" rx="16" ry="27" '+rim()+'/>'
    +'<path d="M8 30L40 72" '+rim(.4)+'/><path d="M120 30L88 72" '+rim(.4)+'/><path d="M46 38Q64 10 82 38Q70 28 64 32Q56 28 46 38Z" fill="#17120d"/><path d="M48 36Q40 60 46 82M80 36Q88 60 82 82" stroke="#17120d" stroke-width="5" fill="none" stroke-linecap="round"/>'
    +collar()+eyes(58,7,w=3.8,h=1.2)+'<path d="M61 76H67" stroke="#0f0c09" stroke-width="1.2" opacity=".6"/>')
P["Муррены"]=(SH+NECK+'<path d="M42 52L36 14L64 38Z" fill="url(#s)"/><path d="M86 52L92 14L64 38Z" fill="url(#s)"/><path d="M44 46L42 24L58 38Z" fill="#0f0c09" opacity=".45"/><path d="M84 46L86 24L70 38Z" fill="#0f0c09" opacity=".45"/>'
    +'<ellipse cx="64" cy="62" rx="22" ry="21" fill="url(#s)"/><ellipse cx="64" cy="62" rx="22" ry="21" '+rim()+'/><path d="M60 72L68 72L64 77Z" fill="#a86a63"/><path d="M64 77V81M58 83Q64 86 64 81Q64 86 70 83" stroke="#0f0c09" stroke-width="1.4" fill="none"/>'
    +'<path d="M50 50Q54 46 58 50M70 50Q74 46 78 50" stroke="#0f0c09" stroke-width="1.6" fill="none" opacity=".5"/>'+whisk(76,(46,22),(82,106))+'<path d="M52 66L46 62M76 66L82 62" stroke="#0f0c09" stroke-width="1.2" opacity=".4"/>'
    +'<ellipse cx="54" cy="58" rx="4.2" ry="6" fill="#d9c36a"/><ellipse cx="74" cy="58" rx="4.2" ry="6" fill="#d9c36a"/><rect x="53" y="52" width="2" height="12" fill="#0f0c09"/><rect x="73" y="52" width="2" height="12" fill="#0f0c09"/>'
    +'<path d="M46 88Q64 102 82 88L84 98Q64 110 44 98Z" fill="#3a3027"/><path d="M100 128Q124 108 112 86" stroke="url(#s)" stroke-width="6" fill="none" stroke-linecap="round"/>')
P["Раттены"]=(SH+NECK+'<circle cx="34" cy="42" r="17" fill="url(#s)"/><circle cx="94" cy="42" r="17" fill="url(#s)"/><circle cx="34" cy="42" r="10" fill="#a86a63" opacity=".4"/><circle cx="94" cy="42" r="10" fill="#a86a63" opacity=".4"/>'
    +'<circle cx="34" cy="42" r="17" '+rim(.4)+'/><circle cx="94" cy="42" r="17" '+rim(.4)+'/><ellipse cx="64" cy="62" rx="19" ry="20" fill="url(#s)"/><path d="M50 66L64 94L78 66Z" fill="url(#s)"/><path d="M50 66L64 94L78 66" '+rim()+'/>'
    +'<ellipse cx="64" cy="93" rx="4.5" ry="3.5" fill="#c58a82"/><path d="M60 98Q64 102 68 98M64 94V98" stroke="#0f0c09" stroke-width="1.2" fill="none"/><rect x="61" y="96" width="3" height="6" fill="#e8dfc4"/><rect x="64.5" y="96" width="3" height="6" fill="#e8dfc4"/>'
    +whisk(86,(54,20),(74,108),.7)+eyes(58,9,"#eadfc4",2.6,2.6)+'<path d="M96 126Q124 112 112 90" stroke="#a86a63" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>'+'<path d="M46 96L64 108L82 96L84 104Q64 116 44 104Z" fill="#3a3027"/>')
P["Орк"]=(SH+NECK+'<ellipse cx="64" cy="58" rx="25" ry="26" fill="url(#s)"/><path d="M39 62Q42 90 64 94Q86 90 89 62Q80 82 64 82Q48 82 39 62Z" fill="url(#s)"/><ellipse cx="64" cy="58" rx="25" ry="26" '+rim()+'/>'
    +'<path d="M36 52L26 46L36 62Z" fill="url(#s)"/><path d="M92 52L102 46L92 62Z" fill="url(#s)"/><path d="M44 84L40 70L48 80Z" fill="#e8dfc4"/><path d="M84 84L88 70L80 80Z" fill="#e8dfc4"/>'
    +'<path d="M46 76Q64 88 82 76" stroke="#0a0806" stroke-width="2" fill="none"/><path d="M40 44Q64 34 88 44L88 50Q64 42 40 50Z" fill="#0d0a07"/>'
    +'<path d="M58 58L54 70H60M70 58L74 70H68" stroke="#0a0806" stroke-width="1.6" fill="none" opacity=".5"/>'+eyes(55,10,"#d8d08a",3,1.8)+'<path d="M50 28Q64 22 78 28L76 34Q64 30 52 34Z" fill="#17120d"/>'
    +'<path d="M46 90L64 104L82 90" stroke="#d8cdb0" stroke-opacity=".3" fill="none" stroke-width="2"/>')
P["Дворф"]=('<path d="M0 128C0 102 24 92 44 88H84C104 92 128 102 128 128Z" fill="url(#s)"/>'+NECK+'<ellipse cx="64" cy="58" rx="26" ry="22" fill="url(#s)"/>'
    +'<path d="M38 62Q32 108 64 120Q96 108 90 62Q80 84 64 82Q48 84 38 62Z" fill="#17120d"/><path d="M38 62Q32 108 64 120Q96 108 90 62" '+rim(.3)+'/><path d="M50 90Q64 100 78 90M48 100Q64 112 80 100" stroke="#3a3027" stroke-width="1.6" fill="none"/>'
    +'<path d="M40 42H88L92 52H36Z" fill="#17120d"/><ellipse cx="64" cy="42" rx="32" ry="6" fill="#0f0c09"/><path d="M42 42Q44 26 64 26Q84 26 86 42Z" fill="#1b1611"/><circle cx="64" cy="34" r="2.5" fill="#a48a4e"/>'
    +'<path d="M44 54Q54 48 60 54M68 54Q74 48 84 54" stroke="#0a0806" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M60 62L58 72H70L68 62Z" fill="#0f0c09" opacity=".3"/>'+eyes(59,10,h=1.3))
P["Гоблин"]=(SH+NECK+'<path d="M48 64L2 34L6 70L46 78Z" fill="url(#s)"/><path d="M80 64L126 34L122 70L82 78Z" fill="url(#s)"/><path d="M2 34L48 64M126 34L80 64" '+rim(.35)+'/><ellipse cx="64" cy="66" rx="17" ry="20" fill="url(#s)"/><ellipse cx="64" cy="66" rx="17" ry="20" '+rim()+'/>'
    +'<path d="M64 60L76 84H52Z" fill="#0f0c09" opacity=".5"/><path d="M50 86Q64 96 78 86" stroke="#e1d6b8" stroke-width="1.8" fill="none"/><path d="M54 86l2 5M60 89l1 5M67 89l-1 5M74 86l-2 5" stroke="#e1d6b8" stroke-width="1.5"/>'
    +'<path d="M38 52Q64 8 90 52Z" fill="#17120d"/><ellipse cx="64" cy="52" rx="30" ry="5.5" fill="#0f0c09"/><rect x="42" y="42" width="44" height="5" fill="#7a2e27" opacity=".8"/>'+eyes(65,8,"#d8e08a",3.8,2.4)+brow(60,8,8,2.4)+collar())
P["Лилипут"]=('<ellipse cx="64" cy="118" rx="54" ry="4" fill="#000" opacity=".5"/>'
    +'<g><circle cx="98" cy="34" r="19" fill="none" stroke="#d8cdb0" stroke-width="9" opacity=".85"/><rect x="94" y="52" width="9" height="66" fill="#d8cdb0" opacity=".85"/><rect x="84" y="92" width="10" height="7" fill="#d8cdb0" opacity=".85"/><rect x="84" y="104" width="10" height="7" fill="#d8cdb0" opacity=".85"/><circle cx="98" cy="34" r="19" '+rim(.5)+'/></g>'
    +'<g transform="translate(14 54) scale(.5)">'+SH+NECK+'<ellipse cx="64" cy="62" rx="19" ry="24" fill="url(#s)"/>'+collar()+fedora(44)+eyes(63)+'</g>')
P["Авианы"]=(SH+NECK+'<path d="M40 40Q64 -4 88 40Q76 30 64 32Q52 30 40 40Z" fill="url(#s)"/><path d="M44 30L38 12M54 24L52 6M64 22V4M74 24L76 6M84 30L90 12" stroke="url(#s)" stroke-width="5" stroke-linecap="round"/><path d="M44 30L38 12M54 24L52 6M64 22V4M74 24L76 6M84 30L90 12" '+rim(.4)+' stroke-width="1"/>'
    +'<ellipse cx="64" cy="58" rx="18" ry="22" fill="url(#s)"/><ellipse cx="64" cy="58" rx="18" ry="22" '+rim()+'/><path d="M56 62L64 86L72 62Q64 58 56 62Z" fill="#a48a4e"/><path d="M56 62Q64 66 72 62" stroke="#0f0c09" stroke-width="1.4" fill="none"/><path d="M64 62V80" stroke="#0f0c09" stroke-width="1" opacity=".5"/>'
    +'<path d="M20 126Q10 96 34 78M108 126Q118 96 94 78" stroke="url(#s)" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M24 118Q16 98 36 84M104 118Q112 98 92 84" stroke="#d8cdb0" stroke-opacity=".25" stroke-width="2" fill="none"/>'
    +'<circle cx="52" cy="56" r="5" fill="#eadfc4"/><circle cx="76" cy="56" r="5" fill="#eadfc4"/><circle cx="52" cy="56" r="2.2" fill="#0a0806"/><circle cx="76" cy="56" r="2.2" fill="#0a0806"/>'+collar())
P["Гнолл"]=(SH+NECK+'<circle cx="38" cy="38" r="15" fill="url(#s)"/><circle cx="90" cy="38" r="15" fill="url(#s)"/><circle cx="38" cy="38" r="8" fill="#0f0c09" opacity=".45"/><circle cx="90" cy="38" r="8" fill="#0f0c09" opacity=".45"/><circle cx="38" cy="38" r="15" '+rim(.4)+'/><circle cx="90" cy="38" r="15" '+rim(.4)+'/>'
    +'<ellipse cx="64" cy="58" rx="22" ry="22" fill="url(#s)"/><path d="M48 68Q64 104 80 68Q64 78 48 68Z" fill="url(#s)"/><ellipse cx="64" cy="58" rx="22" ry="22" '+rim()+'/>'
    +'<g fill="#0f0c09" opacity=".5"><circle cx="46" cy="52" r="3"/><circle cx="82" cy="52" r="3"/><circle cx="50" cy="42" r="2.4"/><circle cx="78" cy="42" r="2.4"/><circle cx="56" cy="36" r="2"/><circle cx="72" cy="36" r="2"/></g>'
    +'<path d="M54 82Q64 90 74 82" stroke="#0a0806" stroke-width="2" fill="none"/><path d="M56 82l1 5M62 85l1 5M68 85l-1 5M72 82l-1 5" stroke="#e8dfc4" stroke-width="1.6"/><ellipse cx="64" cy="70" rx="5" ry="3.4" fill="#0a0806"/>'
    +'<path d="M28 64L22 80M100 64L106 80" stroke="url(#s)" stroke-width="9" stroke-linecap="round"/><path d="M42 20Q64 6 86 20Q64 12 42 20Z" fill="#17120d"/>'+eyes(56,9,"#d9b86a",3.2,2.2)+collar())
P["Тритон"]=(SH+NECK+'<path d="M44 52L16 38L22 66L42 70Z" fill="url(#s)"/><path d="M84 52L112 38L106 66L86 70Z" fill="url(#s)"/><g stroke="#d8cdb0" stroke-opacity=".4" stroke-width="1"><path d="M16 38L22 66M26 42L28 66M36 48L34 68M112 38L106 66M102 42L100 66M92 48L94 68"/></g>'
    +'<ellipse cx="64" cy="58" rx="19" ry="25" fill="url(#s)"/><path d="M46 38Q64 22 82 38L64 26Z" fill="url(#s)"/><path d="M52 32L64 8L76 32Z" fill="url(#s)" opacity=".9"/><path d="M64 8V30M58 20L64 12L70 20" '+rim(.4)+' stroke-width="1"/>'
    +'<ellipse cx="64" cy="58" rx="19" ry="25" '+rim()+'/><g fill="none" stroke="#d8cdb0" stroke-opacity=".28" stroke-width="1"><path d="M52 72Q58 78 64 72Q70 78 76 72M50 80Q58 86 64 80Q70 86 78 80"/></g>'
    +'<path d="M50 88L56 96M58 88L62 98M70 88L66 98M78 88L72 96" stroke="#0a0806" stroke-width="1.6" opacity=".5"/><ellipse cx="55" cy="58" rx="4.5" ry="5" fill="#cfe0d8" opacity=".9"/><ellipse cx="73" cy="58" rx="4.5" ry="5" fill="#cfe0d8" opacity=".9"/><circle cx="55" cy="58" r="2" fill="#0a0806"/><circle cx="73" cy="58" r="2" fill="#0a0806"/>'+collar())
P["Огр"]=('<path d="M0 128C0 98 22 88 42 84H86C106 88 128 98 128 128Z" fill="url(#s)"/><rect x="42" y="68" width="44" height="26" fill="url(#s)"/><ellipse cx="64" cy="50" rx="30" ry="30" fill="url(#s)"/>'
    +'<path d="M34 62Q38 96 64 100Q90 96 94 62Q84 84 64 84Q44 84 34 62Z" fill="url(#s)"/><ellipse cx="64" cy="50" rx="30" ry="30" '+rim()+'/><path d="M34 62Q38 96 64 100Q90 96 94 62" '+rim()+'/>'
    +'<path d="M36 40Q64 28 92 40L92 48Q64 38 36 48Z" fill="#0d0a07"/><path d="M60 52L56 68H72L68 52Z" fill="#0f0c09" opacity=".35"/><path d="M50 84L46 96L54 88Z M78 84L82 96L74 88Z" fill="#e8dfc4"/><path d="M48 80Q64 90 80 80" stroke="#0a0806" stroke-width="2.4" fill="none"/>'
    +'<circle cx="34" cy="52" r="6" fill="url(#s)"/><circle cx="94" cy="52" r="6" fill="url(#s)"/><circle cx="64" cy="73" r="3" fill="none" stroke="#a48a4e" stroke-width="2"/>'+eyes(50,12,"#cfc07a",2.6,2.2)+'<path d="M30 24L36 34M98 24L92 34" stroke="#d8cdb0" stroke-opacity=".3" stroke-width="2"/>')
P["Драконид"]=(SH+NECK+'<path d="M46 40Q22 36 16 8Q34 20 52 30Z" fill="url(#s)"/><path d="M82 40Q106 36 112 8Q94 20 76 30Z" fill="url(#s)"/><path d="M46 40Q22 36 16 8" '+rim(.45)+'/><path d="M82 40Q106 36 112 8" '+rim(.45)+'/>'
    +'<path d="M64 14L58 30M64 14L70 30" '+rim(.4)+'/><path d="M46 52Q64 28 82 52L80 84Q64 100 48 84Z" fill="url(#s)"/><path d="M46 52Q64 28 82 52L80 84Q64 100 48 84Z" '+rim()+'/>'
    +'<g fill="none" stroke="#d8cdb0" stroke-opacity=".3" stroke-width="1"><path d="M52 48Q58 52 64 48Q70 52 76 48M50 58Q58 62 64 58Q70 62 78 58M52 68Q58 72 64 68Q70 72 76 68"/></g>'
    +'<path d="M58 84L64 90L70 84M60 76H68" stroke="#0a0806" stroke-width="1.6" fill="none" opacity=".6"/><ellipse cx="55" cy="58" rx="3.6" ry="4.6" fill="#e0a23a"/><ellipse cx="73" cy="58" rx="3.6" ry="4.6" fill="#e0a23a"/><rect x="54" y="54" width="2" height="9" fill="#0a0806"/><rect x="72" y="54" width="2" height="9" fill="#0a0806"/>'
    +'<path d="M100 128Q126 106 114 80" stroke="url(#s)" stroke-width="7" fill="none" stroke-linecap="round"/>'+collar())
