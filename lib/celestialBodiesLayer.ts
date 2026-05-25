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
  Vector4,
  WebGLRenderer,
} from "three";
import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  Map as MapLibreMap,
} from "maplibre-gl";

const DEG2RAD = Math.PI / 180;

interface Body {
  name: string;
  azimuth: number;
  altitude: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Real geocentric positions for May 25 2026 (JPL DE405, 00:00 UTC).
 * Azimuth = right ascension in degrees, altitude = declination.
 */
const BODIES: Body[] = [
  { name: "Moon",    azimuth: 261, altitude: -29,  size: 28, r: 0.93, g: 0.91, b: 0.86 },
  { name: "Mercury", azimuth: 75,  altitude: 24,   size: 4,  r: 0.78, g: 0.74, b: 0.69 },
  { name: "Venus",   azimuth: 98,  altitude: 25,   size: 8,  r: 0.95, g: 0.86, b: 0.55 },
  { name: "Mars",    azimuth: 33,  altitude: 12,   size: 5,  r: 0.88, g: 0.45, b: 0.28 },
  { name: "Jupiter", azimuth: 115, altitude: 22,   size: 10, r: 0.91, g: 0.79, b: 0.56 },
  { name: "Saturn",  azimuth: 12,  altitude: 3,    size: 7,  r: 0.94, g: 0.87, b: 0.62 },
];

/** All labeled bodies (planets + sun) for the label overlay. */
export const BODY_LABELS = [
  ...BODIES.map((b) => ({ name: b.name, azimuth: b.azimuth, altitude: b.altitude })),
  { name: "Sun", azimuth: 62, altitude: 21 },
];

function directionFromAngles(azDeg: number, altDeg: number): [number, number, number] {
  const az = azDeg * DEG2RAD;
  const alt = altDeg * DEG2RAD;
  const cosAlt = Math.cos(alt);
  return [cosAlt * Math.sin(az), Math.sin(alt), cosAlt * Math.cos(az)];
}

const VERT = `
attribute float aSize;
attribute vec3  aColor;
varying   vec3  vColor;
void main() {
  vColor = aColor;
  vec4 cp = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  cp.z = cp.w * 0.99995;
  gl_Position = cp;
  gl_PointSize = aSize;
}
`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.06, d);
  float core = smoothstep(0.25, 0.0, d);
  vec3 col = vColor * (0.75 + 0.25 * core);
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

    const n = BODIES.length;
    const pos = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const colors = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const b = BODIES[i];
      const [x, y, z] = directionFromAngles(b.azimuth, b.altitude);
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

  /** Project all labeled bodies to CSS-pixel screen coordinates. */
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
