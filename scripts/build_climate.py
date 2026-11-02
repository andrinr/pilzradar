"""Bundle dated MeteoSwiss 1 km daily analyses as optional static context.

No replacement of Open-Meteo scores: different windows/precipitation day definitions
need validation first. Complete windows only; no partial sums or gap filling.
"""
import argparse
import base64
import concurrent.futures
import datetime as dt
import hashlib
import json
import urllib.error
import urllib.request
from pathlib import Path
import numpy as np
from netCDF4 import Dataset, num2date
from pack_habitat import write_chunk

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache/environment/climate'
API = 'https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-surface-derived-grid/items/'
VARIABLES = {'rain14': ('RprelimD', 14, 'millimeter', 'sum'),
             'temp7': ('TabsD', 7, 'degree', 'mean'),
             'sunRelative7': ('SrelD', 7, 'percent', 'mean')}

def fetch(url, path):
    if not path.exists():
        tmp = path.with_suffix(path.suffix + '.part')
        with urllib.request.urlopen(url, timeout=90) as response, tmp.open('wb') as target:
            import shutil
            shutil.copyfileobj(response, target)
        tmp.replace(path)
    return path

def item(day):
    key = day.strftime('%Y%m%d') + '-ch'
    return json.loads(fetch(API + key, CACHE / (key + '.json')).read_text())

def read_grid(path, variable, day):
    with Dataset(path) as ds:
        value = ds.variables[variable]
        assert value.units == VARIABLES[next(k for k,v in VARIABLES.items() if v[0] == variable)][2]
        date = num2date(ds.variables['time'][:], ds.variables['time'].units)[0]
        assert (date.year, date.month, date.day) == (day.year, day.month, day.day)
        east, north = np.asarray(ds.variables['E'][:]), np.asarray(ds.variables['N'][:])
        assert np.allclose(np.abs(np.diff(east)), 1000) and np.allclose(np.abs(np.diff(north)), 1000)
        xorder, yorder = np.argsort(east), np.argsort(-north)
        values = np.ma.asarray(value[0])[yorder][:, xorder].astype(np.float32)
        meta = {'origin': [float(east[xorder][0]-500), float(north[yorder][0]+500)],
                'width': len(east), 'height': len(north), 'resolutionMeters': 1000}
        return values, meta

def aggregate(grids, operation):
    values = np.ma.stack(grids)
    # np.ma.sum ignores missing days; explicitly require every day instead.
    missing = np.ma.getmaskarray(values).any(axis=0)
    result = values.sum(axis=0) if operation == 'sum' else values.mean(axis=0)
    return np.ma.array(result, mask=missing | ~np.isfinite(result.filled(np.nan)))

def build(end):
    CACHE.mkdir(parents=True, exist_ok=True)
    # Publication can lag. Select one common end day with all three analyses.
    for lag in range(7):
        candidate = end-dt.timedelta(days=lag)
        try:
            latest = item(candidate)
        except urllib.error.HTTPError as error:
            if error.code == 404: continue
            raise
        if all(any('.'+v[0].lower()+'_' in k.lower() for k in latest['assets']) for v in VARIABLES.values()):
            end = candidate
            break
    else:
        raise RuntimeError('No complete recent MeteoSwiss daily item; retained previous bundle')
    days = [end-dt.timedelta(days=i) for i in range(14)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        items = list(pool.map(item, days))
    jobs = []
    for name, (variable, count, units, operation) in VARIABLES.items():
        for day, record in zip(days[:count], items[:count]):
            matches = [(k,a) for k,a in record['assets'].items() if '.'+variable.lower()+'_' in k.lower()]
            if len(matches) != 1: raise RuntimeError(f'Missing {variable} on {day}; retained previous bundle')
            key, asset = matches[0]
            jobs.append((name, day, asset['href'], CACHE/key))
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        list(pool.map(lambda job: fetch(job[2], job[3]), jobs))
    fields = {}
    sources = []
    for name, (variable, count, units, operation) in VARIABLES.items():
        grids, grid = [], None
        for field, day, url, path in jobs:
            if field != name: continue
            values, meta = read_grid(path, variable, day)
            if grid is not None: assert meta == grid
            grids.append(values); grid = meta
            sources.append({'variable': variable, 'date': str(day), 'url': url,
                            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        value = aggregate(grids, operation)
        encoded = np.full(value.shape, -32768, dtype='<i2')
        valid = ~np.ma.getmaskarray(value)
        rounded = np.rint(value.data[valid]*10)
        assert np.all((rounded > -32768) & (rounded <= 32767))
        encoded[valid] = rounded.astype('<i2')
        fields[name] = {**grid, 'days': count, 'unit': units, 'operation': operation,
                        'values': base64.b64encode(encoded.tobytes()).decode()}
    output = {'version':1, 'endDate': str(end), 'startDate': str(days[-1]),
              'source':'Source: MeteoSwiss', 'url':'https://opendatadocs.meteoswiss.ch/c-climate-data/c3-ground-based-climate-data',
              'quality':'preliminary', 'license':'CC BY 4.0', 'licenseUrl':'https://creativecommons.org/licenses/by/4.0/', 'rainEffectiveResolution':'regional, approximately 20–30 km; not the 1 km grid spacing', 'crs':'EPSG:2056', 'scale':10, 'noData':-32768,
              'rainDay':'06:00–06:00 UTC; source date convention', 'fields':fields, 'sources':sources}
    size = write_chunk('environment/climate', output)
    print(f'MeteoSwiss through {end}: {size:,} script bytes', flush=True)

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--end', type=dt.date.fromisoformat, default=dt.date.today()-dt.timedelta(days=1))
    build(parser.parse_args().end)
