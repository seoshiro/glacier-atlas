import { describe, expect, it } from 'vitest';
import { contourAt, createTerrain, hash, projectMap, projectTerrain, surveyRing, terrainHeight } from '../src/lib/terrainGeometry';

describe('original illustrative terrain',()=>{
  it('is seeded, finite and nonnegative over the full drawing domain',()=>{
    for(let x=-1.3;x<=1.3;x+=.13)for(let z=-1.3;z<=1.3;z+=.13){
      const value=terrainHeight(x,z);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBe(terrainHeight(x,z));
    }
    expect(hash(1,2)).toBeGreaterThanOrEqual(0);
    expect(hash(1,2)).toBeLessThan(1);
    expect(hash(1,2)).not.toBe(hash(2,1));
  });
  it('projects the summit higher than the same ground point',()=>{
    expect(projectTerrain({x:0,z:0,h:1}).y).toBeLessThan(projectTerrain({x:0,z:0,h:0}).y);
    expect(projectTerrain({x:0,z:0,h:1}).x).toBe(730);
    expect(projectMap(0,0)).toEqual({x:720,y:440});
  });
  it('emits exactly two triangles per grid cell with no invalid coordinates',()=>{
    const geometry=createTerrain(8,6);
    expect(geometry.faces.join('').match(/Z/g)).toHaveLength(8*6*2);
    expect(geometry.faces.join('')).not.toMatch(/NaN|Infinity|undefined/);
    expect(geometry.outline.startsWith('M')).toBe(true);
    expect(geometry.outline.endsWith('Z')).toBe(true);
    expect(geometry).toEqual(createTerrain(8,6));
  });
  it('rejects unbounded and invalid mesh resolutions',()=>{
    for(const resolution of [0,1,101,Infinity,2.5]) expect(()=>createTerrain(resolution,10)).toThrow(RangeError);
  });
  it('contours remain finite, disappear above highest peak, and survey rings close',()=>{
    expect(contourAt(.5,12)).toMatch(/^M/);
    expect(contourAt(.5,12)).not.toMatch(/NaN|Infinity/);
    expect(contourAt(100,12)).toBe('');
    expect(surveyRing(4)).toMatch(/^M.+Z$/);
    expect(surveyRing(4)).toBe(surveyRing(4));
  });
});
