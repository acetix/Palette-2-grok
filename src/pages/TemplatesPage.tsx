import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Layers, Palette, Sparkles, Wand2 } from 'lucide-react'
import { SiteFooter, Toast, TopNav } from '../components/Layout'
import {
  generateGradientBatch,
  gradientCssValue,
  type GradientTemplate,
} from '../lib/gradients'
import {
  generatePaletteBatch,
  type PaletteTemplate,
} from '../lib/templates'

const PAGE_SIZE = 18

type Tab = 'palettes' | 'gradients'

export default function TemplatesPage() {
  const [tab, setTab] = useState<Tab>('palettes')
  const [palettes, setPalettes] = useState<PaletteTemplate[]>(() => generatePaletteBatch(0, PAGE_SIZE))
  const [gradients, setGradients] = useState<GradientTemplate[]>(() =>
    generateGradientBatch(0, PAGE_SIZE),
  )
  const [pCount, setPCount] = useState(PAGE_SIZE)
  const [gCount, setGCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const [toast, setToast] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  const loadMore = useCallback(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    window.setTimeout(() => {
      if (tab === 'palettes') {
        setPalettes((prev) => [...prev, ...generatePaletteBatch(prev.length, PAGE_SIZE)])
        setPCount((c) => c + PAGE_SIZE)
      } else {
        setGradients((prev) => [...prev, ...generateGradientBatch(prev.length, PAGE_SIZE)])
        setGCount((c) => c + PAGE_SIZE)
      }
      setLoading(false)
      loadingRef.current = false
    }, 280)
  }, [tab])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  function openPalette(t: PaletteTemplate) {
    const q = t.colors.map((c) => c.slice(1)).join(',')
    window.location.assign(`/?palette=${q}`)
  }

  function openGradientInCalor(g: GradientTemplate) {
    const params = new URLSearchParams({
      mode: 'gradient',
      name: g.name,
      type: g.type,
      angle: String(g.angle),
      stops: g.stops.map((s) => `${s.color.slice(1)}@${s.position}`).join(','),
    })
    window.location.assign(`/calordetel?${params.toString()}`)
  }

  function openPaletteInCalor(t: PaletteTemplate) {
    const params = new URLSearchParams({
      mode: 'palette',
      name: t.name,
      colors: t.colors.map((c) => c.slice(1)).join(','),
    })
    window.location.assign(`/calordetel?${params.toString()}`)
  }

  const totalLabel =
    tab === 'palettes'
      ? `${String(palettes.length).padStart(2, '0')}+ PALETTES`
      : `${String(gradients.length).padStart(2, '0')}+ GRADIENTS`

  return (
    <div className="templates-page page-enter">
      <TopNav
        right={
          <div className="nav-actions">
            <Link className="btn btn-secondary header-button" to="/calordetel" style={{ background: '#fff', color: '#2d2c29', borderColor: '#e7e5de' }}>
              <Wand2 size={14} /> Calordetel
            </Link>
            <Link className="btn btn-dark header-button" to="/">
              Open palette <ArrowUpRight size={14} />
            </Link>
          </div>
        }
      />

      <main className="container-fluid app-container templates-content">
        <div className="eyebrow">
          <Sparkles size={13} /> CURATED COLOUR STARTERS
        </div>
        <div className="templates-heading">
          <div>
            <h1>
              Good colour,
              <br />
              <em>already in motion.</em>
            </h1>
            <p>
              Infinite ready-made palettes and gradients — scroll for more, then make them yours in
              Palette or Calordetel.
            </p>
          </div>
          <span className="templates-total">{totalLabel}</span>
        </div>

        <div className="templates-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'palettes'}
            className={tab === 'palettes' ? 'active' : ''}
            onClick={() => setTab('palettes')}
          >
            <Palette size={14} /> Color templates
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'gradients'}
            className={tab === 'gradients' ? 'active' : ''}
            onClick={() => setTab('gradients')}
          >
            <Layers size={14} /> Color gradients
          </button>
        </div>

        {tab === 'palettes' ? (
          <div className="templates-grid">
            {palettes.map((t, i) => (
              <article key={t.id} className="template-card">
                <div className="template-swatches" aria-label={`${t.name} colours`}>
                  {t.colors.map((c) => (
                    <span key={c} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="template-card-info">
                  <div>
                    <span className="template-index">
                      {String(i + 1).padStart(2, '0')} · {t.mood}
                    </span>
                    <h2>{t.name}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      title="Customize in Calordetel"
                      onClick={() => openPaletteInCalor(t)}
                    >
                      <Wand2 size={14} />
                    </button>
                    <button type="button" title="Open in Palette" onClick={() => openPalette(t)}>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="template-hexes">
                  {t.colors.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="gradients-grid">
            {gradients.map((g, i) => (
              <article key={g.id} className="gradient-card">
                <div
                  className="gradient-preview"
                  style={{ background: gradientCssValue(g) }}
                  aria-label={`${g.name} gradient`}
                />
                <div className="gradient-stops">
                  {g.stops.map((s) => (
                    <span key={s.color + s.position} style={{ background: s.color }} />
                  ))}
                </div>
                <div className="gradient-card-info">
                  <div>
                    <span className="template-index">
                      {String(i + 1).padStart(2, '0')} · {g.mood}
                    </span>
                    <h2>{g.name}</h2>
                  </div>
                  <button type="button" title="Customize in Calordetel" onClick={() => openGradientInCalor(g)}>
                    <Wand2 size={14} />
                  </button>
                </div>
                <div className="gradient-meta">
                  <span>
                    {g.type} · {g.angle}°
                  </span>
                  <span>{g.stops.length} stops</span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="templates-sentinel" ref={sentinelRef}>
          {loading ? (
            <>
              <span className="spin" /> LOADING MORE
            </>
          ) : (
            <>SCROLL FOR ENDLESS COLOUR</>
          )}
        </div>
      </main>

      <SiteFooter />
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
