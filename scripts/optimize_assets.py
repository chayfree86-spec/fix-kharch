import os
from PIL import Image

pub_dir = r"c:\web-project\htdocs\fix-kharch\public"

targets = {
    "darkbg-logo-header.png": (600, 180),
    "light-logo-header.png": (600, 180),
    "websplash-dark.png": (512, 512),
    "websplash-transparent.png": (512, 512),
    "websplash.png": (512, 512),
    "websplash-dark-transparent.png": (512, 512),
    "pwa-icon-dark.png": (512, 512),
    "pwa-icon-dark-1.png": (512, 512),
}

for fname, (max_w, max_h) in targets.items():
    path = os.path.join(pub_dir, fname)
    if not os.path.exists(path):
        continue
    orig_size = os.path.getsize(path)
    im = Image.open(path).convert("RGBA")
    
    # Resize with high quality Lanczos filter
    im.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    
    # Quantize using FASTOCTREE (method=2) for RGBA transparency
    quantized = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    quantized.save(path, "PNG", optimize=True)
    
    new_size = os.path.getsize(path)
    print(f"Optimized {fname}: {orig_size//1024}KB -> {new_size//1024}KB ({((orig_size-new_size)/orig_size)*100:.1f}% saved)")
