/** Original deterministic terrain. Values are illustrative, never geographic data. */
export type Point3 = { x: number; z: number; h: number };
export type ProjectedPoint = { x: number; y: number };
export type TerrainGeometry = { faces: string[]; contourPaths: string[]; outline: string };

const TAU = Math.PI * 2;
const PEAKS = [
  [-0.49, -0.18, 1.16, 2.2, 2.8],
  [0.05, -0.38, 1.7, 3.4, 2.5],
  [0.59, -0.29, 1.32, 3.0, 3.8],
  [0.47, 0.37, 0.85, 2.7, 3.2],
  [-0.67, 0.55, 0.82, 2.6, 3.9],
] as const;

export function hash(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx) * (1 - sy)
    + (hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx) * sy;
}

export function terrainHeight(x: number, z: number): number {
  let mountain = 0;
  for (const [px, pz, height, spreadX, spreadZ] of PEAKS) {
    const dx = (x - px) * spreadX, dz = (z - pz) * spreadZ;
    mountain = Math.max(mountain, height * Math.exp(-Math.sqrt(dx * dx + dz * dz) * 1.52));
  }
  const noise = (smoothNoise(x * 10 + 17, z * 10 + 21) - 0.5) * 0.2
    + (smoothNoise(x * 23 + 18, z * 23 + 31) - 0.5) * 0.065;
  const folds = Math.abs(Math.sin(x * 18 + z * 11 + smoothNoise(x * 3, z * 3) * 8)) * 0.07;
  const edge = Math.min(1, Math.max(0, (1.24 - Math.max(Math.abs(x), Math.abs(z))) * 5));
  return Math.max(0.012, (mountain + noise * Math.min(1, mountain * 2) + folds) * edge);
}

export function projectTerrain(point: Point3): ProjectedPoint {
  return { x: 730 + (point.x - point.z) * 510, y: 553 + (point.x + point.z) * 144 - point.h * 225 };
}

export function projectMap(x: number, z: number): ProjectedPoint {
  return { x: 720 + x * 565, y: 440 + z * 305 };
}

function coordinate(point: ProjectedPoint): string {
  return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
}

/** Marching squares with independent contour segments; no self-intersecting fills. */
export function contourAt(level: number, samples = 44): string {
  return createContours([level], samples)[0];
}

function createContours(levels: number[], samples: number): string[] {
  const size = 2.22 / samples;
  // Height samples are shared across every contour, avoiding repeated noise work.
  const grid = Array.from({length:samples+1},(_,z)=>Array.from({length:samples+1},(_,x)=>terrainHeight(-1.11+x*size,-1.11+z*size)));
  return levels.map(level=>{
  const segments: string[] = [];
  for (let z = 0; z < samples; z++) {
    for (let x = 0; x < samples; x++) {
      const px = -1.11 + x * size, pz = -1.11 + z * size;
      const corners = [{x:px,z:pz},{x:px+size,z:pz},{x:px+size,z:pz+size},{x:px,z:pz+size}];
      const heights = [grid[z][x],grid[z][x+1],grid[z+1][x+1],grid[z+1][x]];
      const intersections: ProjectedPoint[] = [];
      for (let edge = 0; edge < 4; edge++) {
        const next = (edge + 1) % 4;
        if ((heights[edge] >= level) !== (heights[next] >= level)) {
          const t = (level - heights[edge]) / (heights[next] - heights[edge]);
          intersections.push(projectMap(corners[edge].x + t * (corners[next].x - corners[edge].x), corners[edge].z + t * (corners[next].z - corners[edge].z)));
        }
      }
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        segments.push(`M${coordinate(intersections[i])}L${coordinate(intersections[i + 1])}`);
      }
    }
  }
  return segments.join('');
  });
}

export function createTerrain(columns = 48, rows = 40): TerrainGeometry {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2 || columns > 100 || rows > 100) {
    throw new RangeError('Terrain resolution must be an integer between 2 and 100.');
  }
  const faces = Array.from({length: 18}, () => '');
  const points: Point3[][] = [];
  for (let z = 0; z <= rows; z++) {
    points[z] = [];
    for (let x = 0; x <= columns; x++) {
      const px = -1.22 + x / columns * 2.44 + (x > 0 && x < columns ? (hash(x, z) - 0.5) * 0.025 : 0);
      const pz = -1.22 + z / rows * 2.44 + (z > 0 && z < rows ? (hash(z, x + 20) - 0.5) * 0.025 : 0);
      points[z][x] = {x:px,z:pz,h:terrainHeight(px,pz)};
    }
  }
  // Back to front. Adjacent triangles share vertices; all detail is original geometry.
  for (let diagonal = 0; diagonal < rows + columns - 1; diagonal++) {
    for (let z = 0; z < rows; z++) {
      const x = diagonal - z;
      if (x < 0 || x >= columns) continue;
      const a = points[z][x], b = points[z][x + 1], c = points[z + 1][x], d = points[z + 1][x + 1];
      const triangles = (x + z) % 2 ? [[a,b,c],[b,d,c]] : [[a,b,d],[a,d,c]];
      for (const triangle of triangles) {
        const [p,q,r] = triangle;
        const dx = q.x-p.x, dz = q.z-p.z, dh = q.h-p.h;
        const ex = r.x-p.x, ez = r.z-p.z, eh = r.h-p.h;
        let nx = dz*eh-dh*ez, ny = dh*ex-dx*eh, nz = dx*ez-dz*ex;
        const length = Math.hypot(nx,ny,nz) || 1;
        if (ny < 0) { nx=-nx; ny=-ny; nz=-nz; }
        const light = Math.max(0, Math.min(1, (nx * -0.62 + ny * 0.71 + nz * -0.33) / length * 0.72 + 0.3));
        const elevation = (p.h + q.h + r.h) / 3;
        const snow = elevation > 0.47 && ny / length > 0.18;
        const shade = snow ? 8 + Math.round(light * 9) : Math.round(light * 7);
        faces[shade] += `M${triangle.map(point => coordinate(projectTerrain(point))).join('L')}Z`;
      }
    }
  }
  const edge: Point3[] = [...points[0], ...points.slice(1).map(row=>row[columns]), ...points[rows].slice(0,-1).reverse(), ...points.slice(1,-1).reverse().map(row=>row[0])];
  return {faces, contourPaths:createContours(Array.from({length:17},(_,i)=>0.08+i*0.085),44),outline:`M${edge.map(p=>coordinate(projectTerrain(p))).join('L')}Z`};
}

/** Irregular survey contours for background ornament; closed, finite, seeded. */
export function surveyRing(index: number): string {
  const points: string[] = [];
  for (let step=0;step<=96;step++) {
    const angle = step / 96 * TAU;
    const radius = 1 + Math.sin(angle*3+index*.17)*.08 + Math.cos(angle*5-index*.13)*.04;
    points.push(`${(740+Math.cos(angle)*(120+index*30)*radius).toFixed(1)},${(405+Math.sin(angle)*(68+index*18)*radius).toFixed(1)}`);
  }
  return `M${points.join('L')}Z`;
}
