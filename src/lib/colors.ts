export type Swatch = { hex: string; name: string }
export type ColorFormat = 'HEXA' | 'RGBA' | 'HSLA'
export type ExportFormat = 'CSS' | 'SCSS' | 'Tailwind'

export const DEFAULT_PALETTE = [
  '#F3A27E', '#E65F39', '#435BC3', '#ACA1E8', '#728346', '#F5D2BA',
  '#27345E', '#B74763', '#D3A745', '#4B7F78', '#D78C53', '#F4E8D7',
]

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [1, 3, 5].map((i) => parseInt(h.slice(i - 1, i + 1), 16)) as [number, number, number]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function formatColor(hex: string, format: ColorFormat): string {
  const [r, g, b] = hexToRgb(hex)
  if (format === 'HEXA') return `${hex.toUpperCase()}FF`
  if (format === 'RGBA') return `rgba(${r}, ${g}, ${b}, 1)`
  const { h, s, l } = rgbToHsl(r, g, b)
  return `hsla(${h}, ${s}%, ${l}%, 1)`
}

export function rgbToOklch(r: number, g: number, b: number) {
  const lin = (c: number) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const R = lin(r)
  const G = lin(g)
  const B = lin(b)
  const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  return {
    l: Math.round(L * 100),
    c: Math.round(Math.hypot(a, bb) * 100),
    h: (Math.round((Math.atan2(bb, a) * 180) / Math.PI) + 360) % 360,
  }
}

export function oklchToHex(l: number, c: number, h: number): string {
  const hr = (h * Math.PI) / 180
  const a = (c / 100) * Math.cos(hr)
  const b = (c / 100) * Math.sin(hr)
  const l_ = l / 100 + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l / 100 - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l / 100 - 0.0894841775 * a - 1.291485548 * b
  const L = l_ ** 3
  const M = m_ ** 3
  const S = s_ ** 3
  const toSrgb = (v: number) => {
    const c2 = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055
    return Math.round(Math.max(0, Math.min(1, c2)) * 255)
      .toString(16)
      .padStart(2, '0')
  }
  const R = toSrgb(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S)
  const G = toSrgb(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S)
  const B = toSrgb(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S)
  return `#${R}${G}${B}`.toUpperCase()
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const HUE_NAMES = [
  'rose', 'coral', 'orange', 'amber', 'lime', 'green',
  'teal', 'cyan', 'blue', 'indigo', 'violet', 'magenta',
]
const NEUTRALS = ['Stone', 'Mist', 'Pebble', 'Cloud', 'Ash', 'Dove']

export function nameColor(hex: string, index: number): string {
  const [r, g, b] = hexToRgb(hex)
  const hsl = rgbToHsl(r, g, b)
  if (hsl.l < 14) return 'Deep ink'
  if (hsl.l > 89) return 'Soft ivory'
  if (hsl.s < 17) return NEUTRALS[index % NEUTRALS.length]
  return `Soft ${HUE_NAMES[Math.round(hsl.h / 30) % 12]}`
}

export function toSwatches(hexes: string[]): Swatch[] {
  return hexes.map((hex, i) => ({ hex: hex.toUpperCase(), name: nameColor(hex, i) }))
}

export function parseSharedPalette(search: string): Swatch[] | null {
  const params = new URLSearchParams(search)
  const raw = params.get('palette')
  if (!raw) return null
  const parts = raw.split(',').map((p) => p.replace(/^#/, ''))
  if (parts.length < 5 || parts.length > 12 || parts.some((p) => !/^[\da-f]{6}$/i.test(p))) return null
  return toSwatches(parts.map((p) => `#${p.toUpperCase()}`))
}

export function extractPalette(img: HTMLImageElement, count: number): Swatch[] {
  const canvas = document.createElement('canvas')
  const size = 100
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return toSwatches(DEFAULT_PALETTE).slice(0, count)
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data
  const pixels: [number, number, number][] = []
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] > 180) pixels.push([data[i], data[i + 1], data[i + 2]])
  }
  const step = Math.max(1, Math.floor(pixels.length / 800))
  const sample = pixels.filter((_, i) => i % step === 0)
  const centers: [number, number, number][] = Array.from({ length: count }, (_, i) => [
    ...(sample[Math.floor(((i + 0.5) * sample.length) / count)] || [120, 120, 120]),
  ]) as [number, number, number][]

  for (let iter = 0; iter < 12; iter++) {
    const acc = centers.map(() => [0, 0, 0, 0] as [number, number, number, number])
    sample.forEach((px) => {
      let best = 0
      let bestD = Infinity
      centers.forEach((c, ci) => {
        const d = (px[0] - c[0]) ** 2 + (px[1] - c[1]) ** 2 + (px[2] - c[2]) ** 2
        if (d < bestD) {
          bestD = d
          best = ci
        }
      })
      acc[best][0] += px[0]
      acc[best][1] += px[1]
      acc[best][2] += px[2]
      acc[best][3]++
    })
    centers.forEach((_, ci) => {
      if (acc[ci][3]) {
        centers[ci] = [
          Math.round(acc[ci][0] / acc[ci][3]),
          Math.round(acc[ci][1] / acc[ci][3]),
          Math.round(acc[ci][2] / acc[ci][3]),
        ]
      }
    })
  }

  const hexes = centers
    .map((c) => rgbToHex(c[0], c[1], c[2]))
    .sort((a, b) => relativeLuminance(b) - relativeLuminance(a))
  return toSwatches(hexes)
}

export function exportTokens(swatches: Swatch[], format: ExportFormat): string {
  if (format === 'Tailwind') {
    return `// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
${swatches.map((s, i) => `        'palette-${i + 1}': '${s.hex}',`).join('\n')}
      }
    }
  }
}`
  }
  if (format === 'SCSS') {
    return `$palette: (
${swatches.map((s, i) => `  'palette-${i + 1}': ${s.hex}${i < swatches.length - 1 ? ',' : ''}`).join('\n')}
);`
  }
  return `:root {
${swatches.map((s, i) => `  --palette-${i + 1}: ${s.hex};`).join('\n')}
}`
}

export function normalizeHex(input: string): string | null {
  let v = input.trim().replace(/^#/, '').toUpperCase()
  if (/^[0-9A-F]{3}$/.test(v)) v = v.split('').map((c) => c + c).join('')
  if (!/^[0-9A-F]{6}$/.test(v)) return null
  return `#${v}`
}
