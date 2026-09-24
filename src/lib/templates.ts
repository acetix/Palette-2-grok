import { oklchToHex, toSwatches, type Swatch } from './colors'

export type PaletteTemplate = {
  id: string
  name: string
  mood: string
  colors: string[]
}

export const CURATED_TEMPLATES: PaletteTemplate[] = [
  { id: 'tuscan-sun', name: 'Tuscan Sun', mood: 'Warm · earthy', colors: ['#9C4F32', '#D98957', '#F1C27D', '#F4E8D1', '#5C6B48'] },
  { id: 'soft-focus', name: 'Soft Focus', mood: 'Gentle · romantic', colors: ['#F4E8E1', '#D8A89B', '#A85D54', '#EFE1B6', '#606C59'] },
  { id: 'midnight-tide', name: 'Midnight Tide', mood: 'Deep · coastal', colors: ['#0E2C3F', '#155A67', '#58A6A6', '#D1B77E', '#F2E7D2'] },
  { id: 'citrus-club', name: 'Citrus Club', mood: 'Bright · playful', colors: ['#EF6A38', '#F5B82E', '#F4E7B2', '#7D9A54', '#344C3D'] },
  { id: 'quiet-luxury', name: 'Quiet Luxury', mood: 'Refined · neutral', colors: ['#292622', '#71685E', '#B3A38E', '#DDD2C1', '#F5F0E8'] },
  { id: 'garden-party', name: 'Garden Party', mood: 'Fresh · botanical', colors: ['#315B43', '#73966A', '#BBCB9B', '#F1D1C2', '#E9AE62'] },
  { id: 'blue-hour', name: 'Blue Hour', mood: 'Calm · cool', colors: ['#202A44', '#445A83', '#8197B1', '#C2D1D8', '#F3EDE1'] },
  { id: 'peach-please', name: 'Peach Please', mood: 'Sweet · sunny', colors: ['#A8443B', '#E17B62', '#F2A889', '#F9D7B8', '#F6E9D5'] },
  { id: 'electric-bloom', name: 'Electric Bloom', mood: 'Bold · vivid', colors: ['#3C236B', '#7446B5', '#D2467A', '#F1A643', '#E9E75A'] },
  { id: 'moss-stone', name: 'Moss & Stone', mood: 'Natural · grounded', colors: ['#353F35', '#65705A', '#989982', '#C5BDA9', '#E8E2D5'] },
  { id: 'retro-riviera', name: 'Retro Riviera', mood: 'Vintage · playful', colors: ['#E7654F', '#F4B548', '#F3DBA5', '#3D8190', '#254F61'] },
  { id: 'lavender-haze', name: 'Lavender Haze', mood: 'Dreamy · soft', colors: ['#4C426D', '#8277A8', '#B5A9CC', '#E3D6E5', '#EFC5B5'] },
  { id: 'cocoa-studio', name: 'Cocoa Studio', mood: 'Rich · tactile', colors: ['#382A24', '#6C4434', '#A87555', '#D7B18B', '#F1E2CF'] },
  { id: 'poolside', name: 'Poolside', mood: 'Cool · cheerful', colors: ['#087E8B', '#20A6A6', '#8DD3C7', '#F4D35E', '#F6F3E7'] },
  { id: 'cherry-cola', name: 'Cherry Cola', mood: 'Moody · modern', colors: ['#271B29', '#572A3A', '#9B4053', '#D68969', '#EBD6BD'] },
  { id: 'alpine-air', name: 'Alpine Air', mood: 'Crisp · serene', colors: ['#314A5B', '#7795A3', '#B9CBCD', '#E6E8DB', '#C79669'] },
  { id: 'sunday-market', name: 'Sunday Market', mood: 'Artisan · warm', colors: ['#BC583B', '#E5A447', '#E9CB91', '#64734C', '#40545A'] },
  { id: 'monochrome-muse', name: 'Monochrome Muse', mood: 'Minimal · timeless', colors: ['#20201F', '#4D4C49', '#85837E', '#C2BFB7', '#F1EFE9'] },
]

const ADJECTIVES = [
  'Velvet', 'Amber', 'Lunar', 'Coral', 'Silk', 'Noir', 'Bloom', 'Misty', 'Golden', 'Arctic',
  'Rustic', 'Neon', 'Soft', 'Wild', 'Quiet', 'Bold', 'Crystal', 'Dusty', 'Solar', 'Forest',
  'Ivory', 'Crimson', 'Azure', 'Copper', 'Jade', 'Pearl', 'Shadow', 'Honey', 'Storm', 'Dawn',
  'Ember', 'Glacier', 'Saffron', 'Indigo', 'Olive', 'Rose', 'Smoke', 'Tidal', 'Desert', 'Meadow',
]

const NOUNS = [
  'Studio', 'Hour', 'Garden', 'Atelier', 'Wave', 'Grove', 'Room', 'Market', 'Horizon', 'Canvas',
  'Archive', 'Chapel', 'Harbor', 'Kitchen', 'Library', 'Terrace', 'Valley', 'Cove', 'Gallery', 'Nest',
  'Loom', 'Lantern', 'Symphony', 'Palette', 'Field', 'Circuit', 'Mirage', 'Cascade', 'Sanctuary', 'Bloom',
]

const MOODS = [
  'Warm · earthy', 'Cool · serene', 'Bold · vivid', 'Soft · romantic', 'Minimal · clean',
  'Vintage · nostalgic', 'Fresh · botanical', 'Deep · moody', 'Playful · bright', 'Refined · luxe',
  'Coastal · airy', 'Urban · modern', 'Dreamy · pastel', 'Natural · grounded', 'Electric · neon',
]

/** Deterministic PRNG from seed */
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

export function generatePaletteTemplate(index: number): PaletteTemplate {
  if (index < CURATED_TEMPLATES.length) {
    return { ...CURATED_TEMPLATES[index], id: CURATED_TEMPLATES[index].id }
  }
  const seed = index * 9973 + 42
  const rng = mulberry32(seed)
  const count = 5 + Math.floor(rng() * 2) // 5 or 6
  const baseHue = rng() * 360
  const harmony = Math.floor(rng() * 5) // mono, analog, complement, triad, split
  const colors: string[] = []

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1)
    let hue = baseHue
    if (harmony === 0) hue = baseHue + (rng() - 0.5) * 18
    else if (harmony === 1) hue = baseHue + (i - (count - 1) / 2) * 22
    else if (harmony === 2) hue = baseHue + (i % 2 === 0 ? 0 : 180) + (rng() - 0.5) * 12
    else if (harmony === 3) hue = baseHue + i * 120 + (rng() - 0.5) * 10
    else hue = baseHue + (i % 2 === 0 ? -30 : 30) + i * 8

    hue = ((hue % 360) + 360) % 360
    // Lightness arc: dark → light or light → dark
    const reverse = rng() > 0.55
    const l = reverse ? 22 + t * 68 : 88 - t * 66
    const c = 8 + rng() * 28 + (1 - Math.abs(t - 0.5) * 2) * 10
    colors.push(oklchToHex(l, c, hue))
  }

  // Sort by luminance-ish via lightness order already mostly set
  const name = `${pick(rng, ADJECTIVES)} ${pick(rng, NOUNS)}`
  const mood = pick(rng, MOODS)
  return {
    id: `gen-${index}`,
    name,
    mood,
    colors,
  }
}

export function generatePaletteBatch(start: number, count: number): PaletteTemplate[] {
  return Array.from({ length: count }, (_, i) => generatePaletteTemplate(start + i))
}

export function templateToSwatches(t: PaletteTemplate): Swatch[] {
  return toSwatches(t.colors)
}
