import {
  AddEquation,
  BufferGeometry,
  Camera,
  CustomBlending,
  Float32BufferAttribute,
  Matrix4,
  OneFactor,
  OneMinusSrcAlphaFactor,
  Points,
  Scene,
  ShaderMaterial,
  Uniform,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  Map as MapLibreMap,
} from "maplibre-gl";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const MS_PER_DAY = 86_400_000;
const DAYS_PER_CENTURY = 36525;

/* ─────────────────────────────────────────────────────────────
 * NASA JPL orbital elements (valid 1800–2050 AD)
 * https://ssd.jpl.nasa.gov/planets/approx_pos.html
 *
 * a  = semi-major axis (AU)
 * e  = eccentricity
 * I  = inclination (deg)
 * L  = mean longitude (deg)
 * wbar = longitude of perihelion (deg)
 * O  = longitude of ascending node (deg)
 *
 * Each has a value at J2000.0 and a rate per Julian century.
 * ───────────────────────────────────────────────────────────── */

interface OrbElem {
  a: number; da: number;
  e: number; de: number;
  I: number; dI: number;
  L: number; dL: number;
  wbar: number; dwbar: number;
  O: number; dO: number;
}

interface PlanetDef {
  name: string;
  elem: OrbElem;
  /** Equatorial radius (km) */
  radiusKm: number;
  /** Sidereal rotation period (Earth days, negative = retrograde) */
  rotationDays: number;
  /** Mean orbital speed (km/s) */
  orbitalSpeedKmS: number;
  /** Visual display color */
  color: [number, number, number];
  /** Base point size on screen */
  baseSize: number;
}

const PLANETS: PlanetDef[] = [
  {
    name: "Mercury",
    elem: { a: 0.38709927, da: 0.00000037, e: 0.20563593, de: 0.00001906,
            I: 7.00497902, dI: -0.00594749, L: 252.25032350, dL: 149472.67411175,
            wbar: 77.45779628, dwbar: 0.16047689, O: 48.33076593, dO: -0.12534081 },
    radiusKm: 2439.7, rotationDays: 58.646, orbitalSpeedKmS: 47.87,
    color: [0.78, 0.74, 0.69], baseSize: 8,
  },
  {
    name: "Venus",
    elem: { a: 0.72333566, da: 0.00000390, e: 0.00677672, de: -0.00004107,
            I: 3.39467605, dI: -0.00078890, L: 181.97909950, dL: 58517.81538729,
            wbar: 131.60246718, dwbar: 0.00268329, O: 76.67984255, dO: -0.27769418 },
    radiusKm: 6051.8, rotationDays: -243.025, orbitalSpeedKmS: 35.02,
    color: [0.95, 0.86, 0.55], baseSize: 14,
  },
  {
    name: "Mars",
    elem: { a: 1.52371034, da: 0.00001847, e: 0.09339410, de: 0.00007882,
            I: 1.84969142, dI: -0.00813131, L: -4.55343205, dL: 19140.30268499,
            wbar: -23.94362959, dwbar: 0.44441088, O: 49.55953891, dO: -0.29257343 },
    radiusKm: 3389.5, rotationDays: 1.026, orbitalSpeedKmS: 24.077,
    color: [0.88, 0.45, 0.28], baseSize: 10,
  },
  {
    name: "Jupiter",
    elem: { a: 5.20288700, da: -0.00011607, e: 0.04838624, de: -0.00013253,
            I: 1.30439695, dI: -0.00183714, L: 34.39644051, dL: 3034.74612775,
            wbar: 14.72847983, dwbar: 0.21252668, O: 100.47390909, dO: 0.20469106 },
    radiusKm: 69911, rotationDays: 0.4135, orbitalSpeedKmS: 13.07,
    color: [0.91, 0.79, 0.56], baseSize: 18,
  },
  {
    name: "Saturn",
    elem: { a: 9.53667594, da: -0.00125060, e: 0.05386179, de: -0.00050991,
            I: 2.48599187, dI: 0.00193609, L: 49.95424423, dL: 1222.49362201,
            wbar: 92.59887831, dwbar: -0.41897216, O: 113.66242448, dO: -0.28867794 },
    radiusKm: 58232, rotationDays: 0.444, orbitalSpeedKmS: 9.69,
    color: [0.94, 0.87, 0.62], baseSize: 14,
  },
  {
    name: "Uranus",
    elem: { a: 19.18916464, da: -0.00196176, e: 0.04725744, de: -0.00004397,
            I: 0.77263783, dI: -0.00242939, L: 313.23810451, dL: 428.48202785,
            wbar: 170.95427630, dwbar: 0.40805281, O: 74.01692503, dO: 0.04240589 },
    radiusKm: 25362, rotationDays: -0.7183, orbitalSpeedKmS: 6.81,
    color: [0.60, 0.82, 0.88], baseSize: 10,
  },
  {
    name: "Neptune",
    elem: { a: 30.06992276, da: 0.00026291, e: 0.00859048, de: 0.00005105,
            I: 1.77004347, dI: -0.00033060, L: -55.12002969, dL: 218.45945325,
            wbar: 44.96476227, dwbar: -0.32241464, O: 131.78422574, dO: -0.00508664 },
    radiusKm: 24622, rotationDays: 0.6713, orbitalSpeedKmS: 5.43,
    color: [0.40, 0.50, 0.85], baseSize: 8,
  },
];

