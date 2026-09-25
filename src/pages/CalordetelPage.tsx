import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FlipHorizontal,
  Link2,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shuffle,
  Sparkles,
  Wand2,
} from 'lucide-react'
import {SiteFooter, Toast, TopNav} from '../components/Layout'
import {
  decodeCalorState,
  encodeCalorState,
  gradientToCss,
  gradientCssValue,
  paletteToCss,
  type GradientStop,
  type GradientTemplate,
} from '../lib/gradients'
import { generateGradient } from '../lib/gradients'
import { generatePaletteTemplate } from '../lib/templates'
import { contrastRatio, hexToRgb, normalizeHex, oklchToHex, rgbToOklch } from '../lib/colors'

type Mode = 'palette' | 'gradient'
type CssFmt = 'css' | 'scss' | 'tailwind' | 'svg'
type Harmony = 'none' | 'mono' | 'analog' | 'complement' | 'triad' | 'split'

function parseQuery(params: URLSearchParams): {
  mode: Mode
  name: string
  colors: string[]
  type: GradientTemplate['type']
  angle: number
  stops: GradientStop[]
} | null {
  const shared = params.get('s')
  if (shared) {
    const st = decodeCalorState(shared)
    if (st) {
      return {
        mode: st.mode,
        name: st.name || 'Untitled',
        colors: st.colors || ['#E65F39', '#F3A27E', '#435BC3', '#ACA1E8', '#F4E8D7'],
        type: st.type || 'linear',
        angle: st.angle ?? 135,
        stops: st.stops || [
          { color: '#E65F39', position: 0 },
          { color: '#435BC3', position: 100 },
        ],
      }
    }
  }

  const mode = (params.get('mode') as Mode) || null
  if (!mode && !params.get('colors') && !params.get('stops')) return null

  const name = params.get('name') || 'Custom colour'
  const colors = (params.get('colors') || 'E65F39,F3A27E,435BC3,ACA1E8,F4E8D7')
    .split(',')
    .map((c) => `#${c.replace(/^#/, '').toUpperCase()}`)
    .filter((c) => /^#[0-9A-F]{6}$/i.test(c))

  const type = (params.get('type') as GradientTemplate['type']) || 'linear'
  const angle = Number(params.get('angle') || 135)
  const stops = (params.get('stops') || 'E65F39@0,435BC3@100')
    .split(',')
    .map((part) => {
      const [col, pos] = part.split('@')
      return {
        color: `#${(col || '888888').replace(/^#/, '').toUpperCase()}`,
        position: Number(pos ?? 0),
      }
    })
    .filter((s) => /^#[0-9A-F]{6}$/i.test(s.color))

  return {
    mode: mode || (params.get('stops') ? 'gradient' : 'palette'),
    name,
    colors: colors.length ? colors : ['#E65F39', '#F3A27E', '#435BC3'],
    type,
    angle: Number.isFinite(angle) ? angle : 135,
    stops: stops.length
      ? stops
      : [
          { color: '#E65F39', position: 0 },
          { color: '#435BC3', position: 100 },
        ],
  }
}

function shiftHue(hex: string, deg: number): string {
  const [r, g, b] = hexToRgb(hex)
  const o = rgbToOklch(r, g, b)
  return oklchToHex(o.l, o.c, (o.h + deg + 360) % 360)
}

function applyHarmony(base: string, kind: Harmony, count: number): string[] {
  if (kind === 'none' || count < 2) return Array.from({ length: count }, () => base)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1)
    if (kind === 'mono') {
      const [r, g, b] = hexToRgb(base)
      const o = rgbToOklch(r, g, b)
      out.push(oklchToHex(22 + t * 60, o.c * (0.7 + t * 0.3), o.h))
    } else if (kind === 'analog') out.push(shiftHue(base, -30 + t * 60))
    else if (kind === 'complement') out.push(shiftHue(base, i % 2 === 0 ? 0 : 180))
    else if (kind === 'triad') out.push(shiftHue(base, (i % 3) * 120))
    else out.push(shiftHue(base, i % 2 === 0 ? -30 : 150 + (i > 1 ? 20 : 0)))
  }
  return out
}

