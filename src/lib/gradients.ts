import { oklchToHex } from './colors'

export type GradientStop = { color: string; position: number }

export type GradientTemplate = {
  id: string
  name: string
  mood: string
  type: 'linear' | 'radial' | 'conic'
  angle: number
  stops: GradientStop[]
}

const ADJECTIVES = [
  'Aurora', 'Sunset', 'Nebula', 'Prism', 'Halo', 'Mirage', 'Twilight', 'Pulse', 'Bloom', 'Glaze',
  'Cascade', 'Flame', 'Ocean', 'Citrus', 'Velvet', 'Cosmic', 'Silk', 'Frost', 'Ember', 'Lagoon',
  'Candy', 'Noir', 'Pastel', 'Chrome', 'Dusk', 'Dawn', 'Haze', 'Spark', 'Ripple', 'Vapor',
]

const NOUNS = [
  'Drift', 'Wash', 'Flow', 'Beam', 'Fade', 'Sweep', 'Arc', 'Veil', 'Burst', 'Trail',
  'Ribbon', 'Glow', 'Wave', 'Span', 'Mesh', 'Field', 'Blend', 'Stream', 'Gate', 'Sky',
]

const MOODS = [
  'Soft · dreamy', 'Bold · electric', 'Warm · golden', 'Cool · icy', 'Neon · nightlife',
  'Pastel · gentle', 'Deep · cinematic', 'Fresh · spring', 'Retro · vintage', 'Minimal · clean',
]

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

export function generateGradient(index: number): GradientTemplate {
  const rng = mulberry32(index * 7919 + 17)
  const stopCount = 2 + Math.floor(rng() * 4) // 2–5
  const baseHue = rng() * 360
  const typeRoll = rng()
  const type: GradientTemplate['type'] = typeRoll < 0.62 ? 'linear' : typeRoll < 0.88 ? 'radial' : 'conic'
  const angle = Math.round(rng() * 360)
  const stops: GradientStop[] = []

  for (let i = 0; i < stopCount; i++) {
    const t = stopCount === 1 ? 0 : i / (stopCount - 1)
    const hue = (baseHue + i * (40 + rng() * 80) + (rng() - 0.5) * 20 + 360) % 360
    const l = 28 + t * 55 + (rng() - 0.5) * 12
    const c = 12 + rng() * 32
    const position = Math.round(t * 100)
    stops.push({ color: oklchToHex(l, Math.max(5, c), hue), position })
  }

  // Ensure ends
  stops[0].position = 0
  stops[stops.length - 1].position = 100

  return {
    id: `grad-${index}`,
    name: `${pick(rng, ADJECTIVES)} ${pick(rng, NOUNS)}`,
    mood: pick(rng, MOODS),
    type,
    angle,
    stops,
  }
}

export function generateGradientBatch(start: number, count: number): GradientTemplate[] {
  return Array.from({ length: count }, (_, i) => generateGradient(start + i))
}

export function gradientToCss(
  g: Pick<GradientTemplate, 'type' | 'angle' | 'stops'>,
  opts?: { name?: string },
): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')

  if (g.type === 'radial') {
    return opts?.name
      ? `.${slug(opts.name)} {\n  background: radial-gradient(circle at center, ${stops});\n}`
      : `radial-gradient(circle at center, ${stops})`
  }
  if (g.type === 'conic') {
    return opts?.name
      ? `.${slug(opts.name)} {\n  background: conic-gradient(from ${g.angle}deg at center, ${stops});\n}`
      : `conic-gradient(from ${g.angle}deg at center, ${stops})`
  }
  return opts?.name
    ? `.${slug(opts.name)} {\n  background: linear-gradient(${g.angle}deg, ${stops});\n}`
    : `linear-gradient(${g.angle}deg, ${stops})`
}

export function gradientCssValue(g: Pick<GradientTemplate, 'type' | 'angle' | 'stops'>): string {
  return gradientToCss(g)
}

export function paletteToCss(colors: string[], name = 'palette'): string {
  const vars = colors.map((c, i) => `  --${slug(name)}-${i + 1}: ${c};`).join('\n')
  const swatches = colors
    .map(
      (c, i) =>
        `  .${slug(name)}-swatch-${i + 1} { background-color: var(--${slug(name)}-${i + 1}, ${c}); }`,
    )
    .join('\n')
  return `:root {\n${vars}\n}\n\n.${slug(name)}-strip {\n  display: flex;\n  gap: 0;\n}\n${swatches}\n\n.${slug(name)}-bg {\n  background: linear-gradient(90deg, ${colors.join(', ')});\n}`
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || 'custom'
}

/** Encode / decode share state for Calordetel */
export type CalorState = {
  mode: 'palette' | 'gradient'
  name: string
  colors?: string[]
  type?: 'linear' | 'radial' | 'conic'
  angle?: number
  stops?: GradientStop[]
}

export function encodeCalorState(state: CalorState): string {
  const payload = JSON.stringify(state)
  return btoa(unescape(encodeURIComponent(payload)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodeCalorState(raw: string): CalorState | null {
  try {
    let b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(escape(atob(b64)))
    const data = JSON.parse(json) as CalorState
    if (data.mode !== 'palette' && data.mode !== 'gradient') return null
    return data
  } catch {
    return null
  }
}
