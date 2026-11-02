"""Compare 20 deterministic distributed packed cells against cached native rasters.

Offline verification after data:environment. Does not download anything.
"""
import base64
import contextlib
import gzip
import json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from build_environment import SOIL
from build_climate import aggregate

ROOT=Path(__file__).resolve().parents[1]

def unpack(key):
    text=(ROOT/'data'/f'{key}.js').read_text()
    return json.loads(gzip.decompress(base64.b64decode(json.loads(text.split('=',1)[1].strip().rstrip(';')))))

def check():
    meta=unpack('environment/index');checked=0
    with contextlib.ExitStack() as stack:
        sky=stack.enter_context(rasterio.open(ROOT/'.cache/environment/sky-view.tif'))
        forest=stack.enter_context(rasterio.open(ROOT/'.cache/tlm3d-forest25.tif'))
        soils=[stack.enter_context(rasterio.open(ROOT/'.cache/environment'/p)) for _,p in SOIL]
        for key in meta['tiles'][::max(1,len(meta['tiles'])//20)]:
            tile=np.frombuffer(base64.b64decode(unpack(key)['values']),dtype='<u2').reshape(meta['tileSize'],meta['tileSize'],-1)
            valid=np.argwhere((tile[:,:,0]!=65535)&(tile[:,:,3]!=65535))
            if len(valid)==0:continue
            row,col=valid[len(valid)//2];tr,tc=map(int,key.split('/')[-1].split('-'))
            x=meta['origin'][0]+(tc*128+col+.5)*50;y=meta['origin'][1]-(tr*128+row+.5)*50
            stored=tile[row,col].astype(float)/10
            for channel,src in enumerate(soils,start=3):
                original=next(src.sample([(x,y)],masked=True))[0]
                if np.ma.is_masked(original):assert tile[row,col,channel]==65535
                else:assert abs(stored[channel]-float(original))<=.051,(key,channel)
            mask=forest.read(1,window=from_bounds(x-25,y-25,x+25,y+25,forest.transform),boundless=True).astype(bool)
            fine=np.repeat(np.repeat(mask,5,axis=0),5,axis=1)
            coverage=[]
            for band in [1,2]:
                values=sky.read(band,window=from_bounds(x-25,y-25,x+25,y+25,sky.transform),boundless=True,masked=True)
                valid=fine&~np.ma.getmaskarray(values)
                if valid.any():assert abs(stored[band-1]-float(values.data[valid].mean()))<=.051
                else:assert tile[row,col,band-1]==65535
                coverage.append(100*valid.sum()/fine.sum())
            assert abs(stored[2]-min(coverage))<=.051
            checked+=1
    assert checked>=15
    # A missing day must never silently turn a 14-day total into a 13-day sum.
    a=np.ma.array([[1.,2.]],mask=[[False,False]])
    b=np.ma.array([[3.,4.]],mask=[[False,True]])
    summed=aggregate([a,b],'sum');assert summed[0,0]==4 and summed.mask[0,1]
    mean=aggregate([a,b],'mean');assert mean[0,0]==2 and mean.mask[0,1]
    print(f'{checked} packed cells match native canopy/soil rasters; incomplete climate windows stay missing')

if __name__=='__main__':check()
