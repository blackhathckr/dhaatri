import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

function buildLatheGeometry(profile: { points: [number, number][]; segments?: number }): THREE.LatheGeometry {
  const points = profile.points.map(([x, y]) => new THREE.Vector2(Math.max(0.0001, x), y));
  return new THREE.LatheGeometry(points, profile.segments ?? 24);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions): THREE.MeshPhysicalMaterial {
  const textures = makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : new THREE.Color(typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F'),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clamp01(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: Math.max(1, readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: Math.max(1, readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clamp01(readLayerNumber(spec.specularIntensity, ['base'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    if (bumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = bumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    if (displacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = displacementScale;
      material.displacementBias = -displacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: Dhaatri Sprout
// Sculpt build pass: blockout
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createDhaatriSproutModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "Dhaatri Sprout";
  root.userData.reconstructionEvidence = {"itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": {"solved": false, "fovDegrees": 40.0, "aspect": 1.0, "orientation": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}, "positionHint": [0.0, 0.0, 3.0], "note": "For likeness work, solve the reference camera (forge/stage1_intake/solve_camera_pose.py) so the review render aligns with the photo and the reference can be projected. Confirm by overlay review."}, "approximationNotes": []};

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["earth"] = createSculptMaterial(
    "earth",
    {"id": "earth", "name": "Earth mound clay", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#8B5E3C", "color": "#8B5E3C", "albedo": {"dominant": "#8B5E3C", "secondary": ["#7A5133", "#9C6C46"], "samplingNotes": "Flat brand tone; reference shows no gradient within a part."}, "colorVariation": {"palette": ["#8B5E3C", "#7A5133", "#9C6C46"], "pattern": "uniform", "amplitude": 0.03, "heightCorrelation": 0.0}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.75, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "earth-ao-crease", "kind": "ambient-occlusion", "region": "part junctions and contact line", "strength": 0.35, "technique": "extracted AO map multiplied into the base albedo"}, {"id": "earth-tone-drift", "kind": "subtle-albedo-variation", "region": "across the shell", "strength": 0.04, "technique": "low-amplitude deterministic noise so flat clay is not perfectly uniform"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Matte clay/vinyl. No metalness, no clearcoat — reference has no specular hotspots.", "pbr": {"metalness": 0.0, "roughness": 0.705, "clearcoat": 0.0, "transmission": 0.0, "ior": 1.45, "envMapIntensity": 0.35}, "referencePbr": {"source": "E:\\Canarys\\dhaatri\\brand\\3d-build\\crop-earth.png", "confidence": 0.769, "verdict": "pass", "palette": ["#B98C5D", "#765230", "#AC7E50", "#885E37", "#9B6E42"], "roughnessBase": 0.705, "roughnessVariation": 0.05, "maps": {"albedo": {"path": "pbr/earth_albedo.png", "colorSpace": "srgb", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "roughness": {"path": "pbr/earth_roughness.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "normal": {"path": "pbr/earth_normal.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "ao": {"path": "pbr/earth_ao.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "height": {"path": "pbr/earth_height.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}}, "limitation": "single-image PBR extraction is an estimate; 70%+ extraction confidence still needs render screenshot review", "usable": true}},
    options
  );
  materialMap["stem"] = createSculptMaterial(
    "stem",
    {"id": "stem", "name": "Stem clay", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#2D6A4F", "color": "#2D6A4F", "albedo": {"dominant": "#2D6A4F", "secondary": ["#1B4332", "#3A7D5E"], "samplingNotes": "Flat brand tone; reference shows no gradient within a part."}, "colorVariation": {"palette": ["#2D6A4F", "#1B4332", "#3A7D5E"], "pattern": "uniform", "amplitude": 0.03, "heightCorrelation": 0.0}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.75, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "stem-ao-crease", "kind": "ambient-occlusion", "region": "part junctions and contact line", "strength": 0.35, "technique": "extracted AO map multiplied into the base albedo"}, {"id": "stem-tone-drift", "kind": "subtle-albedo-variation", "region": "across the shell", "strength": 0.04, "technique": "low-amplitude deterministic noise so flat clay is not perfectly uniform"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Matte clay/vinyl. No metalness, no clearcoat — reference has no specular hotspots.", "pbr": {"metalness": 0.0, "roughness": 0.695, "clearcoat": 0.0, "transmission": 0.0, "ior": 1.45, "envMapIntensity": 0.35}, "referencePbr": {"source": "E:\\Canarys\\dhaatri\\brand\\3d-build\\crop-stem.png", "confidence": 0.86, "verdict": "pass", "palette": ["#346539", "#447D4A", "#568A59", "#F0F2E6", "#1E411A"], "roughnessBase": 0.695, "roughnessVariation": 0.05, "maps": {"albedo": {"path": "pbr/stem_albedo.png", "colorSpace": "srgb", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "roughness": {"path": "pbr/stem_roughness.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "normal": {"path": "pbr/stem_normal.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "ao": {"path": "pbr/stem_ao.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "height": {"path": "pbr/stem_height.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}}, "limitation": "single-image PBR extraction is an estimate; 70%+ extraction confidence still needs render screenshot review", "usable": true}},
    options
  );
  materialMap["leaf-dark"] = createSculptMaterial(
    "leaf-dark",
    {"id": "leaf-dark", "name": "Lower leaf clay", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#2D6A4F", "color": "#2D6A4F", "albedo": {"dominant": "#2D6A4F", "secondary": ["#1B4332", "#52B788"], "samplingNotes": "Flat brand tone; reference shows no gradient within a part."}, "colorVariation": {"palette": ["#2D6A4F", "#1B4332", "#52B788"], "pattern": "uniform", "amplitude": 0.03, "heightCorrelation": 0.0}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.75, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "leaf-dark-ao-crease", "kind": "ambient-occlusion", "region": "part junctions and contact line", "strength": 0.35, "technique": "extracted AO map multiplied into the base albedo"}, {"id": "leaf-dark-tone-drift", "kind": "subtle-albedo-variation", "region": "across the shell", "strength": 0.04, "technique": "low-amplitude deterministic noise so flat clay is not perfectly uniform"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Matte clay/vinyl. No metalness, no clearcoat — reference has no specular hotspots.", "pbr": {"metalness": 0.0, "roughness": 0.699, "clearcoat": 0.0, "transmission": 0.0, "ior": 1.45, "envMapIntensity": 0.35}, "referencePbr": {"source": "E:\\Canarys\\dhaatri\\brand\\3d-build\\crop-leaf-dark.png", "confidence": 0.855, "verdict": "pass", "palette": ["#59965B", "#48834C", "#6FA86E", "#356B3A", "#F0F4E3"], "roughnessBase": 0.699, "roughnessVariation": 0.05, "maps": {"albedo": {"path": "pbr/leaf-dark_albedo.png", "colorSpace": "srgb", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "roughness": {"path": "pbr/leaf-dark_roughness.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "normal": {"path": "pbr/leaf-dark_normal.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "ao": {"path": "pbr/leaf-dark_ao.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "height": {"path": "pbr/leaf-dark_height.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}}, "limitation": "single-image PBR extraction is an estimate; 70%+ extraction confidence still needs render screenshot review", "usable": true}},
    options
  );
  materialMap["leaf-light"] = createSculptMaterial(
    "leaf-light",
    {"id": "leaf-light", "name": "Upper leaf clay", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#52B788", "color": "#52B788", "albedo": {"dominant": "#52B788", "secondary": ["#95D5B2", "#2D6A4F"], "samplingNotes": "Flat brand tone; reference shows no gradient within a part."}, "colorVariation": {"palette": ["#52B788", "#95D5B2", "#2D6A4F"], "pattern": "uniform", "amplitude": 0.03, "heightCorrelation": 0.0}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.75, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "leaf-light-ao-crease", "kind": "ambient-occlusion", "region": "part junctions and contact line", "strength": 0.35, "technique": "extracted AO map multiplied into the base albedo"}, {"id": "leaf-light-tone-drift", "kind": "subtle-albedo-variation", "region": "across the shell", "strength": 0.04, "technique": "low-amplitude deterministic noise so flat clay is not perfectly uniform"}, {"id": "leaf-light-crown-sheen", "kind": "gloss", "region": "upward-facing leaf crown only", "strength": 0.12, "technique": "low clearcoat lift; the reference shows a faint sheen on top faces, never a hard specular hotspot"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Matte clay/vinyl. No metalness, no clearcoat — reference has no specular hotspots.", "pbr": {"metalness": 0.0, "roughness": 0.698, "clearcoat": 0.12, "transmission": 0.0, "ior": 1.45, "envMapIntensity": 0.35, "clearcoatRoughness": 0.55}, "referencePbr": {"source": "E:\\Canarys\\dhaatri\\brand\\3d-build\\crop-leaf-light.png", "confidence": 0.841, "verdict": "pass", "palette": ["#9CCC93", "#A7D49D", "#8FC086", "#6E9E65", "#F5F5E2"], "roughnessBase": 0.698, "roughnessVariation": 0.05, "maps": {"albedo": {"path": "pbr/leaf-light_albedo.png", "colorSpace": "srgb", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "roughness": {"path": "pbr/leaf-light_roughness.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "normal": {"path": "pbr/leaf-light_normal.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "ao": {"path": "pbr/leaf-light_ao.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}, "height": {"path": "pbr/leaf-light_height.png", "colorSpace": "linear", "source": "extracted from reference crop via stage1_intake/extract_pbr_evidence.py", "uvOrientation": "y-up", "resolution": 1024}}, "limitation": "single-image PBR extraction is an estimate; 70%+ extraction confidence still needs render screenshot review", "usable": true}, "clearcoat": 0.12, "clearcoatRoughness": 0.55},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const attachment_root_0 = null;
  const endpoint_root_0 = makeAttachmentEndpoint(attachment_root_0);
  const node_root_0 = new THREE.Group();
  node_root_0.name = "Dhaatri Sprout__pivot";
  if (endpoint_root_0) {
    node_root_0.position.copy(endpoint_root_0.start);
    node_root_0.rotation.set(0, 0, 0);
    node_root_0.scale.set(1, 1, 1);
  } else {
    node_root_0.position.set(0.0, 0.0, 0.0);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
    node_root_0.scale.set(1.0, 1.0, 1.0);
  }
  node_root_0.userData.sculptComponent = {"id": "root", "name": "Dhaatri Sprout", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Container pivot assembling the dome, stem and leaf system.", "geometryDescriptor": {"topologyIntent": "Root pivot for the whole sapling; carries the idle sway.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root-motion", "pivot": {"mode": "component-origin", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "root", "detachable": false}}, "material": "earth", "materialLayers": ["earth"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "earth", "colorMaterialRecipe": {"baseMaterialId": "earth", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/earth_albedo.png", "roughness": "pbr/earth_roughness.png", "normal": "pbr/earth_normal.png", "ao": "pbr/earth_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(139, 94, 60, 1.0)", "secondaryAlbedo": "rgba(122, 81, 51, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_root_0.userData.actionProfile = {"animationRole": "root-motion", "pivot": {"mode": "component-origin", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "root", "detachable": false}};
  (nodes["root"] ?? root).add(node_root_0);
  nodes["root"] = node_root_0;
  const mesh_root_0Geometry = endpoint_root_0
    ? new THREE.CylinderGeometry(endpoint_root_0.endRadius, endpoint_root_0.baseRadius, endpoint_root_0.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_root_0 = new THREE.Mesh(
    mesh_root_0Geometry,
    materialMap["earth"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_root_0.name = "Dhaatri Sprout";
  if (endpoint_root_0) {
    mesh_root_0.position.copy(endpoint_root_0.midpoint);
    mesh_root_0.quaternion.copy(endpoint_root_0.quaternion);
  }
  mesh_root_0.castShadow = options.castShadow ?? true;
  mesh_root_0.receiveShadow = options.receiveShadow ?? true;
  mesh_root_0.userData.sculptComponent = {"id": "root", "name": "Dhaatri Sprout", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Container pivot assembling the dome, stem and leaf system.", "geometryDescriptor": {"topologyIntent": "Root pivot for the whole sapling; carries the idle sway.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root-motion", "pivot": {"mode": "component-origin", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "root", "detachable": false}}, "material": "earth", "materialLayers": ["earth"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "earth", "colorMaterialRecipe": {"baseMaterialId": "earth", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/earth_albedo.png", "roughness": "pbr/earth_roughness.png", "normal": "pbr/earth_normal.png", "ao": "pbr/earth_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(139, 94, 60, 1.0)", "secondaryAlbedo": "rgba(122, 81, 51, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_root_0.add(mesh_root_0);
  meshes["root"] = mesh_root_0;
  colliders["root"] = {"type": "sphere", "fit": "tight"};

  const attachment_earth_dome_1 = null;
  const endpoint_earth_dome_1 = makeAttachmentEndpoint(attachment_earth_dome_1);
  const node_earth_dome_1 = new THREE.Group();
  node_earth_dome_1.name = "Earth mound__pivot";
  if (endpoint_earth_dome_1) {
    node_earth_dome_1.position.copy(endpoint_earth_dome_1.start);
    node_earth_dome_1.rotation.set(0, 0, 0);
    node_earth_dome_1.scale.set(1, 1, 1);
  } else {
    node_earth_dome_1.position.set(0.0, 0.0, 0.0);
    node_earth_dome_1.rotation.set(0.0, 0.0, 0.0);
    node_earth_dome_1.scale.set(1.0, 0.55, 1.0);
  }
  node_earth_dome_1.userData.sculptComponent = {"id": "earth-dome", "name": "Earth mound", "level": "macro", "role": "base", "importance": 0.9, "confidence": 0.9, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Hemisphere: sphere geometry with phiLength halved and a flat cap at y=0.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 0.55, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "component-origin", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "earth-dome", "detachable": false}}, "material": "earth", "materialLayers": ["earth"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "earth", "colorMaterialRecipe": {"baseMaterialId": "earth", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/earth_albedo.png", "roughness": "pbr/earth_roughness.png", "normal": "pbr/earth_normal.png", "ao": "pbr/earth_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(139, 94, 60, 1.0)", "secondaryAlbedo": "rgba(122, 81, 51, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_earth_dome_1.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "component-origin", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "earth-dome", "detachable": false}};
  (nodes["root"] ?? root).add(node_earth_dome_1);
  nodes["earth-dome"] = node_earth_dome_1;
  const mesh_earth_dome_1Geometry = endpoint_earth_dome_1
    ? new THREE.CylinderGeometry(endpoint_earth_dome_1.endRadius, endpoint_earth_dome_1.baseRadius, endpoint_earth_dome_1.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  const mesh_earth_dome_1 = new THREE.Mesh(
    mesh_earth_dome_1Geometry,
    materialMap["earth"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_earth_dome_1.name = "Earth mound";
  if (endpoint_earth_dome_1) {
    mesh_earth_dome_1.position.copy(endpoint_earth_dome_1.midpoint);
    mesh_earth_dome_1.quaternion.copy(endpoint_earth_dome_1.quaternion);
  }
  mesh_earth_dome_1.castShadow = options.castShadow ?? true;
  mesh_earth_dome_1.receiveShadow = options.receiveShadow ?? true;
  mesh_earth_dome_1.userData.sculptComponent = {"id": "earth-dome", "name": "Earth mound", "level": "macro", "role": "base", "importance": 0.9, "confidence": 0.9, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Hemisphere: sphere geometry with phiLength halved and a flat cap at y=0.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 0.55, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "component-origin", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "earth-dome", "detachable": false}}, "material": "earth", "materialLayers": ["earth"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "earth", "colorMaterialRecipe": {"baseMaterialId": "earth", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/earth_albedo.png", "roughness": "pbr/earth_roughness.png", "normal": "pbr/earth_normal.png", "ao": "pbr/earth_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(139, 94, 60, 1.0)", "secondaryAlbedo": "rgba(122, 81, 51, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_earth_dome_1.add(mesh_earth_dome_1);
  meshes["earth-dome"] = mesh_earth_dome_1;
  colliders["earth-dome"] = {"type": "sphere", "fit": "tight"};

  const attachment_stem_2 = {"parentSocket": "earth-dome:crown", "localStart": [0, 0, 0], "localEnd": [0, 0.84, 0], "contactType": "embedded", "embedDepth": 0.06, "gapTolerance": 0.005};
  const endpoint_stem_2 = makeAttachmentEndpoint(attachment_stem_2);
  const node_stem_2 = new THREE.Group();
  node_stem_2.name = "Stem__pivot";
  if (endpoint_stem_2) {
    node_stem_2.position.copy(endpoint_stem_2.start);
    node_stem_2.rotation.set(0, 0, 0);
    node_stem_2.scale.set(1, 1, 1);
  } else {
    node_stem_2.position.set(0.0, 0.42, 0.0);
    node_stem_2.rotation.set(0.0, 0.0, 0.0);
    node_stem_2.scale.set(1.0, 1.0, 1.0);
  }
  node_stem_2.userData.sculptComponent = {"id": "stem", "name": "Stem", "level": "macro", "role": "structure", "importance": 0.95, "confidence": 0.9, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Lathe: the stem tapers from base to tip, so it is a revolved profile, not a constant-radius cylinder.", "geometryDescriptor": {"topologyIntent": "Slightly tapered cylinder — reference shows the base marginally wider than the tip.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "earth-dome:crown", "localStart": [0, 0, 0], "localEnd": [0, 0.84, 0], "contactType": "embedded", "embedDepth": 0.06, "gapTolerance": 0.005}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.42, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "bend", "pivot": {"mode": "explicit", "position": [0, 0.0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "fit": "tight"}, "constraints": [], "destruction": {"group": "stem", "detachable": false}}, "material": "stem", "materialLayers": ["stem"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "stem", "colorMaterialRecipe": {"baseMaterialId": "stem", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/stem_albedo.png", "roughness": "pbr/stem_roughness.png", "normal": "pbr/stem_normal.png", "ao": "pbr/stem_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(45, 106, 79, 1.0)", "secondaryAlbedo": "rgba(27, 67, 50, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_stem_2.userData.actionProfile = {"animationRole": "bend", "pivot": {"mode": "explicit", "position": [0, 0.0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "fit": "tight"}, "constraints": [], "destruction": {"group": "stem", "detachable": false}};
  (nodes["root"] ?? root).add(node_stem_2);
  nodes["stem"] = node_stem_2;
  const mesh_stem_2Geometry = endpoint_stem_2
    ? new THREE.CylinderGeometry(endpoint_stem_2.endRadius, endpoint_stem_2.baseRadius, endpoint_stem_2.length, 32, 12)
    : buildLatheGeometry({"points": [[0.3, -0.5], [0.15, 0.0], [0.3, 0.5]], "segments": 24});
  const mesh_stem_2 = new THREE.Mesh(
    mesh_stem_2Geometry,
    materialMap["stem"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_stem_2.name = "Stem";
  if (endpoint_stem_2) {
    mesh_stem_2.position.copy(endpoint_stem_2.midpoint);
    mesh_stem_2.quaternion.copy(endpoint_stem_2.quaternion);
  }
  mesh_stem_2.castShadow = options.castShadow ?? true;
  mesh_stem_2.receiveShadow = options.receiveShadow ?? true;
  mesh_stem_2.userData.sculptComponent = {"id": "stem", "name": "Stem", "level": "macro", "role": "structure", "importance": 0.95, "confidence": 0.9, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Lathe: the stem tapers from base to tip, so it is a revolved profile, not a constant-radius cylinder.", "geometryDescriptor": {"topologyIntent": "Slightly tapered cylinder — reference shows the base marginally wider than the tip.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "earth-dome:crown", "localStart": [0, 0, 0], "localEnd": [0, 0.84, 0], "contactType": "embedded", "embedDepth": 0.06, "gapTolerance": 0.005}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.42, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "bend", "pivot": {"mode": "explicit", "position": [0, 0.0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "fit": "tight"}, "constraints": [], "destruction": {"group": "stem", "detachable": false}}, "material": "stem", "materialLayers": ["stem"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "stem", "colorMaterialRecipe": {"baseMaterialId": "stem", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/stem_albedo.png", "roughness": "pbr/stem_roughness.png", "normal": "pbr/stem_normal.png", "ao": "pbr/stem_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(45, 106, 79, 1.0)", "secondaryAlbedo": "rgba(27, 67, 50, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_stem_2.add(mesh_stem_2);
  meshes["stem"] = mesh_stem_2;
  colliders["stem"] = {"type": "capsule", "fit": "tight"};

  const attachment_leaf_upper_a_3 = {"parentSocket": "stem:node-upper-a", "localStart": [0, 0, 0], "localEnd": [1.1700000000000002, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004};
  const endpoint_leaf_upper_a_3 = makeAttachmentEndpoint(attachment_leaf_upper_a_3);
  const node_leaf_upper_a_3 = new THREE.Group();
  node_leaf_upper_a_3.name = "Leaf upper A__pivot";
  if (endpoint_leaf_upper_a_3) {
    node_leaf_upper_a_3.position.copy(endpoint_leaf_upper_a_3.start);
    node_leaf_upper_a_3.rotation.set(0, 0, 0);
    node_leaf_upper_a_3.scale.set(1, 1, 1);
  } else {
    node_leaf_upper_a_3.position.set(0.0, 0.62, 0.0);
    node_leaf_upper_a_3.rotation.set(0.0, 0.4886917777777777, 0.95);
    node_leaf_upper_a_3.scale.set(1.3, 1.3, 1.3);
  }
  node_leaf_upper_a_3.userData.sculptComponent = {"id": "leaf-upper-a", "name": "Leaf upper A", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-upper-a", "localStart": [0, 0, 0], "localEnd": [1.1700000000000002, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.62, 0], "rotation": [0, 0.4886917777777777, 0.95], "scale": [1.3, 1.3, 1.3]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-upper-a", "detachable": true}}, "material": "leaf-light", "materialLayers": ["leaf-light"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-upper-a-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-light", "colorMaterialRecipe": {"baseMaterialId": "leaf-light", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-light_albedo.png", "roughness": "pbr/leaf-light_roughness.png", "normal": "pbr/leaf-light_normal.png", "ao": "pbr/leaf-light_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(82, 183, 136, 1.0)", "secondaryAlbedo": "rgba(149, 213, 178, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_upper_a_3.userData.actionProfile = {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-upper-a", "detachable": true}};
  (nodes["stem"] ?? root).add(node_leaf_upper_a_3);
  nodes["leaf-upper-a"] = node_leaf_upper_a_3;
  const mesh_leaf_upper_a_3Geometry = endpoint_leaf_upper_a_3
    ? new THREE.CylinderGeometry(endpoint_leaf_upper_a_3.endRadius, endpoint_leaf_upper_a_3.baseRadius, endpoint_leaf_upper_a_3.length, 32, 12)
    : buildLatheGeometry({"points": [[0.3, -0.5], [0.15, 0.0], [0.3, 0.5]], "segments": 24});
  const mesh_leaf_upper_a_3 = new THREE.Mesh(
    mesh_leaf_upper_a_3Geometry,
    materialMap["leaf-light"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_leaf_upper_a_3.name = "Leaf upper A";
  if (endpoint_leaf_upper_a_3) {
    mesh_leaf_upper_a_3.position.copy(endpoint_leaf_upper_a_3.midpoint);
    mesh_leaf_upper_a_3.quaternion.copy(endpoint_leaf_upper_a_3.quaternion);
  }
  mesh_leaf_upper_a_3.castShadow = options.castShadow ?? true;
  mesh_leaf_upper_a_3.receiveShadow = options.receiveShadow ?? true;
  mesh_leaf_upper_a_3.userData.sculptComponent = {"id": "leaf-upper-a", "name": "Leaf upper A", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-upper-a", "localStart": [0, 0, 0], "localEnd": [1.1700000000000002, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.62, 0], "rotation": [0, 0.4886917777777777, 0.95], "scale": [1.3, 1.3, 1.3]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-upper-a", "detachable": true}}, "material": "leaf-light", "materialLayers": ["leaf-light"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-upper-a-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-light", "colorMaterialRecipe": {"baseMaterialId": "leaf-light", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-light_albedo.png", "roughness": "pbr/leaf-light_roughness.png", "normal": "pbr/leaf-light_normal.png", "ao": "pbr/leaf-light_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(82, 183, 136, 1.0)", "secondaryAlbedo": "rgba(149, 213, 178, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_upper_a_3.add(mesh_leaf_upper_a_3);
  meshes["leaf-upper-a"] = mesh_leaf_upper_a_3;
  colliders["leaf-upper-a"] = {"type": "sphere", "fit": "tight"};

  const attachment_leaf_upper_b_4 = {"parentSocket": "stem:node-upper-b", "localStart": [0, 0, 0], "localEnd": [1.1700000000000002, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004};
  const endpoint_leaf_upper_b_4 = makeAttachmentEndpoint(attachment_leaf_upper_b_4);
  const node_leaf_upper_b_4 = new THREE.Group();
  node_leaf_upper_b_4.name = "Leaf upper B__pivot";
  if (endpoint_leaf_upper_b_4) {
    node_leaf_upper_b_4.position.copy(endpoint_leaf_upper_b_4.start);
    node_leaf_upper_b_4.rotation.set(0, 0, 0);
    node_leaf_upper_b_4.scale.set(1, 1, 1);
  } else {
    node_leaf_upper_b_4.position.set(0.0, 0.62, 0.0);
    node_leaf_upper_b_4.rotation.set(0.0, 3.6302817777777774, -0.95);
    node_leaf_upper_b_4.scale.set(1.3, 1.3, 1.3);
  }
  node_leaf_upper_b_4.userData.sculptComponent = {"id": "leaf-upper-b", "name": "Leaf upper B", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-upper-b", "localStart": [0, 0, 0], "localEnd": [1.1700000000000002, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.62, 0], "rotation": [0, 3.6302817777777774, -0.95], "scale": [1.3, 1.3, 1.3]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-upper-b", "detachable": true}}, "material": "leaf-light", "materialLayers": ["leaf-light"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-upper-b-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-light", "colorMaterialRecipe": {"baseMaterialId": "leaf-light", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-light_albedo.png", "roughness": "pbr/leaf-light_roughness.png", "normal": "pbr/leaf-light_normal.png", "ao": "pbr/leaf-light_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(82, 183, 136, 1.0)", "secondaryAlbedo": "rgba(149, 213, 178, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_upper_b_4.userData.actionProfile = {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-upper-b", "detachable": true}};
  (nodes["stem"] ?? root).add(node_leaf_upper_b_4);
  nodes["leaf-upper-b"] = node_leaf_upper_b_4;
  const mesh_leaf_upper_b_4Geometry = endpoint_leaf_upper_b_4
    ? new THREE.CylinderGeometry(endpoint_leaf_upper_b_4.endRadius, endpoint_leaf_upper_b_4.baseRadius, endpoint_leaf_upper_b_4.length, 32, 12)
    : buildLatheGeometry({"points": [[0.3, -0.5], [0.15, 0.0], [0.3, 0.5]], "segments": 24});
  const mesh_leaf_upper_b_4 = new THREE.Mesh(
    mesh_leaf_upper_b_4Geometry,
    materialMap["leaf-light"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_leaf_upper_b_4.name = "Leaf upper B";
  if (endpoint_leaf_upper_b_4) {
    mesh_leaf_upper_b_4.position.copy(endpoint_leaf_upper_b_4.midpoint);
    mesh_leaf_upper_b_4.quaternion.copy(endpoint_leaf_upper_b_4.quaternion);
  }
  mesh_leaf_upper_b_4.castShadow = options.castShadow ?? true;
  mesh_leaf_upper_b_4.receiveShadow = options.receiveShadow ?? true;
  mesh_leaf_upper_b_4.userData.sculptComponent = {"id": "leaf-upper-b", "name": "Leaf upper B", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-upper-b", "localStart": [0, 0, 0], "localEnd": [1.1700000000000002, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.62, 0], "rotation": [0, 3.6302817777777774, -0.95], "scale": [1.3, 1.3, 1.3]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-upper-b", "detachable": true}}, "material": "leaf-light", "materialLayers": ["leaf-light"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-upper-b-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-light", "colorMaterialRecipe": {"baseMaterialId": "leaf-light", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-light_albedo.png", "roughness": "pbr/leaf-light_roughness.png", "normal": "pbr/leaf-light_normal.png", "ao": "pbr/leaf-light_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(82, 183, 136, 1.0)", "secondaryAlbedo": "rgba(149, 213, 178, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_upper_b_4.add(mesh_leaf_upper_b_4);
  meshes["leaf-upper-b"] = mesh_leaf_upper_b_4;
  colliders["leaf-upper-b"] = {"type": "sphere", "fit": "tight"};

  const attachment_leaf_lower_a_5 = {"parentSocket": "stem:node-lower-a", "localStart": [0, 0, 0], "localEnd": [0.9900000000000001, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004};
  const endpoint_leaf_lower_a_5 = makeAttachmentEndpoint(attachment_leaf_lower_a_5);
  const node_leaf_lower_a_5 = new THREE.Group();
  node_leaf_lower_a_5.name = "Leaf lower A__pivot";
  if (endpoint_leaf_lower_a_5) {
    node_leaf_lower_a_5.position.copy(endpoint_leaf_lower_a_5.start);
    node_leaf_lower_a_5.rotation.set(0, 0, 0);
    node_leaf_lower_a_5.scale.set(1, 1, 1);
  } else {
    node_leaf_lower_a_5.position.set(0.0, 0.3, 0.0);
    node_leaf_lower_a_5.rotation.set(0.0, 2.0594867777777774, 0.7);
    node_leaf_lower_a_5.scale.set(1.1, 1.1, 1.1);
  }
  node_leaf_lower_a_5.userData.sculptComponent = {"id": "leaf-lower-a", "name": "Leaf lower A", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-lower-a", "localStart": [0, 0, 0], "localEnd": [0.9900000000000001, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.3, 0], "rotation": [0, 2.0594867777777774, 0.7], "scale": [1.1, 1.1, 1.1]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-lower-a", "detachable": true}}, "material": "leaf-dark", "materialLayers": ["leaf-dark"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-lower-a-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-dark", "colorMaterialRecipe": {"baseMaterialId": "leaf-dark", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-dark_albedo.png", "roughness": "pbr/leaf-dark_roughness.png", "normal": "pbr/leaf-dark_normal.png", "ao": "pbr/leaf-dark_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(45, 106, 79, 1.0)", "secondaryAlbedo": "rgba(27, 67, 50, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_lower_a_5.userData.actionProfile = {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-lower-a", "detachable": true}};
  (nodes["stem"] ?? root).add(node_leaf_lower_a_5);
  nodes["leaf-lower-a"] = node_leaf_lower_a_5;
  const mesh_leaf_lower_a_5Geometry = endpoint_leaf_lower_a_5
    ? new THREE.CylinderGeometry(endpoint_leaf_lower_a_5.endRadius, endpoint_leaf_lower_a_5.baseRadius, endpoint_leaf_lower_a_5.length, 32, 12)
    : buildLatheGeometry({"points": [[0.3, -0.5], [0.15, 0.0], [0.3, 0.5]], "segments": 24});
  const mesh_leaf_lower_a_5 = new THREE.Mesh(
    mesh_leaf_lower_a_5Geometry,
    materialMap["leaf-dark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_leaf_lower_a_5.name = "Leaf lower A";
  if (endpoint_leaf_lower_a_5) {
    mesh_leaf_lower_a_5.position.copy(endpoint_leaf_lower_a_5.midpoint);
    mesh_leaf_lower_a_5.quaternion.copy(endpoint_leaf_lower_a_5.quaternion);
  }
  mesh_leaf_lower_a_5.castShadow = options.castShadow ?? true;
  mesh_leaf_lower_a_5.receiveShadow = options.receiveShadow ?? true;
  mesh_leaf_lower_a_5.userData.sculptComponent = {"id": "leaf-lower-a", "name": "Leaf lower A", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-lower-a", "localStart": [0, 0, 0], "localEnd": [0.9900000000000001, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.3, 0], "rotation": [0, 2.0594867777777774, 0.7], "scale": [1.1, 1.1, 1.1]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-lower-a", "detachable": true}}, "material": "leaf-dark", "materialLayers": ["leaf-dark"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-lower-a-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-dark", "colorMaterialRecipe": {"baseMaterialId": "leaf-dark", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-dark_albedo.png", "roughness": "pbr/leaf-dark_roughness.png", "normal": "pbr/leaf-dark_normal.png", "ao": "pbr/leaf-dark_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(45, 106, 79, 1.0)", "secondaryAlbedo": "rgba(27, 67, 50, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_lower_a_5.add(mesh_leaf_lower_a_5);
  meshes["leaf-lower-a"] = mesh_leaf_lower_a_5;
  colliders["leaf-lower-a"] = {"type": "sphere", "fit": "tight"};

  const attachment_leaf_lower_b_6 = {"parentSocket": "stem:node-lower-b", "localStart": [0, 0, 0], "localEnd": [0.9900000000000001, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004};
  const endpoint_leaf_lower_b_6 = makeAttachmentEndpoint(attachment_leaf_lower_b_6);
  const node_leaf_lower_b_6 = new THREE.Group();
  node_leaf_lower_b_6.name = "Leaf lower B__pivot";
  if (endpoint_leaf_lower_b_6) {
    node_leaf_lower_b_6.position.copy(endpoint_leaf_lower_b_6.start);
    node_leaf_lower_b_6.rotation.set(0, 0, 0);
    node_leaf_lower_b_6.scale.set(1, 1, 1);
  } else {
    node_leaf_lower_b_6.position.set(0.0, 0.3, 0.0);
    node_leaf_lower_b_6.rotation.set(0.0, 5.201076777777778, -0.7);
    node_leaf_lower_b_6.scale.set(1.1, 1.1, 1.1);
  }
  node_leaf_lower_b_6.userData.sculptComponent = {"id": "leaf-lower-b", "name": "Leaf lower B", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-lower-b", "localStart": [0, 0, 0], "localEnd": [0.9900000000000001, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.3, 0], "rotation": [0, 5.201076777777778, -0.7], "scale": [1.1, 1.1, 1.1]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-lower-b", "detachable": true}}, "material": "leaf-dark", "materialLayers": ["leaf-dark"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-lower-b-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-dark", "colorMaterialRecipe": {"baseMaterialId": "leaf-dark", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-dark_albedo.png", "roughness": "pbr/leaf-dark_roughness.png", "normal": "pbr/leaf-dark_normal.png", "ao": "pbr/leaf-dark_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(45, 106, 79, 1.0)", "secondaryAlbedo": "rgba(27, 67, 50, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_lower_b_6.userData.actionProfile = {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-lower-b", "detachable": true}};
  (nodes["stem"] ?? root).add(node_leaf_lower_b_6);
  nodes["leaf-lower-b"] = node_leaf_lower_b_6;
  const mesh_leaf_lower_b_6Geometry = endpoint_leaf_lower_b_6
    ? new THREE.CylinderGeometry(endpoint_leaf_lower_b_6.endRadius, endpoint_leaf_lower_b_6.baseRadius, endpoint_leaf_lower_b_6.length, 32, 12)
    : buildLatheGeometry({"points": [[0.3, -0.5], [0.15, 0.0], [0.3, 0.5]], "segments": 24});
  const mesh_leaf_lower_b_6 = new THREE.Mesh(
    mesh_leaf_lower_b_6Geometry,
    materialMap["leaf-dark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_leaf_lower_b_6.name = "Leaf lower B";
  if (endpoint_leaf_lower_b_6) {
    mesh_leaf_lower_b_6.position.copy(endpoint_leaf_lower_b_6.midpoint);
    mesh_leaf_lower_b_6.quaternion.copy(endpoint_leaf_lower_b_6.quaternion);
  }
  mesh_leaf_lower_b_6.castShadow = options.castShadow ?? true;
  mesh_leaf_lower_b_6.receiveShadow = options.receiveShadow ?? true;
  mesh_leaf_lower_b_6.userData.sculptComponent = {"id": "leaf-lower-b", "name": "Leaf lower B", "level": "meso", "role": "appendage", "importance": 0.9, "confidence": 0.75, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous organic form with no hard part seams — swept/lathed surface, not an assembly of boxes.", "geometryDescriptor": {"topologyIntent": "Teardrop leaf blade: a lathe/extruded Shape with a rounded tip and a tapered base, not a flattened sphere — the reference silhouette is a true leaf profile.", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "stem", "attachment": {"parentSocket": "stem:node-lower-b", "localStart": [0, 0, 0], "localEnd": [0.9900000000000001, 0.18, 0], "contactType": "fused", "overlap": 0.04, "gapTolerance": 0.004}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0.3, 0], "rotation": [0, 5.201076777777778, -0.7], "scale": [1.1, 1.1, 1.1]}, "actionProfile": {"animationRole": "flutter", "pivot": {"mode": "explicit", "position": [0, 0, 0]}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "fit": "tight"}, "constraints": [], "destruction": {"group": "leaf-lower-b", "detachable": true}}, "material": "leaf-dark", "materialLayers": ["leaf-dark"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "leaf-lower-b-vein", "name": "Central vein crease", "kind": "surface-relief", "technique": "raised spline ridge along the leaf midline, ~2% of blade width", "confidence": 0.7, "explodeWithParent": true}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "materialId": "leaf-dark", "colorMaterialRecipe": {"baseMaterialId": "leaf-dark", "technique": "flat brand albedo with high roughness; AO from the extracted map darkens the leaf/stem junctions and the dome contact line", "maps": {"albedo": "pbr/leaf-dark_albedo.png", "roughness": "pbr/leaf-dark_roughness.png", "normal": "pbr/leaf-dark_normal.png", "ao": "pbr/leaf-dark_ao.png"}, "notes": "No metalness, no clearcoat — the reference has zero specular hotspots.", "dominantAlbedo": "rgba(45, 106, 79, 1.0)", "secondaryAlbedo": "rgba(27, 67, 50, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.82}};
  node_leaf_lower_b_6.add(mesh_leaf_lower_b_6);
  meshes["leaf-lower-b"] = mesh_leaf_lower_b_6;
  colliders["leaf-lower-b"] = {"type": "sphere", "fit": "tight"};

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createDhaatriSproutLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "Dhaatri Sprout look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [{"role": "key", "type": "directional", "position": [-3, 5, 4], "intensity": 2.1, "color": "#FFF6E8", "castShadow": true, "evidence": "highlight sits on the upper-left of the dome and the left leaf faces", "environment": {"preset": "studio-soft", "intensity": 0.35}, "shadow": {"type": "contact", "opacity": 0.22, "blur": 2.4, "evidence": "soft elliptical contact shadow directly under the dome"}}, {"role": "fill", "type": "hemisphere", "skyColor": "#F5F1EB", "groundColor": "#D8C7AE", "intensity": 0.85, "evidence": "shadow sides stay open — no crushed blacks in the reference"}, {"role": "rim", "type": "directional", "position": [2.5, 3, -4], "intensity": 0.6, "color": "#D8F3DC", "evidence": "faint separation edge along the right leaf against the backdrop"}];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createDhaatriSproutEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function frameDhaatriSproutCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createDhaatriSproutPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}

export function configureDhaatriSproutRenderer(renderer: THREE.WebGLRenderer): void {
  // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
  // the environment reflection reads flat/washed instead of a believable metal response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function createDhaatriSproutInspectControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
): OrbitControls {
  // View-dependent finishes only read correctly once the user orbits — their color
  // comes from the environment reflection, not albedo, so free rotation matters here.
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.autoRotate = false;
  return controls;
}
