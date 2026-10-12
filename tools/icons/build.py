import json, os, sys, shutil
sys.path.insert(0, os.path.dirname(__file__))
from core import *
from symbols import SY
from items import IT
from portraits import P
from scenes import S
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
OUT=os.path.join(ROOT,"assets","icons")
J=lambda f: json.load(open(os.path.join(ROOT,"data",f+".json"),encoding="utf8"))

ACC={"Гангстер":"#7a3a2a","Вышибала":"#8a5a2a","Лекарь":"#4a6a5a","Оккультист":"#5a4a7a","Шоумен":"#8a3a5a","Сыщик":"#46607f","Взломщик":"#55524a","Водила":"#3f6e70","Наёмник":"#5a6a3a"}
RACE_ACC="#6a6a52"; ORIGIN_ACC="#5a5a44"; NEUTRAL="#7a6a48"
SYM={ # особенность / способность -> символ
 # классы: особенности
 "Люди за спиной":"shadowman","Живая стена":"plate","Врачебная клятва":"cross","Тонкая завеса":"moon","Свет софитов":"spotlight","Намётанный глаз":"eye","Лёгкие руки":"hand","Рука на руле":"wheel","Тихий профессионал":"target",
 # Гангстер
 "Первый выстрел":"bullet","Огонь на подавление":"double","Рука на кобуре":"pistols","Крышевание":"shield","Перекрёстный огонь":"target","Верные люди":"handshake",
 # Вышибала
 "Выкинуть за дверь":"boot","Железный подбородок":"armor","Тяжёлая рука":"fist","Взгляд, от которого стихает зал":"skull","Захват":"hand","Помню каждого":"ledger",
 # Лекарь
 "Зашить на месте":"scalpel","Холодные руки":"snow","Успокоительное":"bottle","Диагноз с порога":"stethoscope","Противоядие":"drop","Вытащить с того света":"pulse",
 # Оккультист
 "Шёпот теней":"ear","Знак сглаза":"eye","Защитный круг":"pentagram","Договор":"document","Порча":"skull","Тёмный взор":"moon",
 # Шоумен
 "Номер с картами":"card","Громкий выход":"curtain","Бис!":"tongue","Двойник":"masks","Аплодисменты":"sparkle","Падающий занавес":"tophat",
 # Сыщик
 "Рабочая версия":"pins","Записи по делу":"notebook","Перекрёстный допрос":"lamp","Картотека":"folder","Нюх на ложь":"mask","Идти по следу":"pawprint",
 # Взломщик
 "Вскрыть любой замок":"lock","По крышам":"road","Продуманный план":"map","Знание рынка":"coins","Тень в ночи":"shadowman","Хитрая ловушка":"gear",
 # Водила
 "Лихач":"bolt","Знаток дорог":"road","Управляемый занос":"skid","Без хвоста":"mirror","Таран":"truck","Король ночных дорог":"crown",
 # Наёмник
 "Один выстрел":"bullet","Дыхание стрелка":"target","Чистая работа":"glasses","Контракт":"document","Эхо войны":"badge","Глаз ястреба":"eye",
 # расы
 "Упорство":"heart","Универсал":"phone","Адская кровь":"flame","Метка":"sparkle","Горный великан":"rock","Крепкая кость":"bone","Острые чувства":"eye","Лёгкий сон":"moon",
 "Кошачья грация":"pawprint","Девять жизней":"heart","Падальщик":"crate","Чутьё на опасность":"ear","Ярость крови":"fist","Звериная выносливость":"heart","Закалка":"glass","Золотые руки":"wrench",
 "Смекалка выживших":"gear","Трусливая хитрость":"boot","Малый рост":"keyhole","Не заметили":"shadowman","Крылья":"bird","Птичий глаз":"eye","Смех гиены":"tongue","Стайный охотник":"pawprint",
 "Дитя глубин":"drop","Голос моря":"wave","Каменный кулак":"fist","Толстая шкура":"armor","Дыхание дракона":"flame","Чешуя":"plate",
 # происхождения
 "Значок в кармане":"badge","Свои в подворотнях":"road","Нужные знакомства":"glass","Портовая братва":"crate","Имя семьи":"crown","Печать Консилума":"pentagram","Дорога дома":"map","Ветеранский круг":"star","Ночные сёстры":"moon","Крыши и подворотни":"boot",
}
TAL={"Железная печень":"glass","Свой в полиции":"badge","Мастер допроса":"lamp","Быстрая рука":"bolt","Дальний прицел":"target","Меткий стрелок":"bullet","Рукопашник":"fist","Двуствольщик":"pistols",
 "Грязный бой":"boot","Крепкий орешек":"heart","Выдержка":"cigarette","Хладнокровие":"snow","Тихая смерть":"knife","Тень в переулке":"shadowman","Фальшивая улыбка":"mask","Широкий круг":"phone",
 "Полиглот улиц":"map","Механик-самоучка":"wrench","Мастер маскировки":"glasses","Сердце на рукаве":"heart","Шестое чувство":"eye","Мёртвая хватка":"hand","Алиби":"clock","Стреляный воробей":"fedora"}

