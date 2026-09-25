import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bookmark, BookmarkCheck, Search, Sparkles, Trash2, Wand2 } from 'lucide-react'
import {SiteFooter, Toast, TopNav} from '../components/Layout'
import {
  generateGradient,
  gradientCssValue,
  type GradientStop,
  type GradientTemplate,
} from '../lib/gradients'
import { generatePaletteTemplate, type PaletteTemplate } from '../lib/templates'

const PAGE_SIZE = 24
const SAVED_KEY = 'paletto-saved-templates'

type KindFilter = 'all' | 'palette' | 'gradient' | 'saved'
type SortMode = 'default' | 'name-asc' | 'name-desc' | 'colors-asc' | 'colors-desc'
type GradTypeFilter = 'all' | 'linear' | 'radial' | 'conic'

type FeedItem =
  | { kind: 'palette'; data: PaletteTemplate; index: number }
  | { kind: 'gradient'; data: GradientTemplate; index: number }

type SavedItem =
  | {
      id: string
      kind: 'palette'
      name: string
      mood: string
      colors: string[]
      savedAt: number
    }
  | {
      id: string
      kind: 'gradient'
      name: string
      mood: string
      type: GradientTemplate['type']
      angle: number
      stops: GradientStop[]
      savedAt: number
    }

function loadSaved(): SavedItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function saveKeyFor(item: FeedItem): string {
  if (item.kind === 'palette') return `palette:${item.data.id}`
  return `gradient:${item.data.id}`
}

const MOOD_FILTERS = [
  { id: 'all', label: 'All moods' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'bold', label: 'Bold' },
  { id: 'soft', label: 'Soft' },
  { id: 'natural', label: 'Natural' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'vivid', label: 'Vivid' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'dreamy', label: 'Dreamy' },
] as const

function buildBatch(start: number, count: number, kind: Exclude<KindFilter, "saved">): FeedItem[] {
  const items: FeedItem[] = []
  for (let i = 0; i < count; i++) {
    const n = start + i
    if (kind === 'palette') {
      items.push({ kind: 'palette', data: generatePaletteTemplate(n), index: n })
    } else if (kind === 'gradient') {
      items.push({ kind: 'gradient', data: generateGradient(n), index: n })
    } else if (n % 2 === 0) {
      const pIdx = Math.floor(n / 2)
      items.push({ kind: 'palette', data: generatePaletteTemplate(pIdx), index: pIdx })
    } else {
      const gIdx = Math.floor(n / 2)
      items.push({ kind: 'gradient', data: generateGradient(gIdx), index: gIdx })
    }
  }
  return items
}

function matchesMood(mood: string, filter: string): boolean {
  if (filter === 'all') return true
  return mood.toLowerCase().includes(filter.toLowerCase())
}