function buildExport(
  mode: Mode,
  name: string,
  colors: string[],
  gType: GradientTemplate['type'],
  angle: number,
  stops: GradientStop[],
  fmt: CssFmt,
): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'custom'

  if (mode === 'palette') {
    if (fmt === 'scss') {
      return `$palette: (\n${colors.map((c, i) => `  'c${i + 1}': ${c}${i < colors.length - 1 ? ',' : ''}`).join('\n')}\n);`
    }
    if (fmt === 'tailwind') {
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors.map((c, i) => `        '${slug}-${i + 1}': '${c}',`).join('\n')}\n      }\n    }\n  }\n}`
    }
    if (fmt === 'svg') {
      const w = 600
      const h = 120
      const cell = w / colors.length
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${colors
        .map((c, i) => `  <rect x="${(i * cell).toFixed(1)}" y="0" width="${cell.toFixed(1)}" height="${h}" fill="${c}"/>`)
        .join('\n')}\n</svg>`
    }
    return paletteToCss(colors, name)
  }

  const cssVal = gradientCssValue({ type: gType, angle, stops })
  if (fmt === 'scss') return `$gradient-${slug}: ${cssVal};`
  if (fmt === 'tailwind') {
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      backgroundImage: {\n        '${slug}': '${cssVal}',\n      }\n    }\n  }\n}`
  }
  if (fmt === 'svg') {
    const stopsXml = [...stops]
      .sort((a, b) => a.position - b.position)
      .map((s) => `      <stop offset="${s.position}%" stop-color="${s.color}"/>`)
      .join('\n')
    if (gType === 'radial') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360">\n  <defs>\n    <radialGradient id="g" cx="50%" cy="50%" r="70%">\n${stopsXml}\n    </radialGradient>\n  </defs>\n  <rect width="100%" height="100%" fill="url(#g)"/>\n</svg>`
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360">\n  <defs>\n    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle} 0.5 0.5)">\n${stopsXml}\n    </linearGradient>\n  </defs>\n  <rect width="100%" height="100%" fill="url(#g)"/>\n</svg>`
  }
  return gradientToCss({ type: gType, angle, stops }, { name })
}

export default function CalordetelPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = useMemo(() => parseQuery(searchParams), []) // eslint-disable-line react-hooks/exhaustive-deps

  const seedPal = generatePaletteTemplate(3)
  const seedGrad = generateGradient(7)

  const [mode, setMode] = useState<Mode>(initial?.mode || 'palette')
  const [name, setName] = useState(initial?.name || seedPal.name)
  const [colors, setColors] = useState<string[]>(initial?.colors || seedPal.colors)
  const [gType, setGType] = useState<GradientTemplate['type']>(initial?.type || seedGrad.type)
  const [angle, setAngle] = useState(initial?.angle ?? seedGrad.angle)
  const [stops, setStops] = useState<GradientStop[]>(initial?.stops || seedGrad.stops)
  const [toast, setToast] = useState('')
  const [copiedCss, setCopiedCss] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [cssFmt, setCssFmt] = useState<CssFmt>('css')
  const [harmony, setHarmony] = useState<Harmony>('none')
  const [baseColor, setBaseColor] = useState('#E65F39')
  const [previewUI, setPreviewUI] = useState<'stage' | 'ui' | 'type'>('stage')
  const [locked, setLocked] = useState<boolean[]>([])

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  const cssCode = useMemo(
    () => buildExport(mode, name, colors, gType, angle, stops, cssFmt),
    [mode, name, colors, gType, angle, stops, cssFmt],
  )

  const previewStyle = useMemo(() => {
    if (mode === 'palette') return undefined
    return { background: gradientCssValue({ type: gType, angle, stops }) }
  }, [mode, gType, angle, stops])

  const contrastPairs = useMemo(() => {
    if (colors.length < 2) return []
    const pairs: { a: string; b: string; ratio: number }[] = []
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        pairs.push({ a: colors[i], b: colors[j], ratio: contrastRatio(colors[i], colors[j]) })
      }
    }
    return pairs.sort((x, y) => y.ratio - x.ratio).slice(0, 3)
  }, [colors])

  useEffect(() => {
    const state = {
      mode,
      name,
      colors: mode === 'palette' ? colors : undefined,
      type: mode === 'gradient' ? gType : undefined,
      angle: mode === 'gradient' ? angle : undefined,
      stops: mode === 'gradient' ? stops : undefined,
    }
    const s = encodeCalorState(state)
    const id = window.setTimeout(() => {
      const current = new URLSearchParams(window.location.search).get('s')
      if (current === s) return
      setSearchParams({ s }, { replace: true })
    }, 200)
    return () => window.clearTimeout(id)
  }, [mode, name, colors, gType, angle, stops, setSearchParams])

  function updateColor(i: number, raw: string) {
    const n = normalizeHex(raw)
    if (!n) return
    setColors((prev) => prev.map((c, idx) => (idx === i ? n : c)))
  }

  function addColor() {
    if (colors.length >= 12) return
    setColors((prev) => [...prev, prev[prev.length - 1] || '#CCCCCC'])
    setLocked((prev) => [...prev, false])
  }

  function removeColor(i: number) {
    if (colors.length <= 2) return
    setColors((prev) => prev.filter((_, idx) => idx !== i))
    setLocked((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateStop(i: number, patch: Partial<GradientStop>) {
    setStops((prev) =>
      prev.map((s, idx) => {
        if (idx !== i) return s
        const next = { ...s, ...patch }
        if (patch.color) {
          const n = normalizeHex(patch.color)
          if (n) next.color = n
        }
        if (patch.position != null) next.position = Math.max(0, Math.min(100, patch.position))
        return next
      }),
    )
  }

  function addStop() {
    if (stops.length >= 8) return
    const last = stops[stops.length - 1]
    setStops((prev) => [
      ...prev.slice(0, -1),
      { color: last?.color || '#888888', position: Math.min(90, (last?.position ?? 100) - 10) },
      { ...last, position: 100 },
    ])
  }

  function removeStop(i: number) {
    if (stops.length <= 2) return
    setStops((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(cssCode)
      setCopiedCss(true)
      notify('Code copied to clipboard.')
      window.setTimeout(() => setCopiedCss(false), 1600)
    } catch {
      notify('Could not copy.')
    }
  }

  async function copyShareLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      notify('Share link copied — anyone can open this design.')
      window.setTimeout(() => setCopiedLink(false), 1600)
    } catch {
      notify(url)
    }
  }

  function downloadFile() {
    const ext = cssFmt === 'svg' ? 'svg' : cssFmt === 'scss' ? 'scss' : cssFmt === 'tailwind' ? 'js' : 'css'
    const mime =
      cssFmt === 'svg' ? 'image/svg+xml' : cssFmt === 'tailwind' ? 'text/javascript' : 'text/plain'
    const blob = new Blob([cssCode], { type: mime })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${name.replace(/\s+/g, '-').toLowerCase() || 'calordetel'}.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
    notify(`Downloaded .${ext} file.`)
  }

  function randomize() {
    if (mode === 'palette') {
      const t = generatePaletteTemplate(Math.floor(Math.random() * 5000) + 20)
      setName(t.name)
      setColors((prev) => {
        if (!locked.some(Boolean)) return t.colors
        const targetLen = Math.max(prev.length, t.colors.length)
        return Array.from({ length: Math.min(targetLen, 12) }, (_, i) =>
          locked[i] && prev[i] ? prev[i] : t.colors[i] || prev[i] || '#CCCCCC',
        )
      })
    } else {
      const g = generateGradient(Math.floor(Math.random() * 5000) + 20)
      setName(g.name)
      setGType(g.type)
      setAngle(g.angle)
      setStops(g.stops)
    }
    notify('Fresh colours, just for you.')
  }

  function reverseAll() {
    if (mode === 'palette') setColors((c) => [...c].reverse())
    else
      setStops((s) =>
        [...s]
          .map((st) => ({ ...st, position: 100 - st.position }))
          .sort((a, b) => a.position - b.position),
      )
    notify('Reversed.')
  }

  function paletteToGradient() {
    const nextStops = colors.map((c, i) => ({
      color: c,
      position: Math.round((i / Math.max(1, colors.length - 1)) * 100),
    }))
    setStops(nextStops)
    setMode('gradient')
    setGType('linear')
    setAngle(135)
    notify('Converted palette → gradient.')
  }

  function gradientToPalette() {
    const cols = [...stops]
      .sort((a, b) => a.position - b.position)
      .map((s) => s.color)
    setColors(cols.length >= 2 ? cols : ['#E65F39', '#435BC3'])
    setMode('palette')
    notify('Converted gradient → palette.')
  }

  function applyHarmonyNow() {
    if (harmony === 'none') return
    const next = applyHarmony(baseColor, harmony, Math.max(colors.length, 5))
    setColors(
      next.map((c, i) => (locked[i] && colors[i] ? colors[i] : c)).slice(0, Math.max(colors.length, 5)),
    )
    setMode('palette')
    notify(`Applied ${harmony} harmony.`)
  }

  function distributeStops() {
    setStops((prev) =>
      prev.map((s, i) => ({
        ...s,
        position: Math.round((i / Math.max(1, prev.length - 1)) * 100),
      })),
    )
    notify('Stops evenly spaced.')
  }

  function openInPalette() {
    const cols = mode === 'palette' ? colors : stops.map((s) => s.color)
    const q = cols.map((c) => c.slice(1)).join(',')
    window.location.assign(`/?palette=${q}`)
  }

  async function copyColor(c: string) {
    try {
      await navigator.clipboard.writeText(c)
      notify(`Copied ${c}`)
    } catch {
      notify(c)
    }
  }

  const bgForUI = mode === 'gradient' ? gradientCssValue({ type: gType, angle, stops }) : colors[0] || '#eee'
  const fgForUI = mode === 'palette' ? colors[colors.length - 1] || '#222' : stops[stops.length - 1]?.color || '#fff'
  const accent = mode === 'palette' ? colors[1] || colors[0] : stops[0]?.color || '#e65f39'

  return (
    <div className="calor-page page-enter">
      <TopNav
        right={
          <div className="nav-actions">
            <Link
              className="btn btn-secondary header-button"
              to="/templates"
              style={{ background: '#fff', color: '#2d2c29', borderColor: '#e7e5de' }}
            >
              c.Templates
            </Link>
            <Link className="btn btn-dark header-button" to="/">
              Open palette <ArrowUpRight size={14} />
            </Link>
          </div>
        }
      />

      <main className="container-fluid app-container calor-content">
        <div className="eyebrow">
          <Wand2 size={13} /> CALORDETEL · CSS STUDIO
        </div>
        <div className="templates-heading" style={{ marginBottom: 18 }}>
          <div>
            <h1>
              Customize.
              <br />
              <em>Share the CSS.</em>
            </h1>
            <p>
              Build colour templates and gradients with live CSS, harmony tools, UI previews, multi-format
              export, and shareable links.
            </p>
          </div>
        </div>

        <div className="calor-mode-switch" role="tablist">
          <button
            type="button"
            className={mode === 'palette' ? 'active' : ''}
            onClick={() => setMode('palette')}
          >
            Color template
          </button>
          <button
            type="button"
            className={mode === 'gradient' ? 'active' : ''}
            onClick={() => setMode('gradient')}
          >
            Color gradient
          </button>
        </div>

        <div className="calor-layout">
          <div className="calor-preview-panel">
            <input
              className="calor-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Design name"
            />

            <div className="calor-preview-tabs">
              {(['stage', 'ui', 'type'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={previewUI === t ? 'active' : ''}
                  onClick={() => setPreviewUI(t)}
                >
                  {t === 'stage' ? 'Stage' : t === 'ui' ? 'UI kit' : 'Type'}
                </button>
              ))}
            </div>

            {previewUI === 'stage' && (
              <div
                className={`calor-preview-stage ${mode === 'palette' ? 'is-palette' : ''}`}
                style={previewStyle}
              >
                {mode === 'palette'
                  ? colors.map((c, i) => <div key={`${c}-${i}`} style={{ background: c }} />)
                  : null}
                <span className="calor-live-label">LIVE PREVIEW</span>
              </div>
            )}

            {previewUI === 'ui' && (
              <div className="calor-ui-kit" style={{ background: mode === 'palette' ? colors[colors.length - 1] || '#f8f7f3' : undefined, backgroundImage: mode === 'gradient' ? bgForUI : undefined }}>
                <div className="calor-ui-card" style={{ background: mode === 'palette' ? colors[0] : 'rgba(255,255,255,.92)' }}>
                  <strong style={{ color: mode === 'palette' ? fgForUI : '#222' }}>{name || 'Card title'}</strong>
                  <p style={{ color: mode === 'palette' ? fgForUI : '#666', opacity: 0.85 }}>
                    Sample interface using your colours.
                  </p>
                  <button type="button" style={{ background: accent, color: '#fff', border: 0, borderRadius: 4, padding: '8px 12px', fontWeight: 600 }}>
                    Primary action
                  </button>
                </div>
                <div className="calor-ui-row">
                  {(mode === 'palette' ? colors : stops.map((s) => s.color)).slice(0, 5).map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </div>
              </div>
            )}

            {previewUI === 'type' && (
              <div
                className="calor-type-preview"
                style={{
                  background: mode === 'palette' ? colors[0] : undefined,
                  backgroundImage: mode === 'gradient' ? bgForUI : undefined,
                  color: mode === 'palette' ? colors[colors.length - 1] : stops[stops.length - 1]?.color,
                }}
              >
                <p className="calor-type-display">Aa</p>
                <p className="calor-type-body">The quick brown fox jumps over the lazy dog.</p>
                <p className="calor-type-meta">Display · Body · Caption</p>
              </div>
            )}

            <div className="calor-chip-row">
              {mode === 'palette' ? (
                colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="calor-chip"
                    style={{ borderLeft: `3px solid ${c}` }}
                    onClick={() => copyColor(c)}
                    title="Copy colour"
                  >
                    {c}
                  </button>
                ))
              ) : (
                <>
                  <span className="calor-chip">{gType}</span>
                  <span className="calor-chip">{angle}°</span>
                  <span className="calor-chip">{stops.length} stops</span>
                </>
              )}
            </div>

            <div className="calor-actions">
              <button type="button" className="btn btn-dark" onClick={randomize}>
                <Shuffle size={14} /> Surprise me
              </button>
              <button type="button" className="btn btn-secondary" onClick={reverseAll}>
                <FlipHorizontal size={14} /> Reverse
              </button>
              {mode === 'palette' ? (
                <button type="button" className="btn btn-secondary" onClick={paletteToGradient}>
                  <ArrowLeftRight size={14} /> → Gradient
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={gradientToPalette}>
                  <ArrowLeftRight size={14} /> → Palette
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={openInPalette}>
                Open in Palette <ArrowUpRight size={14} />
              </button>
            </div>

            {mode === 'palette' && contrastPairs.length > 0 && (
              <div className="calor-contrast-mini">
                <h4>Best contrast pairs</h4>
                {contrastPairs.map((p) => (
                  <div key={p.a + p.b} className="calor-contrast-row">
                    <span className="calor-contrast-swatch">
                      <i style={{ background: p.a }} />
                      <i style={{ background: p.b }} />
                    </span>
                    <strong>{p.ratio.toFixed(2)}:1</strong>
                    <span className={p.ratio >= 4.5 ? 'pass' : 'fail'}>
                      {p.ratio >= 7 ? 'AAA' : p.ratio >= 4.5 ? 'AA' : 'Fail'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="calor-controls">
            {mode === 'palette' ? (
              <>
                <section className="calor-card">
                  <h3>Harmony generator</h3>
                  <div className="calor-field">
                    <label>
                      BASE COLOUR <strong>{baseColor}</strong>
                    </label>
                    <div className="calor-stop-row" style={{ gridTemplateColumns: '28px 1fr' }}>
                      <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} />
                      <input
                        type="text"
                        value={baseColor}
                        onChange={(e) => {
                          const n = normalizeHex(e.target.value)
                          if (n) setBaseColor(n)
                          else setBaseColor(e.target.value)
                        }}
                      />
                    </div>
                  </div>
                  <div className="calor-field">
                    <label>HARMONY</label>
                    <select value={harmony} onChange={(e) => setHarmony(e.target.value as Harmony)}>
                      <option value="none">Manual only</option>
                      <option value="mono">Monochrome</option>
                      <option value="analog">Analogous</option>
                      <option value="complement">Complementary</option>
                      <option value="triad">Triad</option>
                      <option value="split">Split complementary</option>
                    </select>
                  </div>
                  <button type="button" className="btn btn-dark" style={{ width: '100%' }} onClick={applyHarmonyNow} disabled={harmony === 'none'}>
                    <Sparkles size={14} /> Apply harmony
                  </button>
                </section>

                <section className="calor-card">
                  <h3>Palette colours</h3>
                  <div className="calor-stops-list">
                    {colors.map((c, i) => (
                      <div key={i} className="calor-stop-row calor-stop-row-lock">
                        <input
                          type="color"
                          value={c}
                          onChange={(e) => updateColor(i, e.target.value)}
                          aria-label={`Colour ${i + 1}`}
                        />
                        <input type="text" value={c} onChange={(e) => updateColor(i, e.target.value)} />
                        <button
                          type="button"
                          className={locked[i] ? 'lock-on' : ''}
                          title={locked[i] ? 'Unlock' : 'Lock colour'}
                          onClick={() =>
                            setLocked((prev) => {
                              const next = [...prev]
                              next[i] = !next[i]
                              return next
                            })
                          }
                        >
                          {locked[i] ? '🔒' : '🔓'}
                        </button>
                        <button type="button" onClick={() => removeColor(i)} aria-label="Remove">
                          <Minus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="calor-add-stop" onClick={addColor}>
                    <Plus size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Add colour
                  </button>
                </section>
              </>
            ) : (
              <>
                <section className="calor-card">
                  <h3>Gradient settings</h3>
                  <div className="calor-field">
                    <label>
                      TYPE <strong>{gType}</strong>
                    </label>
                    <select
                      value={gType}
                      onChange={(e) => setGType(e.target.value as GradientTemplate['type'])}
                    >
                      <option value="linear">linear-gradient</option>
                      <option value="radial">radial-gradient</option>
                      <option value="conic">conic-gradient</option>
                    </select>
                  </div>
                  {(gType === 'linear' || gType === 'conic') && (
                    <div className="calor-field">
                      <label>
                        ANGLE <strong>{angle}°</strong>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={angle}
                        onChange={(e) => setAngle(+e.target.value)}
                      />
                      <div className="calor-angle-presets">
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                          <button key={a} type="button" onClick={() => setAngle(a)} className={angle === a ? 'active' : ''}>
                            {a}°
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={distributeStops}>
                    <RotateCcw size={14} /> Evenly space stops
                  </button>
                </section>
                <section className="calor-card">
                  <h3>Color stops</h3>
                  <div className="calor-stops-list">
                    {stops.map((s, i) => (
                      <div key={i} className="calor-stop-row">
                        <input
                          type="color"
                          value={s.color}
                          onChange={(e) => updateStop(i, { color: e.target.value })}
                        />
                        <input
                          type="text"
                          value={s.color}
                          onChange={(e) => updateStop(i, { color: e.target.value })}
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={s.position}
                          onChange={(e) => updateStop(i, { position: +e.target.value })}
                          aria-label="Stop position %"
                        />
                        <button type="button" onClick={() => removeStop(i)} aria-label="Remove stop">
                          <Minus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="calor-add-stop" onClick={addStop}>
                    <Plus size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Add stop
                  </button>
                </section>
              </>
            )}

            <section className="calor-card">
              <h3>Export & share</h3>
              <div className="export-switch calor-fmt-switch">
                {(['css', 'scss', 'tailwind', 'svg'] as CssFmt[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={cssFmt === f ? 'active' : ''}
                    onClick={() => setCssFmt(f)}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <pre className="calor-css-box">{cssCode}</pre>
              <div className="calor-actions">
                <button type="button" className="btn btn-dark" onClick={copyCss}>
                  {copiedCss ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCss ? 'Copied!' : 'Copy code'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={downloadFile}>
                  <Download size={14} /> Download
                </button>
                <button type="button" className="btn btn-secondary" onClick={copyShareLink}>
                  {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                  {copiedLink ? 'Link copied' : 'Share link'}
                </button>
              </div>
              <p className="share-note" style={{ textAlign: 'left', marginTop: 10 }}>
                <Link2 size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> URL updates as
                you edit — share anytime to reopen this exact design.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
