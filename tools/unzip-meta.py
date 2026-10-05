# Extrai um .zip (o guard não libera unzip). uso: python3 tools/unzip-meta.py <zip> <destino>
import sys, zipfile, os

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
with zipfile.ZipFile(src) as z:
    for info in z.infolist():
        z.extract(info, dst)
        print(f"{info.file_size}\t{info.filename}")