def write(group,name,svg):
    import xml.dom.minidom as X
    X.parseString(svg)  # падаем сразу, если SVG невалиден
    d=os.path.join(OUT,group); os.makedirs(d,exist_ok=True)
    open(os.path.join(d,slug(name)+".svg"),"w",encoding="utf8").write(svg)
    return f"systems/noir-d20/assets/icons/{group}/{slug(name)}.svg"

def run():
    shutil.rmtree(OUT,ignore_errors=True)
    im={}
    for c in J("classes"):
        im[("class",c["name"])]=write("classes",c["name"],portrait(S[c["name"]]))
        for f in [c["trait"],*c["abilities"]]:
            im[("feat",c["name"],f["name"])]=write("features",f"{c['name']}-{f['name']}",emblem(SY[SYM[f["name"]]],ACC[c["name"]]))
    for s in J("species"):
        im[("species",s["name"])]=write("species",s["name"],portrait(P[s["name"]]))
        for t in s["traits"]:
            im[("feat",s["name"],t["name"])]=write("features",f"{s['name']}-{t['name']}",emblem(SY[SYM[t["name"]]],RACE_ACC))
    for b in J("backgrounds"):
        im[("bg",b["name"])]=write("backgrounds",b["name"],portrait(S[b["name"]]))
        im[("feat",b["name"],b["trait"]["name"])]=write("features",f"{b['name']}-{b['trait']['name']}",emblem(SY[SYM[b["trait"]["name"]]],ORIGIN_ACC))
    for t in J("talents"):
        im[("tal",t["name"])]=write("talents",t["name"],emblem(SY[TAL[t["name"]]],NEUTRAL))
    for i in J("items"):
        grp={"weapon":"weapons","armor":"armor","gear":"gear"}[i["type"]]
        im[("item",i["name"])]=write(grp,i["name"],plate(IT[i["name"]]))
    return im

def apply(im):
    def sv(f,d): json.dump(d,open(os.path.join(ROOT,"data",f+".json"),"w",encoding="utf8"),ensure_ascii=False,indent=1)
    cl=J("classes")
    for c in cl:
        c["img"]=im[("class",c["name"])]
        for f in [c["trait"],*c["abilities"]]: f["img"]=im[("feat",c["name"],f["name"])]
    sv("classes",cl)
    sp=J("species")
    for s in sp:
        s["img"]=im[("species",s["name"])]
        for t in s["traits"]: t["img"]=im[("feat",s["name"],t["name"])]
    sv("species",sp)
    bg=J("backgrounds")
    for b in bg:
        b["img"]=im[("bg",b["name"])]; b["trait"]["img"]=im[("feat",b["name"],b["trait"]["name"])]
    sv("backgrounds",bg)
    tl=J("talents")
    for t in tl: t["img"]=im[("tal",t["name"])]
    sv("talents",tl)
    it=J("items")
    for x in it: x["img"]=im[("item",x["name"])]
    sv("items",it)

if __name__=="__main__":
    im=run(); apply(im); print("иконок:",len(im))
