import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Sparkles, Wand2 } from 'lucide-react'
import { SiteFooter, Toast, TopNav } from '../components/Layout'
import {
  generateGradient,
  gradientCssValue,
  type GradientTemplate,
} from '../lib/gradients'
import { generatePaletteTemplate, type PaletteTemplate } from '../lib/templates'

const PAGE_SIZE = 24

type FeedItem =
  | { kind: 'palette'; data: PaletteTemplate; index: number }
  | { kind: 'gradient'; data: GradientTemplate; index: number }

function buildBatch(start: number, count: number): FeedItem[] {
  const items: FeedItem[] = []
  for (let i = 0; i < count; i++) {
    const n = start + i
    // Alternate palette / gradient so both live in one stream
    if (n % 2 === 0) {
      const pIdx = Math.floor(n / 2)
      items.push({ kind: 'palette', data: generatePaletteTemplate(pIdx), index: pIdx })
    } else {
      const gIdx = Math.floor(n / 2)
      items.push({ kind: 'gradient', data: generateGradient(gIdx), index: gIdx })
    }
  }
  return items
}

export default function TemplatesPage() {
  const [items, setItems] = useState<FeedItem[]>(() => buildBatch(0, PAGE_SIZE))
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
      setItems((prev) => [...prev, ...buildBatch(prev.length, PAGE_SIZE)])
      setLoading(false)
      loadingRef.current = false
    }, 280)
  }, [])

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

  const palCount = items.filter((i) => i.kind === 'palette').length
  const gradCount = items.filter((i) => i.kind === 'gradient').length

  return (
    <div className="templates-page page-enter">
      <TopNav
        right={
          <div className="nav-actions">
            <Link
              className="btn btn-secondary header-button"
              to="/calordetel"
              style={{ background: '#fff', color: '#2d2c29', borderColor: '#e7e5de' }}
            >
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
              Colour templates and gradients together in one endless feed — scroll for more, then
              open them in Palette or Calordetel.
            </p>
          </div>
          <span className="templates-total">
            {String(palCount).padStart(2, '0')} PAL · {String(gradCount).padStart(2, '0')} GRAD
          </span>
        </div>

        <div className="mixed-feed-label">
          <span>Color templates</span>
          <span className="mixed-feed-dot" />
          <span>Color gradients</span>
          <span className="mixed-feed-hint">ONE FEED · INFINITE SCROLL</span>
        </div>

        <div className="templates-grid mixed-feed-grid">
          {items.map((item, i) =>
            item.kind === 'palette' ? (
              <article key={`p-${item.data.id}-${i}`} className="template-card feed-card">
                <div className="feed-kind-badge feed-kind-palette">TEMPLATE</div>
                <div className="template-swatches" aria-label={`${item.data.name} colours`}>
                  {item.data.colors.map((c) => (
                    <span key={c} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="template-card-info">
                  <div>
                    <span className="template-index">
                      {String(i + 1).padStart(2, '0')} · {item.data.mood}
                    </span>
                    <h2>{item.data.name}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      title="Customize in Calordetel"
                      onClick={() => openPaletteInCalor(item.data)}
                    >
                      <Wand2 size={14} />
                    </button>
                    <button
                      type="button"
                      title="Open in Palette"
                      onClick={() => openPalette(item.data)}
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="template-hexes">
                  {item.data.colors.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </article>
            ) : (
              <article key={`g-${item.data.id}-${i}`} className="gradient-card feed-card">
                <div className="feed-kind-badge feed-kind-gradient">GRADIENT</div>
                <div
                  className="gradient-preview"
                  style={{ background: gradientCssValue(item.data) }}
                  aria-label={`${item.data.name} gradient`}
                />
                <div className="gradient-stops">
                  {item.data.stops.map((s) => (
                    <span key={s.color + s.position} style={{ background: s.color }} />
                  ))}
                </div>
                <div className="gradient-card-info">
                  <div>
                    <span className="template-index">
                      {String(i + 1).padStart(2, '0')} · {item.data.mood}
                    </span>
                    <h2>{item.data.name}</h2>
                  </div>
                  <button
                    type="button"
                    title="Customize in Calordetel"
                    onClick={() => openGradientInCalor(item.data)}
                  >
                    <Wand2 size={14} />
                  </button>
                </div>
                <div className="gradient-meta">
                  <span>
                    {item.data.type} · {item.data.angle}°
                  </span>
                  <span>{item.data.stops.length} stops</span>
                </div>
              </article>
            ),
          )}
        </div>

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
