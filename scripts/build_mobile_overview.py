"""Rasterize the existing 100 m overview outlines; detailed geometry stays unchanged.
Requires Pillow. Stores categorical forest IDs, never species scores or observations.
"""
import base64,gzip,json,math
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
def unpack(key):
 s=(ROOT/'data'/f'{key}.js').read_text();return json.loads(gzip.decompress(base64.b64decode(json.loads(s.split('=',1)[1].strip().rstrip(';')))))
def pack(key,data):
 p=ROOT/'data'/f'{key}.js';p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text('window.SHROOMS_PACKED['+json.dumps(key)+']='+json.dumps(base64.b64encode(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0)).decode())+';\n')
def project(p):
 lon,lat=p;s=math.sin(math.radians(lat));return [262144*(lon/360+.5),262144*(.5-math.log((1+s)/(1-s))/(4*math.pi))]
manifest=unpack('overview-forest/index');total=0
for tile in manifest['tiles']:
 features=unpack(tile['coarseKey']);rings=[ring for f in features for poly in f['geometry']['coordinates'] for ring in poly]
 points=[project(p) for ring in rings for p in ring]
 x0=math.floor(min(p[0] for p in points));y0=math.floor(min(p[1] for p in points));w=math.ceil(max(p[0] for p in points))-x0+1;h=math.ceil(max(p[1] for p in points))-y0+1
 image=Image.new('I',(w,h));ids=[]
 for f in features:
  ids.append(f['id']);value=len(ids)
  for poly in f['geometry']['coordinates']:
   mask=Image.new('1',(w,h));draw=ImageDraw.Draw(mask)
   for i,ring in enumerate(poly):draw.polygon([(round(project(p)[0]-x0),round(project(p)[1]-y0)) for p in ring],fill=1 if i==0 else 0)
   image.paste(value,(0,0,w,h),mask)
 runs=[];last=None;count=0
 for value in image.getdata():
  if value==last:count+=1
  else:
   if last is not None:runs.extend([count,last])
   last=value;count=1
 if count:runs.extend([count,last])
 key=tile['coarseKey'].replace('/coarse/','/raster/');tile['rasterKey']=key
 pack(key,{'format':'forest-raster-v1','z':10,'x':x0,'y':y0,'width':w,'height':h,'ids':ids,'runs':runs});total+=(ROOT/'data'/f'{key}.js').stat().st_size
manifest['metadata']['rasterOverview']='Web Mercator zoom 10 categorical mask from existing 100 m simplified forest outlines; full vector detail at zoom 11 and above.'
pack('overview-forest/index',manifest)
print(f'{len(manifest["tiles"])} categorical raster chunks, {total:,} script-envelope bytes')
