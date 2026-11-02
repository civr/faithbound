"""Downloads free CC0 scanned textures from Poly Haven into assets/scanned (same as fetch_textures.ps1).
Run from the project folder: python tools/fetch_textures.py"""
import json, os, urllib.request
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets', 'scanned'); os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'Faithbound-texture-fetch/1.0'}
RES = '2k'
WANT = {'grass': ['aerial_grass', 'grass_path', 'forest_grass', 'grass'], 'forest': ['forest_leaves', 'forrest_ground', 'forest_ground', 'leaves'],
        'sand': ['coast_sand', 'sand'], 'dirt': ['brown_mud', 'dirt', 'mud'], 'path': ['gravel_road', 'dirt_road', 'gravel', 'rocky_trail'],
        'rock': ['rock_face', 'cliff', 'rocky_terrain', 'rock'], 'snow': ['snow'], 'thatch': ['thatch', 'straw', 'hay'],
        'timber': ['weathered_planks', 'wood_planks', 'planks'], 'plaster': ['plastered', 'plaster', 'white_wall'], 'bark': ['bark']}
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r: return r.read()
ids = list(json.loads(get('https://api.polyhaven.com/assets?t=textures')).keys())
for layer, words in WANT.items():
    pick = next((i for w in words for i in ids if w in i), None)
    if not pick: print(f'  {layer}: nothing found, keeping the built-in texture'); continue
    files = json.loads(get(f'https://api.polyhaven.com/files/{pick}'))
    try: diff = files['Diffuse'][RES]['jpg']['url']
    except KeyError: print(f'  {layer}: {pick} has no diffuse map, skipped'); continue
    open(os.path.join(OUT, f'{layer}_albedo.jpg'), 'wb').write(get(diff))
    try: open(os.path.join(OUT, f'{layer}_normal.jpg'), 'wb').write(get(files['nor_gl'][RES]['jpg']['url']))
    except KeyError: pass
    print(f'  {layer}: {pick}')
print('Done. Open the project in Godot; it imports the new textures and uses them.')
