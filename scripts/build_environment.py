"""Pack optional WSL canopy and soil context for selected cells, at 50 m support.

Canopy: forest-weighted mean of native 5 m pixels, summer/winter separate.
Soil: native 25 m pixel at each 50 m cell centre, including original 90% PI.
No new score weights, interpolation or assumed host classes.
"""
import base64
import contextlib
import hashlib
import json
import zipfile
from pathlib import Path
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.vrt import WarpedVRT
from rasterio.windows import Window
from pack_habitat import write_chunk

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache/environment'
SIZE, RES, MISSING = 128, 50, 65535
SOIL = [
 ('clay', 'clay_maps/clay_0_5.tif'), ('clayLow','clay_uncertainty_maps/clay_0_5_low05.tif'), ('clayHigh','clay_uncertainty_maps/clay_0_5_up95.tif'),
 ('sand','sand_maps/sand_0_5.tif'), ('sandLow','sand_uncertainty_maps/sand_0_5_low05.tif'), ('sandHigh','sand_uncertainty_maps/sand_0_5_up95.tif'),
 ('depth','depth_map/depth.tif'), ('depthLow','depth_uncertainty_maps/depth_low05.tif'), ('depthHigh','depth_uncertainty_maps/depth_up95.tif')]
CHANNELS = ['skySummer','skyWinter','skyCoverage']+[k for k,p in SOIL]

def sample_window(src, xs, ys):
    cols = np.floor((xs-src.transform.c)/src.res[0]).astype(int)
    rows = np.floor((src.transform.f-ys)/src.res[1]).astype(int)
    c0,c1,r0,r1 = cols.min(),cols.max()+1,rows.min(),rows.max()+1
    values = src.read(1,window=Window(c0,r0,c1-c0,r1-r0),boundless=True,masked=True)
    return values[(rows-r0)[:,None],(cols-c0)[None,:]]

def encode(values, mask):
    result = np.full(values.shape, MISSING, dtype='<u2')
    valid = ~np.ma.getmaskarray(values) & mask & np.isfinite(values.data)
    scaled = np.rint(values.data[valid].astype(np.float64)*10)
    assert np.all((scaled >= 0) & (scaled < MISSING))
    result[valid] = scaled.astype('<u2')
    return result

