"""Bundle the mobile prototype as a single file with offline fonts and artwork."""
import base64
import sys
from pathlib import Path

base = Path(__file__).resolve().parent
assets = base / "assets"

def url(name, asset_type):
    return "data:" + asset_type + ";base64," + base64.b64encode((assets / name).read_bytes()).decode("ascii")

css = "\n".join((base / name).read_text() for name in ("app.css", "rebond.css"))
spec = [("Nunito", 400, "normal", "nunito-regular"), ("Nunito", 900, "normal", "nunito-black"), ("Rivo Sprint", 900, "italic", "sprint"), ("Rivo Digit", 700, "normal", "digit")]
faces = [f'@font-face{{font-family:"{fam}";font-weight:{weight};font-style:{style};src:url("{url(name+".woff","font/woff")}") format("woff");font-display:swap}}' for fam,weight,style,name in spec]
sources = ["illustrations", "brand-art", "model", "screens", "rebond", "app"]
js = "\n".join((base / (name + ".js")).read_text() for name in sources)
for mood in ["focus", "lose", "win"]:
    js = js.replace("POSE_" + mood.upper(), url(mood + ".webp","image/webp"))
for toy in ["wagon", "photo", "trace", "miroir"]:
    js = js.replace("TOY_" + toy.upper(), url(toy + ".webp", "image/webp"))
licenses = "\n".join((assets / file).read_text() for file in ("Nunito-OFL.txt","DejaVu-license.txt")).replace("--","—")
html = (base / "index.template.html").read_text().replace("/* INLINE_STYLE */","\n".join(faces)+"\n"+css).replace("/* INLINE_SCRIPTS */",js).replace("FONT_LICENSE",licenses)
for name in sys.argv[1:]:
    file = Path(name); file.parent.mkdir(parents=True, exist_ok=True); file.write_text(html)