export default function TemplatesPage() {
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [moodFilter, setMoodFilter] = useState('all')
  const [gradType, setGradType] = useState<GradTypeFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('default')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<FeedItem[]>(() => buildBatch(0, PAGE_SIZE, 'all'))
  const [saved, setSaved] = useState<SavedItem[]>(() => loadSaved())
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const [toast, setToast] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const feedKey = useRef(0)

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved.slice(0, 60)))
  }, [saved])

  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved])

  function toggleSavePalette(t: PaletteTemplate) {
    const id = `palette:${t.id}`
    setSaved((prev) => {
      if (prev.some((s) => s.id === id)) {
        notify('Removed from saved.')
        return prev.filter((s) => s.id !== id)
      }
      notify('Template saved in this browser.')
      return [
        {
          id,
          kind: 'palette' as const,
          name: t.name,
          mood: t.mood,
          colors: t.colors,
          savedAt: Date.now(),
        },
        ...prev,
      ].slice(0, 60)
    })
  }

  function toggleSaveGradient(g: GradientTemplate) {
    const id = `gradient:${g.id}`
    setSaved((prev) => {
      if (prev.some((s) => s.id === id)) {
        notify('Removed from saved.')
        return prev.filter((s) => s.id !== id)
      }
      notify('Gradient saved in this browser.')
      return [
        {
          id,
          kind: 'gradient' as const,
          name: g.name,
          mood: g.mood,
          type: g.type,
          angle: g.angle,
          stops: g.stops,
          savedAt: Date.now(),
        },
        ...prev,
      ].slice(0, 60)
    })
  }

  function removeSaved(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id))
    notify('Removed from saved.')
  }

  // Reset feed when primary kind filter changes so infinite scroll stays correct
  useEffect(() => {
    if (kindFilter === 'saved') return
    feedKey.current += 1
    const batchKind = kindFilter === 'all' ? 'all' : kindFilter
    setItems(buildBatch(0, PAGE_SIZE, batchKind))
    loadingRef.current = false
    setLoading(false)
  }, [kindFilter])

  const loadMore = useCallback(() => {
    if (kindFilter === 'saved') return
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    const key = feedKey.current
    const batchKind = kindFilter === 'all' ? 'all' : kindFilter
    window.setTimeout(() => {
      if (key !== feedKey.current) {
        loadingRef.current = false
        setLoading(false)
        return
      }
      setItems((prev) => [...prev, ...buildBatch(prev.length, PAGE_SIZE, batchKind)])
      setLoading(false)
      loadingRef.current = false
    }, 280)
  }, [kindFilter])

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

  // If filters leave too few visible items, keep loading
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (kindFilter === 'saved') {
      let list: FeedItem[] = saved.map((s) => {
        if (s.kind === 'palette') {
          return {
            kind: 'palette' as const,
            index: s.savedAt,
            data: { id: s.id, name: s.name, mood: s.mood, colors: s.colors },
          }
        }
        return {
          kind: 'gradient' as const,
          index: s.savedAt,
          data: {
            id: s.id,
            name: s.name,
            mood: s.mood,
            type: s.type,
            angle: s.angle,
            stops: s.stops,
          },
        }
      })
      list = list.filter((item) => {
        if (q && !item.data.name.toLowerCase().includes(q) && !item.data.mood.toLowerCase().includes(q))
          return false
        if (!matchesMood(item.data.mood, moodFilter)) return false
        if (item.kind === 'gradient' && gradType !== 'all' && item.data.type !== gradType) return false
        return true
      })
      return list
    }

    let list = items.filter((item) => {
      if (item.kind === 'palette') {
        if (kindFilter === 'gradient') return false
        if (gradType !== 'all') return false
        if (!matchesMood(item.data.mood, moodFilter)) return false
        if (q && !item.data.name.toLowerCase().includes(q) && !item.data.mood.toLowerCase().includes(q))
          return false
        return true
      }
      if (kindFilter === 'palette') return false
      if (gradType !== 'all' && item.data.type !== gradType) return false
      if (!matchesMood(item.data.mood, moodFilter)) return false
      if (q && !item.data.name.toLowerCase().includes(q) && !item.data.mood.toLowerCase().includes(q))
        return false
      return true
    })

    if (sortMode === 'name-asc') {
      list = [...list].sort((a, b) => a.data.name.localeCompare(b.data.name))
    } else if (sortMode === 'name-desc') {
      list = [...list].sort((a, b) => b.data.name.localeCompare(a.data.name))
    } else if (sortMode === 'colors-asc' || sortMode === 'colors-desc') {
      const count = (it: FeedItem) =>
        it.kind === 'palette' ? it.data.colors.length : it.data.stops.length
      list = [...list].sort((a, b) =>
        sortMode === 'colors-asc' ? count(a) - count(b) : count(b) - count(a),
      )
    }
    return list
  }, [items, kindFilter, moodFilter, gradType, query, sortMode, saved])

  useEffect(() => {
    if (kindFilter === 'saved') return
    if (filtered.length < 12 && !loadingRef.current && items.length < 400) {
      loadMore()
    }
  }, [filtered.length, items.length, loadMore, kindFilter])

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

  const palCount = filtered.filter((i) => i.kind === 'palette').length
  const gradCount = filtered.filter((i) => i.kind === 'gradient').length

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
              Colour templates and gradients in one feed — filter by type, mood, or name, then open
              in Palette or Calordetel.
            </p>
          </div>
          <span className="templates-total">
            {String(palCount).padStart(2, '0')} PAL · {String(gradCount).padStart(2, '0')} GRAD
          </span>
        </div>

        <div className="tpl-filters">
          <div className="tpl-filter-row">
            <div className="tpl-filter-group" role="group" aria-label="Type">
              {(
                [
                  ['all', 'All'],
                  ['palette', 'Templates'],
                  ['gradient', 'Gradients'],
                  ['saved', `Saved (${saved.length})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={kindFilter === id ? 'active' : ''}
                  onClick={() => setKindFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="tpl-search">
              <Search size={14} />
              <input
                type="search"
                placeholder="Search name or mood…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search templates"
              />
            </div>

            <select
              className="tpl-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Sort"
            >
              <option value="default">Sort: Default</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="colors-asc">Fewer colours</option>
              <option value="colors-desc">More colours</option>
            </select>
          </div>

          <div className="tpl-filter-row tpl-mood-row">
            {MOOD_FILTERS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`tpl-chip ${moodFilter === m.id ? 'active' : ''}`}
                onClick={() => setMoodFilter(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {(kindFilter === 'all' || kindFilter === 'gradient') && (
            <div className="tpl-filter-row">
              <span className="tpl-filter-label">Gradient type</span>
              <div className="tpl-filter-group" role="group" aria-label="Gradient type">
                {(
                  [
                    ['all', 'All'],
                    ['linear', 'Linear'],
                    ['radial', 'Radial'],
                    ['conic', 'Conic'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={gradType === id ? 'active' : ''}
                    onClick={() => setGradType(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mixed-feed-label">
          <span>Color templates</span>
          <span className="mixed-feed-dot" />
          <span>Color gradients</span>
          <span className="mixed-feed-hint">
            {filtered.length} SHOWN · FILTERABLE FEED
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="tpl-empty">
            <strong>No matches</strong>
            <p>Try another mood, type, or clear the search.</p>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                setQuery('')
                setMoodFilter('all')
                setGradType('all')
                setKindFilter('all')
                notify('Filters cleared.')
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="templates-grid mixed-feed-grid">
            {filtered.map((item, i) =>
              item.kind === 'palette' ? (
                <article
                  key={`p-${item.data.id}-${item.index}-${i}`}
                  className="template-card feed-card"
                  style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
                >
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
                        className={savedIds.has(saveKeyFor(item)) ? 'tpl-save-on' : ''}
                        title={savedIds.has(saveKeyFor(item)) ? 'Unsave template' : 'Save template'}
                        onClick={() => toggleSavePalette(item.data)}
                      >
                        {savedIds.has(saveKeyFor(item)) ? (
                          <BookmarkCheck size={14} />
                        ) : (
                          <Bookmark size={14} />
                        )}
                      </button>
                      {kindFilter === 'saved' && (
                        <button
                          type="button"
                          title="Remove saved"
                          onClick={() => removeSaved(saveKeyFor(item))}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
                <article
                  key={`g-${item.data.id}-${item.index}-${i}`}
                  className="gradient-card feed-card"
                  style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
                >
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
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className={savedIds.has(saveKeyFor(item)) ? 'tpl-save-on' : ''}
                        title={savedIds.has(saveKeyFor(item)) ? 'Unsave gradient' : 'Save gradient'}
                        onClick={() => toggleSaveGradient(item.data)}
                      >
                        {savedIds.has(saveKeyFor(item)) ? (
                          <BookmarkCheck size={14} />
                        ) : (
                          <Bookmark size={14} />
                        )}
                      </button>
                      {kindFilter === 'saved' && (
                        <button
                          type="button"
                          title="Remove saved"
                          onClick={() => removeSaved(saveKeyFor(item))}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Customize in Calordetel"
                        onClick={() => openGradientInCalor(item.data)}
                      >
                        <Wand2 size={14} />
                      </button>
                    </div>
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
        )}

        {kindFilter !== 'saved' && (
          <div className="templates-sentinel" ref={sentinelRef}>
            {loading ? (
              <>
                <span className="spin" /> LOADING MORE
              </>
            ) : (
              <>SCROLL FOR ENDLESS COLOUR</>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
