"""Fetch the public canopy + topsoil/depth source archives (about 2.1 GB).

Writes only .cache/environment. Atomic downloads; reruns reuse completed files.
No access requests or download workarounds for the restricted host-tree map.
"""
import concurrent.futures
import json
import shutil
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/environment'
WANTED={'SoilMaps_description.xlsx','clay_maps.zip','clay_uncertainty_maps.zip',
        'sand_maps.zip','sand_uncertainty_maps.zip','depth_map.zip','depth_uncertainty_maps.zip'}

def download(item):
    name,url=item;path=CACHE/name
    if not path.exists():
        temp=path.with_suffix(path.suffix+'.part')
        with urllib.request.urlopen(url,timeout=120) as response,temp.open('wb') as target:
            shutil.copyfileobj(response,target)
        temp.replace(path)
    print(f'{name}: {path.stat().st_size:,} bytes',flush=True)

if __name__=='__main__':
    CACHE.mkdir(parents=True,exist_ok=True)
    datasets=json.loads((ROOT/'docs/research/datasets.json').read_text())['datasets']
    jobs=[]
    for dataset in datasets:
        for resource in dataset['resources']:
            if resource['title'] in WANTED:jobs.append((resource['title'],resource['url']))
            if resource['title']=='Sky_view_factor_CH_LI_2024.tif':jobs.append(('sky-view.tif',resource['url']))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(download,jobs))
