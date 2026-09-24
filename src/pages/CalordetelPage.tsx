import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  Copy,
  Link2,
  Minus,
  Plus,
  Share2,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { SiteFooter, Toast, TopNav } from '../components/Layout'
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
import { normalizeHex } from '../lib/colors'

type Mode = 'palette' | 'gradient'

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

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  const cssCode = useMemo(() => {
    if (mode === 'palette') return paletteToCss(colors, name)
    return gradientToCss({ type: gType, angle, stops }, { name })
  }, [mode, colors, name, gType, angle, stops])

  const previewStyle = useMemo(() => {
    if (mode === 'palette') return undefined
    return { background: gradientCssValue({ type: gType, angle, stops }) }
  }, [mode, gType, angle, stops])

  // Keep URL shareable (debounced; skip if unchanged)
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
  }

  function removeColor(i: number) {
    if (colors.length <= 2) return
    setColors((prev) => prev.filter((_, idx) => idx !== i))
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
      notify('CSS copied to clipboard.')
      window.setTimeout(() => setCopiedCss(false), 1600)
    } catch {
      notify('Could not copy CSS.')
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

  function randomize() {
    if (mode === 'palette') {
      const t = generatePaletteTemplate(Math.floor(Math.random() * 5000) + 20)
      setName(t.name)
      setColors(t.colors)
    } else {
      const g = generateGradient(Math.floor(Math.random() * 5000) + 20)
      setName(g.name)
      setGType(g.type)
      setAngle(g.angle)
      setStops(g.stops)
    }
    notify('Fresh colours, just for you.')
  }

  function openInPalette() {
    if (mode !== 'palette') return
    const q = colors.map((c) => c.slice(1)).join(',')
    window.location.assign(`/?palette=${q}`)
  }

  return (
    <div className="calor-page page-enter">
      <TopNav
        right={
          <div className="nav-actions">
            <Link className="btn btn-secondary header-button" to="/templates" style={{ background: '#fff', color: '#2d2c29', borderColor: '#e7e5de' }}>
              Templates
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
              Build colour templates and gradients with live CSS. Tweak every stop, copy tokens, and
              share a link that reopens your exact design.
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
            <div
              className={`calor-preview-stage ${mode === 'palette' ? 'is-palette' : ''}`}
              style={previewStyle}
            >
              {mode === 'palette'
                ? colors.map((c, i) => <div key={`${c}-${i}`} style={{ background: c }} />)
                : null}
              <span className="calor-live-label">LIVE PREVIEW</span>
            </div>
            <div className="calor-chip-row">
              {mode === 'palette' ? (
                colors.map((c) => (
                  <span key={c} className="calor-chip" style={{ borderLeft: `3px solid ${c}` }}>
                    {c}
                  </span>
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
                <Sparkles size={14} /> Surprise me
              </button>
              {mode === 'palette' && (
                <button type="button" className="btn btn-secondary" onClick={openInPalette}>
                  Open in Palette <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="calor-controls">
            {mode === 'palette' ? (
              <section className="calor-card">
                <h3>Palette colours</h3>
                <div className="calor-stops-list">
                  {colors.map((c, i) => (
                    <div key={i} className="calor-stop-row">
                      <input
                        type="color"
                        value={c}
                        onChange={(e) => updateColor(i, e.target.value)}
                        aria-label={`Colour ${i + 1}`}
                      />
                      <input
                        type="text"
                        value={c}
                        onChange={(e) => updateColor(i, e.target.value)}
                      />
                      <span style={{ font: '10px DM Mono, monospace', color: '#999' }}>
                        #{i + 1}
                      </span>
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
                    </div>
                  )}
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
              <h3>Generated CSS</h3>
              <pre className="calor-css-box">{cssCode}</pre>
              <div className="calor-actions">
                <button type="button" className="btn btn-dark" onClick={copyCss}>
                  {copiedCss ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCss ? 'Copied!' : 'Copy CSS'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={copyShareLink}>
                  {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                  {copiedLink ? 'Link copied' : 'Copy share link'}
                </button>
              </div>
              <p className="share-note" style={{ textAlign: 'left', marginTop: 10 }}>
                <Link2 size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> The URL
                updates as you edit — share it anytime to reopen this exact template or gradient.
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