def canopy_mean(values, forest):
    # values shape = 50 m tile height/width × ten 5 m samples per dimension.
    h,w=forest.shape
    mask = ~np.ma.getmaskarray(values) & np.repeat(np.repeat(forest,5,axis=0),5,axis=1)
    totals = np.where(mask,values.data,0).reshape(h//2,10,w//2,10).sum(axis=(1,3))
    count = mask.reshape(h//2,10,w//2,10).sum(axis=(1,3))
    expected = forest.reshape(h//2,2,w//2,2).sum(axis=(1,3))*25
    average = np.divide(totals,count,out=np.zeros_like(totals,dtype=float),where=count>0)
    coverage = np.divide(count*100,expected,out=np.zeros_like(totals,dtype=float),where=expected>0)
    return np.ma.array(average,mask=count==0),np.ma.array(coverage,mask=expected==0)

def build():
    # Source archive members are selected explicitly; no archive paths are extracted.
    for _, name in SOIL:
        file = CACHE/name
        if file.exists(): continue
        folder = name.split('/')[0]
        archive = CACHE/(folder+'.zip')
        if folder == 'depth_map': archive=CACHE/'depth_map.zip'
        with zipfile.ZipFile(archive) as z:
            file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(z.read(name))
    tiles=[];bytes_total=0
    with contextlib.ExitStack() as stack:
        forest=stack.enter_context(rasterio.open(ROOT/'.cache/tlm3d-forest25.tif'))
        sky=stack.enter_context(rasterio.open(CACHE/'sky-view.tif'))
        soils=[stack.enter_context(rasterio.open(CACHE/name)) for _,name in SOIL]
        assert sky.descriptions == ('svf_hemi_summer','svf_hemi_winter') and sky.res==(5,5)
        assert forest.crs.to_epsg()==2056 and forest.res==(25,25)
        assert all(s.crs.to_epsg()==2056 and s.res==(25,25) for s in soils)
        width,height=forest.width//2,forest.height//2
        origin=[forest.transform.c,forest.transform.f]
        vrt=stack.enter_context(WarpedVRT(sky,crs=forest.crs,transform=from_origin(*origin,5,5),width=width*10,height=height*10))
        for row in range(0,height,SIZE):
            for col in range(0,width,SIZE):
                h,w=min(SIZE,height-row),min(SIZE,width-col)
                f=forest.read(1,window=Window(col*2,row*2,w*2,h*2)).astype(bool)
                active=f.reshape(h,2,w,2).any(axis=(1,3))
                if not active.any():continue
                packed=np.full((SIZE,SIZE,len(CHANNELS)),MISSING,dtype='<u2')
                coverage=[]
                for band in [1,2]:
                    values=vrt.read(band,window=Window(col*10,row*10,w*10,h*10),masked=True)
                    valid=values.compressed()
                    assert np.all((valid>=0)&(valid<=100))
                    mean,cov=canopy_mean(values,f)
                    packed[:h,:w,band-1]=encode(mean,active);coverage.append(cov)
                packed[:h,:w,2]=encode(np.ma.minimum(*coverage),active)
                xs=origin[0]+(col+np.arange(w)+.5)*RES
                ys=origin[1]-(row+np.arange(h)+.5)*RES
                for i,src in enumerate(soils):packed[:h,:w,i+3]=encode(sample_window(src,xs,ys),active)
                # Soil intervals are retained verbatim, not invented at aggregate support.
                for i in [3,6,9]:
                    a,b,c=[packed[:h,:w,k] for k in [i,i+1,i+2]]
                    valid=(a!=MISSING)&(b!=MISSING)&(c!=MISSING)
                    assert np.all(b[valid]<=a[valid]) and np.all(a[valid]<=c[valid])
                key=f'environment/tiles/{row//SIZE}-{col//SIZE}'
                bytes_total+=write_chunk(key,{'values':base64.b64encode(packed.tobytes()).decode()})
                tiles.append(key)
            if row%(SIZE*8)==0: print(f'Environment row {row}/{height}; {len(tiles)} tiles',flush=True)
    source_urls={}
    for dataset in json.loads((ROOT/'docs/research/datasets.json').read_text())['datasets']:
        for resource in dataset['resources']:
            source_urls['sky-view.tif' if resource['title']=='Sky_view_factor_CH_LI_2024.tif' else resource['title']]=resource['url']
    files=['sky-view.tif']+sorted(set(name.split('/')[0]+'.zip' for _,name in SOIL))
    meta={'version':1,'crs':'EPSG:2056','origin':origin,'width':width,'height':height,
          'resolutionMeters':RES,'tileSize':SIZE,'channels':CHANNELS,'scale':10,'noData':MISSING,'tiles':tiles,
          'canopy':{'sourceResolutionMeters':5,'reference':'NFI VHM 2024; acquisition years vary','aggregation':'forest-weighted mean','citation':'Bischof, Ginzler, Marty & Zellweger (2026), EnviDat, doi:10.16904/envidat.744','url':'https://www.envidat.ch/metadata/switzerland-wide-maps-of-sky-view-factor-canopy-openness-in-forests-at-5-m-resol','license':'CC BY 4.0'},
          'soil':{'sourceResolutionMeters':25,'topsoilDepthCm':[0,5],'predictionInterval':90,'sampling':'cell-centre native pixel','depthDefinition':'minimal expected soil depth','url':'https://doi.org/10.16904/envidat.484','license':'CC BY-SA 4.0'},
          'hostTrees':{'status':'access-required','url':'https://doi.org/10.16904/envidat.506'},
          'sources':[{'file':file,'url':source_urls[file],'sha256':hashlib.sha256((CACHE/file).read_bytes()).hexdigest()} for file in files]}
    # The canopy landing URL is used rather than assigning an unverified DOI.
    meta['canopy']['url']='https://www.envidat.ch/metadata/switzerland-wide-maps-of-sky-view-factor-canopy-openness-in-forests-at-5-m-resol'
    write_chunk('environment/index',meta)
    print(f'{len(tiles)} environment tiles; {bytes_total:,} script bytes',flush=True)

if __name__=='__main__':build()