const EARTH_ELEM: OrbElem = {
  a: 1.00000261, da: 0.00000562, e: 0.01671123, de: -0.00004392,
  I: -0.00001531, dI: -0.01294668, L: 100.46457166, dL: 35999.37244981,
  wbar: 102.93768193, dwbar: 0.32327364, O: 0, dO: 0,
};

/** Normalize angle to [0, 360). */
function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Greenwich Mean Sidereal Time in degrees.
 * Tells us which meridian faces the vernal equinox right now,
 * which is key for mapping celestial RA to Earth longitude.
 */
export function gmst(dateMs: number = Date.now()): number {
  const D = (dateMs - J2000_MS) / MS_PER_DAY;
  return mod360(280.46061837 + 360.98564736629 * D);
}

/**
 * Compute the subsolar point — the spot on Earth where the Sun is directly overhead.
 * Returns { lat, lng } in degrees. This determines the correct Earth illumination.
 */
export function subsolarPoint(dateMs: number = Date.now()): { lat: number; lng: number } {
  const T = (dateMs - J2000_MS) / (MS_PER_DAY * DAYS_PER_CENTURY);
  const sun = sunPosition(T);
  const siderealDeg = gmst(dateMs);
  const lng = mod360(sun.ra - siderealDeg + 180) - 180;
  return { lat: sun.dec, lng };
}


/** Solve Kepler's equation M = E - e·sin(E) via Newton-Raphson. */
function solveKepler(Mrad: number, e: number): number {
  let E = Mrad + e * Math.sin(Mrad);
  for (let i = 0; i < 20; i++) {
    const dE = (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/** Heliocentric ecliptic XYZ (AU) from orbital elements at time T (centuries from J2000). */
function helioEcliptic(el: OrbElem, T: number): [number, number, number] {
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const I = (el.I + el.dI * T) * DEG2RAD;
  const L = mod360(el.L + el.dL * T);
  const wbar = mod360(el.wbar + el.dwbar * T);
  const O = (el.O + el.dO * T) * DEG2RAD;

  const w = (wbar - el.O - el.dO * T) * DEG2RAD; // argument of perihelion
  const M = mod360(L - wbar) * DEG2RAD;           // mean anomaly

  const E = solveKepler(M, e);

  // Position in orbital plane
  const xPrime = a * (Math.cos(E) - e);
  const yPrime = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate to ecliptic coordinates
  const cosO = Math.cos(O), sinO = Math.sin(O);
  const cosI = Math.cos(I), sinI = Math.sin(I);
  const cosW = Math.cos(w), sinW = Math.sin(w);

  const x = (cosO * cosW - sinO * sinW * cosI) * xPrime +
            (-cosO * sinW - sinO * cosW * cosI) * yPrime;
  const y = (sinO * cosW + cosO * sinW * cosI) * xPrime +
            (-sinO * sinW + cosO * cosW * cosI) * yPrime;
  const z = (sinW * sinI) * xPrime + (cosW * sinI) * yPrime;

  return [x, y, z];
}

/** Convert ecliptic XYZ to equatorial RA (deg) and Dec (deg). */
function eclipticToEquatorial(x: number, y: number, z: number, T: number): { ra: number; dec: number } {
  const eps = (23.439291 - 0.0130042 * T) * DEG2RAD;
  const cosE = Math.cos(eps), sinE = Math.sin(eps);

  const xEq = x;
  const yEq = y * cosE - z * sinE;
  const zEq = y * sinE + z * cosE;

  const ra = mod360(Math.atan2(yEq, xEq) * RAD2DEG);
  const dec = Math.asin(zEq / Math.sqrt(xEq * xEq + yEq * yEq + zEq * zEq)) * RAD2DEG;

  return { ra, dec };
}

/**
 * Simplified Moon position (geocentric ecliptic, then to RA/Dec).
 * Based on Jean Meeus, "Astronomical Algorithms".
 */
function moonPosition(T: number): { ra: number; dec: number; distKm: number } {
  const D = T * DAYS_PER_CENTURY;

  const Lm = mod360(218.3165 + 13.176396 * D);
  const Mm = mod360(134.9634 + 13.064993 * D);
  const F  = mod360(93.2721 + 13.229350 * D);
  const D_ = mod360(297.8502 + 12.190749 * D);
  const Om = mod360(125.0446 - 0.052954 * D);

  const LmR = Lm * DEG2RAD, MmR = Mm * DEG2RAD, FR = F * DEG2RAD;
  const DR = D_ * DEG2RAD, OmR = Om * DEG2RAD;

  const lon = Lm
    + 6.289 * Math.sin(MmR)
    - 1.274 * Math.sin(MmR - 2 * DR)
    + 0.658 * Math.sin(2 * DR)
    - 0.214 * Math.sin(2 * MmR)
    - 0.186 * Math.sin(LmR)
    - 0.114 * Math.sin(2 * FR);

  const lat =
    + 5.128 * Math.sin(FR)
    + 0.281 * Math.sin(MmR + FR)
    - 0.278 * Math.sin(FR - MmR)
    - 0.173 * Math.sin(FR - 2 * DR)
    - 0.055 * Math.sin(2 * DR + FR - MmR);

  const distKm = 385001
    - 20905 * Math.cos(MmR)
    - 3699 * Math.cos(2 * DR - MmR)
    - 2956 * Math.cos(2 * DR);

  const lonR = lon * DEG2RAD;
  const latR = lat * DEG2RAD;

  const xEcl = Math.cos(latR) * Math.cos(lonR);
  const yEcl = Math.cos(latR) * Math.sin(lonR);
  const zEcl = Math.sin(latR);

  const { ra, dec } = eclipticToEquatorial(xEcl, yEcl, zEcl, T);
  return { ra, dec, distKm };
}

/** Sun's geocentric RA/Dec and distance. */
function sunPosition(T: number): { ra: number; dec: number; distAU: number } {
  const earth = helioEcliptic(EARTH_ELEM, T);
  const { ra, dec } = eclipticToEquatorial(-earth[0], -earth[1], -earth[2], T);
  const distAU = Math.sqrt(earth[0] ** 2 + earth[1] ** 2 + earth[2] ** 2);
  return { ra, dec, distAU };
}

interface ComputedBody {
  name: string;
  ra: number;
  dec: number;
  size: number;
  r: number; g: number; b: number;
  distFromSunAU: number;
  distFromEarthAU: number;
  orbitalSpeedKmS: number;
  rotationDays: number;
}

/**
 * Compute geocentric RA/Dec and metadata for all bodies at the given time.
 * Positions are accurate for any date from 1800–2050 AD.
 */
export function computeBodies(dateMs: number = Date.now()): {
  bodies: ComputedBody[];
  sun: { ra: number; dec: number; distAU: number };
  moon: { ra: number; dec: number; distKm: number };
} {
  const T = (dateMs - J2000_MS) / (MS_PER_DAY * DAYS_PER_CENTURY);
  const earthXYZ = helioEcliptic(EARTH_ELEM, T);

  const sun = sunPosition(T);
  const moon = moonPosition(T);

  const bodies: ComputedBody[] = [];

  // Moon
  bodies.push({
    name: "Moon",
    ra: moon.ra,
    dec: moon.dec,
    size: 36,
    r: 0.93, g: 0.91, b: 0.86,
    distFromSunAU: 1.0,
    distFromEarthAU: moon.distKm / 149_597_870.7,
    orbitalSpeedKmS: 1.022,
    rotationDays: 27.322,
  });

  // Planets
  for (const p of PLANETS) {
    const helio = helioEcliptic(p.elem, T);
    const geoX = helio[0] - earthXYZ[0];
    const geoY = helio[1] - earthXYZ[1];
    const geoZ = helio[2] - earthXYZ[2];
    const { ra, dec } = eclipticToEquatorial(geoX, geoY, geoZ, T);

    const distFromSunAU = Math.sqrt(helio[0] ** 2 + helio[1] ** 2 + helio[2] ** 2);
    const distFromEarthAU = Math.sqrt(geoX ** 2 + geoY ** 2 + geoZ ** 2);

    const sizeFactor = Math.max(0.4, 2.0 / (distFromEarthAU + 0.5));
    const size = Math.round(p.baseSize * sizeFactor);

    bodies.push({
      name: p.name,
      ra, dec,
      size: Math.max(6, Math.min(size, 28)),
      r: p.color[0], g: p.color[1], b: p.color[2],
      distFromSunAU,
      distFromEarthAU,
      orbitalSpeedKmS: p.orbitalSpeedKmS,
      rotationDays: p.rotationDays,
    });
  }

  return { bodies, sun, moon };
}

/** All labeled bodies (planets + sun + moon) for the label overlay. */
export function computeLabels(dateMs: number = Date.now()) {
  const { bodies, sun } = computeBodies(dateMs);
  return [
    ...bodies.map((b) => ({ name: b.name, azimuth: b.ra, altitude: b.dec })),
    { name: "Sun", azimuth: sun.ra, altitude: sun.dec },
  ];
}

export const BODY_LABELS = computeLabels();

function directionFromAngles(azDeg: number, altDeg: number): [number, number, number] {
  const az = azDeg * DEG2RAD;
  const alt = altDeg * DEG2RAD;
  const cosAlt = Math.cos(alt);
  return [cosAlt * Math.sin(az), Math.sin(alt), cosAlt * Math.cos(az)];
}

const VERT = `
uniform vec3  uSunDir;
attribute float aSize;
attribute vec3  aColor;
varying   vec3  vColor;
varying   vec2  vLightDir;

void main() {
  vColor = aColor;
  vec4 cp = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  cp.z = cp.w * 0.99995;
  gl_Position = cp;
  gl_PointSize = aSize * 1.35;

  // Project sun onto screen plane to get 2D light direction on each sprite
  vec4 sunClip = projectionMatrix * modelViewMatrix * vec4(uSunDir, 1.0);
  vec2 myNDC  = cp.xy / max(cp.w, 0.001);
  vec2 sunNDC = sunClip.xy / max(sunClip.w, 0.001);
  vec2 ld = sunNDC - myNDC;
  float len = length(ld);
  vLightDir = len > 0.0001 ? ld / len : vec2(1.0, 0.0);
}
`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
varying vec2 vLightDir;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  uv.y = -uv.y;
  float d = length(uv);
  if (d > 0.5) discard;

  float cosAngle = dot(normalize(uv), vLightDir);
  float shade = smoothstep(-0.15, 0.15, cosAngle);
  float limb = 1.0 - smoothstep(0.2, 0.48, d) * 0.25;
  float core = smoothstep(0.3, 0.0, d);
  vec3 dayCol = vColor * limb * (0.85 + 0.15 * core);
  vec3 nightCol = vColor * 0.02;
  vec3 col = mix(nightCol, dayCol, shade);
  float a = smoothstep(0.5, 0.04, d);
  gl_FragColor = vec4(col * a, a);
}
`;

export class CelestialBodiesLayer implements CustomLayerInterface {
  id = "celestial-bodies";
  type = "custom" as const;
  renderingMode = "3d" as const;

  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: Camera | null = null;
  private cachedMatrix: Matrix4 | null = null;
  onAdd(_map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.scene = new Scene();
    this.camera = new Camera();

    const { bodies, sun } = computeBodies();
    const sunDir = directionFromAngles(sun.ra, sun.dec);

    const n = bodies.length;
    const pos = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const colors = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      const [x, y, z] = directionFromAngles(b.ra, b.dec);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      sizes[i] = b.size;
      colors[i * 3] = b.r;
      colors[i * 3 + 1] = b.g;
      colors[i * 3 + 2] = b.b;
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
    geo.setAttribute("aColor", new Float32BufferAttribute(colors, 3));

    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSunDir: new Uniform(new Vector3(sunDir[0], sunDir[1], sunDir[2])),
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
      blendEquation: AddEquation,
    });

    this.scene.add(new Points(geo, mat));

    this.renderer = new WebGLRenderer({
      canvas: (_map as MapLibreMap).getCanvas(),
      context: gl,
    });
    this.renderer.autoClear = false;
  }

  render(
    _gl: WebGLRenderingContext | WebGL2RenderingContext,
    options: CustomRenderMethodInput
  ) {
    if (!this.renderer || !this.scene || !this.camera) return;

    const P = new Matrix4().fromArray(options.projectionMatrix);
    const MVP = new Matrix4().fromArray(options.modelViewProjectionMatrix);
    const PInv = new Matrix4().copy(P).invert();
    const MV = new Matrix4().multiplyMatrices(PInv, MVP);
    const e = MV.elements;
    e[12] = 0;
    e[13] = 0;
    e[14] = 0;

    this.camera.projectionMatrix.multiplyMatrices(P, MV);

    this.cachedMatrix = this.camera.projectionMatrix.clone();

    const r = this.renderer as unknown as Record<string, unknown>;
    if (typeof r["resetState"] === "function")
      (r["resetState"] as () => void)();
    else if (
      r["state"] &&
      typeof (r["state"] as Record<string, unknown>)["reset"] === "function"
    )
      ((r["state"] as Record<string, unknown>)["reset"] as () => void)();

    this.renderer.render(this.scene, this.camera);
  }

  getScreenPositions(
    cssW: number,
    cssH: number
  ): Array<{ name: string; x: number; y: number; visible: boolean }> {
    if (!this.cachedMatrix) return [];
    return BODY_LABELS.map((body) => {
      const [dx, dy, dz] = directionFromAngles(body.azimuth, body.altitude);
      const v = new Vector4(dx, dy, dz, 1.0);
      v.applyMatrix4(this.cachedMatrix!);
      if (v.w <= 0) return { name: body.name, x: 0, y: 0, visible: false };
      const ndcX = v.x / v.w;
      const ndcY = v.y / v.w;
      return {
        name: body.name,
        x: (ndcX * 0.5 + 0.5) * cssW,
        y: (-ndcY * 0.5 + 0.5) * cssH,
        visible: ndcX > -1.1 && ndcX < 1.1 && ndcY > -1.1 && ndcY < 1.1,
      };
    });
  }

  onRemove() {
    this.scene?.traverse((node) => {
      if (node instanceof Points) {
        node.geometry.dispose();
        (node.material as ShaderMaterial).dispose();
      }
    });
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.cachedMatrix = null;
  }
}
