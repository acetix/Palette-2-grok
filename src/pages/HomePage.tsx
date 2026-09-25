import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  Droplets,
  Eye,
  ImagePlus,
  Info,
  Lock,
  Pipette,
  RefreshCw,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { SiteFooter, Toast, TopNav , ScrollTopButton} from '../components/Layout'
import {
  contrastRatio,
  DEFAULT_PALETTE,
  exportTokens,
  extractPalette,
  formatColor,
  normalizeHex,
  oklchToHex,
  parseSharedPalette,
  rgbToOklch,
  toSwatches,
  nameColor,
  type ColorFormat,
  type ExportFormat,
  type Swatch,
  hexToRgb,
} from '../lib/colors'

const PRESETS = [
  { title: 'Citrus hour', src: '/images/library-citrus.jpg' },
  { title: 'Wild bloom', src: '/images/library-flowers.jpg' },
  { title: 'Blue tide', src: '/images/library-ocean.jpg' },
  { title: 'Dune glow', src: '/images/library-desert.jpg' },
  { title: 'Leaf study', src: '/images/library-botanical.jpg' },
  { title: 'Colour study', src: '/images/library-abstract.jpg' },
  { title: 'Mountain air', src: '/images/library-mountain.jpg' },
  { title: 'Petal & porcelain', src: '/images/library-stilllife.jpg' },
  { title: 'Coffee break', src: '/images/library-coffee.jpg' },
  { title: 'Sunday still life', src: '/images/palette-still-life.png' },
]

type HistoryItem = {
  id: number
  date: string
  colors: Swatch[]
  image: string
  title: string
}

export default function HomePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const shared = useMemo(() => parseSharedPalette(window.location.search), [])

  const [imageSrc, setImageSrc] = useState('')
  const [title, setTitle] = useState(shared ? 'Shared palette' : '')
  const [colors, setColors] = useState<Swatch[]>(() => shared || toSwatches(DEFAULT_PALETTE))
  const [swatchCount, setSwatchCount] = useState(shared?.length || 12)
  const [selected, setSelected] = useState(0)
  const [exportFmt, setExportFmt] = useState<ExportFormat>('CSS')
  const [copied, setCopied] = useState(false)
  const [colorFmt, setColorFmt] = useState<ColorFormat>('HEXA')
  const [picking, setPicking] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('paletto-history') || '[]')
    } catch {
      return []
    }
  })
  const [textIdx, setTextIdx] = useState(0)
  const [bgIdx, setBgIdx] = useState(2)
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState(false)
  const [hexDraft, setHexDraft] = useState('')

  useEffect(() => {
    localStorage.setItem('paletto-history', JSON.stringify(history.slice(0, 8)))
  }, [history])

  useEffect(() => {
    if (selected > colors.length - 1) setSelected(Math.max(0, colors.length - 1))
    if (textIdx > colors.length - 1) setTextIdx(Math.max(0, colors.length - 1))
    if (bgIdx > colors.length - 1) setBgIdx(Math.min(2, Math.max(0, colors.length - 1)))
  }, [colors.length, selected, textIdx, bgIdx])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        fileRef.current?.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const safeSelected = Math.min(selected, Math.max(0, colors.length - 1))
  const active = colors[safeSelected] || colors[0] || { hex: '#888888', name: 'Grey' }
  const oklch = useMemo(() => {
    const [r, g, b] = hexToRgb(active.hex)
    return rgbToOklch(r, g, b)
  }, [active])

  const safeTextIdx = Math.min(textIdx, Math.max(0, colors.length - 1))
  const safeBgIdx = Math.min(bgIdx, Math.max(0, colors.length - 1))
  const ratio = useMemo(
    () => contrastRatio(colors[safeTextIdx]?.hex || '#fff', colors[safeBgIdx]?.hex || '#111'),
    [colors, safeTextIdx, safeBgIdx],
  )

  const tokens = useMemo(() => exportTokens(colors, exportFmt), [colors, exportFmt])

  const notify = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  useEffect(() => {
    setHexDraft(active.hex)
  }, [active.hex])

  function scrollToPalette() {
    window.setTimeout(() => {
      document.getElementById('palette-colours')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 120)
  }

  function loadFromUrl(src: string, name: string) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImageSrc(src)
      setTitle(name)
      setColors(extractPalette(img, swatchCount))
      setSelected(0)
      setTextIdx(0)
      setBgIdx(Math.min(2, swatchCount - 1))
      notify(`Palette made from ${name}.`)
      scrollToPalette()
    }
    img.onerror = () => notify('Could not load that image. Please try another.')
    img.src = src
  }

  function handleFile(file: File | undefined | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notify('Choose an image file to make a palette.')
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const palette = extractPalette(img, swatchCount)
      const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      setImageSrc(ctx ? canvas.toDataURL('image/jpeg', 0.78) : url)
      setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'Your image')
      setColors(palette)
      setSelected(0)
      setTextIdx(0)
      setBgIdx(Math.min(2, swatchCount - 1))
      notify('Fresh palette, just for you.')
      URL.revokeObjectURL(url)
      scrollToPalette()
    }
    img.onerror = () => notify('That image could not be opened. Try another one.')
    img.src = url
  }

  function regenerate() {
    if (!imageSrc) return
    const img = new Image()
    img.onload = () => {
      setColors(extractPalette(img, swatchCount))
      setSelected(0)
      notify('A fresh take on your image.')
    }
    img.onerror = () => notify('Could not refresh this image.')
    img.src = imageSrc
  }

  function saveHistory() {
    const item: HistoryItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      colors: [...colors],
      image: imageSrc,
      title: title || 'Untitled palette',
    }
    setHistory((h) => [item, ...h.filter((x) => x.title !== item.title)].slice(0, 8))
    notify('Saved to your palette history.')
  }

  function updateOklch(key: 'l' | 'c' | 'h', value: number) {
    const next = { ...oklch, [key]: value }
    const hex = oklchToHex(next.l, next.c, next.h)
    setColors((prev) =>
      prev.map((s, i) => (i === safeSelected ? { hex, name: nameColor(hex, i) } : s)),
    )
  }

  function applyHex(raw: string) {
    const n = normalizeHex(raw)
    if (!n) {
      notify('Enter a valid hex colour.')
      setHexDraft(active.hex)
      return
    }
    setColors((prev) => prev.map((s, i) => (i === safeSelected ? { hex: n, name: nameColor(n, i) } : s)))
  }

  async function copyTokens() {
    try {
      await navigator.clipboard.writeText(tokens)
      setCopied(true)
      notify('Tokens copied to clipboard.')
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      notify('Could not copy. Select the code manually.')
    }
  }

  async function copyShare() {
    const params = colors.map((c) => c.hex.slice(1)).join(',')
    const url = `${window.location.origin}/?palette=${params}`
    try {
      await navigator.clipboard.writeText(url)
      notify('Share link copied.')
    } catch {
      notify(url)
    }
  }

  function onImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!picking || !imgRef.current) return
    const img = imgRef.current
    const rect = img.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * img.naturalWidth
    const y = ((e.clientY - rect.top) / rect.height) * img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    const px = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
    const hex = `#${[px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
    setColors((prev) => prev.map((s, i) => (i === safeSelected ? { hex, name: nameColor(hex, i) } : s)))
    notify(`Picked ${hex}`)
    setPicking(false)
  }

  function changeCount(n: number) {
    setSwatchCount(n)
    if (imageSrc) {
      const img = new Image()
      img.onload = () => {
        setColors(extractPalette(img, n))
        setSelected(0)
        setBgIdx(Math.min(2, n - 1))
      }
      img.src = imageSrc
    } else {
      setColors((prev) => {
        if (prev.length >= n) return prev.slice(0, n)
        const extra = toSwatches(DEFAULT_PALETTE).slice(0, n - prev.length)
        return [...prev, ...extra].slice(0, n)
      })
    }
  }

  function fileBaseName() {
    return (title || 'palette-image').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'palette-image'
  }

  function loadSourceImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('load failed'))
      img.src = imageSrc
    })
  }

  async function downloadSvg() {
    if (!imageSrc) {
      notify('Drop an image first.')
      return
    }
    try {
      const img = await loadSourceImage()
      const w = img.naturalWidth || 800
      const h = img.naturalHeight || 600
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas')
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${dataUrl}" width="${w}" height="${h}"/></svg>`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
      a.download = `${fileBaseName()}.svg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(a.href), 1500)
      notify('SVG download started.')
    } catch {
      notify('Could not convert this image to SVG.')
    }
  }

  function goToPixelshift() {
    window.location.assign('https://pixelshift.acetix.xyz/')
  }

  async function openImbb() {
    if (!imageSrc) {
      notify('Drop an image first.')
      return
    }
    // Open free image host in a new tab (does not leave the palette app)
    // Prefer Pixelshift (Acetix) which handles WebP + hosting helpers.
    try {
      const win = window.open('https://pixelshift.acetix.xyz/', '_blank', 'noopener,noreferrer')
      if (!win) {
        // Popup blocked — navigate-safe fallback copy
        await navigator.clipboard?.writeText('https://pixelshift.acetix.xyz/')
        notify('Popup blocked. Link copied — paste it in a new tab.')
        return
      }
      notify('Opened Pixelshift / ImBB tools in a new tab.')
    } catch {
      window.open('https://imgbb.com/upload', '_blank', 'noopener,noreferrer')
      notify('Opened image upload in a new tab.')
    }
  }

  return (
    <div className="app-shell page-enter">
      <TopNav
        right={
          <Link className="btn btn-dark header-button c-templates-glow" to="/templates">
            c.Templates <ArrowUpRight size={14} />
          </Link>
        }
      />

      <main id="top" className="container-fluid app-container main-content">
        <h1 className="sr-only">Palette — extract colour palettes from images, check contrast, and export CSS tokens</h1>
        <section className="workspace-grid" aria-label="Palette workspace">
          <div className="left-column">
            <div
              className={`image-card ${!imageSrc ? 'empty-image-card' : ''} ${dragging ? 'is-dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFile(e.dataTransfer.files?.[0])
              }}
            >
              {imageSrc ? (
                <>
                  <img
                    ref={imgRef}
                    className={`source-image ${picking ? 'pick-color-active' : ''}`}
                    src={imageSrc}
                    alt={`Source image: ${title}`}
                    onClick={onImageClick}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      display: 'flex',
                      gap: 6,
                    }}
                  >
                    <button
                      type="button"
                      className="icon-button on-image"
                      title="Pick a colour from this image"
                      onClick={() => setPicking((p) => !p)}
                    >
                      <Pipette size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button on-image"
                      title="Download this image as SVG"
                      onClick={downloadSvg}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button on-image"
                      title="Choose another image"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="empty-dropzone"
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="dropzone-privacy in-dropzone">
                    <Shield size={13} /> Images stay on your device
                  </span>
                  <span className="dropzone-icon">
                    <ImagePlus size={18} />
                  </span>
                  <strong>Drop an image to find your palette</strong>
                  <span>
                    or <u>browse your files</u>
                  </span>
                  <small>PNG, JPG, WEBP · private on-device</small>
                </button>
              )}
            </div>

            <div className="source-footer">
              <span>
                {imageSrc ? (
                  <>
                    <Eye size={12} /> {picking ? 'Click the image to copy a colour' : title || 'Your image'}
                  </>
                ) : (
                  <>
                    <Lock size={12} /> Drop a new image here
                  </>
                )}
              </span>
            </div>

            {imageSrc && (
              <div className="image-actions" aria-label="Image conversion tools">
                <button
                  type="button"
                  className="btn image-tool-primary"
                  title="Download this image as SVG"
                  onClick={() => void downloadSvg()}
                >
                  <Download size={14} /> Convert SVG
                </button>
                <button
                  type="button"
                  className="btn image-tool-secondary"
                  title="Open Pixelshift WebP tools"
                  onClick={goToPixelshift}
                >
                  Convert WebP <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  className="btn image-tool-secondary"
                  title="Open ImBB / Pixelshift upload tools"
                  onClick={() => void openImbb()}
                >
                  Upload ImBB <ArrowUpRight size={13} />
                </button>
              </div>
            )}

            <div className="preset-heading">
              <span>START WITH A LITTLE INSPIRATION</span>
              <span>Choose one of ten sample images</span>
            </div>
            <div className="preset-grid">
              {PRESETS.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  className={`preset-card ${imageSrc === p.src ? 'active' : ''}`}
                  onClick={() => loadFromUrl(p.src, p.title)}
                >
                  <img src={p.src} alt="" />
                  <span className="preset-number">{String(i + 1).padStart(2, '0')}</span>
                  <span className="preset-title">{p.title}</span>
                </button>
              ))}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div style={{ marginTop: 8 }}>
              <button type="button" className="ghost-button" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Upload image <kbd style={{ font: '9px DM Mono, monospace', background: '#f0eee7', padding: '2px 5px', borderRadius: 3 }}>⌘ O</kbd>
              </button>
            </div>

            <div id="palette-colours" className="palette-title-row">
              <div>
                <div className="section-kicker">YOUR COLOURS</div>
                <h2>Extracted color palette</h2>
              </div>
              <div className="swatch-count">
                <label htmlFor="swatch-n">SWATCHES</label>
                <select
                  id="swatch-n"
                  value={swatchCount}
                  onChange={(e) => changeCount(+e.target.value)}
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="color-format-bar">
              <span className="color-format-label">COLOR CODE FORMAT</span>
              <div className="color-format-switch" role="group" aria-label="Color code format">
                {(['HEXA', 'RGBA', 'HSLA'] as ColorFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={colorFmt === f ? 'active' : ''}
                    onClick={() => setColorFmt(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="palette-strip" role="list" aria-label="Extracted color palette" style={{ ['--swatch-cols' as any]: String(Math.min(Math.max(colors.length, 1), 12)) }}>
              {colors.map((c, i) => (
                <button
                  key={`${c.hex}-${i}`}
                  type="button"
                  className={`swatch ${safeSelected === i ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(i)
                    void navigator.clipboard?.writeText(formatColor(c.hex, colorFmt)).then(() => {
                      notify(`Copied ${formatColor(c.hex, colorFmt)}`)
                    }).catch(() => notify(formatColor(c.hex, colorFmt)))
                  }}
                  role="listitem"
                >
                  <span className="swatch-color" style={{ backgroundColor: c.hex }}>
                    {selected === i && <Check className="swatch-check" size={16} />}
                  </span>
                  <span className="swatch-name">{c.name}</span>
                  <span className="swatch-hex">{formatColor(c.hex, colorFmt)}</span>
                </button>
              ))}
            </div>

            <div className="palette-actions">
              <button type="button" className="save-button" onClick={saveHistory}>
                <Sparkles size={14} /> Save palette
              </button>
              <button type="button" className="ghost-button" onClick={regenerate} disabled={!imageSrc}>
                <RefreshCw size={14} /> Generate again
              </button>
              <span className="saved-inline">
                <Lock size={13} /> Saved locally
              </span>
            </div>
          </div>

          <div className="right-column">
            <section className="tool-card editor-card">
              <div className="card-head">
                <div>
                  <span className="step-number">01</span>
                  <div className="section-kicker">TUNE THE FEELING</div>
                  <h3>Fine-tune colour</h3>
                </div>
                <Droplets size={16} className="muted-icon" />
              </div>
              <div className="hex-edit">
                <span className="hex-swatch" style={{ background: active.hex }} />
                <input
                  aria-label="Edit hex colour"
                  value={hexDraft}
                  onChange={(e) => setHexDraft(e.target.value)}
                  onBlur={() => applyHex(hexDraft)}
                  onKeyDown={(e) => e.key === 'Enter' && applyHex(hexDraft)}
                />
              </div>
              <div className="editor-row">
                <label>
                  LIGHTNESS <strong>{oklch.l}%</strong>
                </label>
                <input
                  aria-label="Lightness"
                  className="light-range"
                  type="range"
                  min={0}
                  max={100}
                  value={oklch.l}
                  onChange={(e) => updateOklch('l', +e.target.value)}
                />
              </div>
              <div className="editor-row">
                <label>
                  CHROMA <strong>{oklch.c}</strong>
                </label>
                <input
                  className="chroma-range"
                  type="range"
                  min={0}
                  max={40}
                  value={oklch.c}
                  onChange={(e) => updateOklch('c', +e.target.value)}
                />
              </div>
              <div className="editor-row">
                <label>
                  HUE <strong>{oklch.h}°</strong>
                </label>
                <input
                  className="hue-range"
                  type="range"
                  min={0}
                  max={360}
                  value={oklch.h}
                  onChange={(e) => updateOklch('h', +e.target.value)}
                />
              </div>
              <p className="editor-footnote">
                <Info size={13} /> Fine-tune in perceptual OKLCH colour space.
              </p>
            </section>

            <section className="tool-card contrast-card">
              <div className="card-head">
                <div>
                  <span className="step-number">02</span>
                  <div className="section-kicker">READABLE BY DESIGN</div>
                  <h3>Contrast check</h3>
                </div>
                <Eye size={16} className="muted-icon" />
              </div>
              <div className="pair-selectors">
                <div className="pair-picker">
                  <label>TEXT</label>
                  <div className="picker-wrap">
                    <i style={{ background: colors[safeTextIdx]?.hex }} />
                    <select
                      aria-label="Text colour"
                      value={safeTextIdx}
                      onChange={(e) => setTextIdx(+e.target.value)}
                    >
                      {colors.map((c, i) => (
                        <option key={i} value={i}>
                          {c.hex}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} />
                  </div>
                </div>
                <span className="pair-on">on</span>
                <div className="pair-picker">
                  <label>BACKGROUND</label>
                  <div className="picker-wrap">
                    <i style={{ background: colors[safeBgIdx]?.hex }} />
                    <select
                      aria-label="Background colour"
                      value={safeBgIdx}
                      onChange={(e) => setBgIdx(+e.target.value)}
                    >
                      {colors.map((c, i) => (
                        <option key={i} value={i}>
                          {c.hex}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} />
                  </div>
                </div>
              </div>
              <div
                className="contrast-preview"
                style={{ color: colors[safeTextIdx]?.hex, background: colors[safeBgIdx]?.hex }}
              >
                <span>Aa</span>
                <small>Sample text preview</small>
              </div>
              <div className="contrast-result">
                <div>
                  <i className={`pass-dot ${ratio >= 4.5 ? '' : 'fail'}`} />
                  <strong>{ratio.toFixed(2)}:1</strong>
                  <span className={`contrast-status ${ratio >= 4.5 ? 'pass' : 'fail-text'}`}>
                    {ratio >= 4.5 ? 'Looks good' : 'Needs a boost'}
                  </span>
                </div>
                <div className="wcag-pills">
                  <span className={ratio >= 4.5 ? 'wcag-pass' : ''}>AA</span>
                  <span className={ratio >= 7 ? 'wcag-pass' : ''}>AAA</span>
                </div>
              </div>
              <p className="wcag-note">WCAG 2.2 · Normal text needs 4.5:1 for AA.</p>
            </section>

            <section className="tool-card export-card">
              <div className="card-head">
                <div>
                  <span className="step-number">03</span>
                  <div className="section-kicker">TAKE IT WITH YOU</div>
                  <h3>Export tokens</h3>
                </div>
                <Copy size={16} className="muted-icon" />
              </div>
              <div className="export-switch">
                {(['CSS', 'SCSS', 'Tailwind'] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={exportFmt === f ? 'active' : ''}
                    onClick={() => setExportFmt(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <pre className="code-box">{tokens}</pre>
              <button type="button" className="btn copy-button" onClick={copyTokens}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy tokens'}
              </button>
              <button
                type="button"
                className="btn share-button"
                onClick={copyShare}
                disabled={colors.length === 0}
              >
                <Share2 size={14} /> Copy share link
              </button>
              <p className="share-note">
                Shares palette colours only; photos stay in your browser.
              </p>
            </section>
          </div>
        </section>

        <section className="history-section">
          <div className="history-heading">
            <div>
              <div className="section-kicker">RECENT WORK</div>
              <h2>Palette history</h2>
            </div>
            <span className="history-count">{String(history.length).padStart(2, '0')} SAVED</span>
          </div>
          {history.length === 0 ? (
            <div className="history-empty">
              <div>
                <strong>Save a palette to keep it close.</strong>
                <p>Everything stays in this browser.</p>
              </div>
              <button type="button" onClick={saveHistory}>
                Save this palette <Sparkles size={12} />
              </button>
            </div>
          ) : (
            <div className="history-grid">
              {history.map((h) => (
                <div key={h.id} className="history-card">
                  <button
                    type="button"
                    className="history-open"
                    onClick={() => {
                      setImageSrc(h.image)
                      setTitle(h.title)
                      setColors(h.colors)
                      setSwatchCount(h.colors.length)
                      setSelected(0)
                      notify('Palette restored.')
                    }}
                  >
                    <div className="history-swatches">
                      {h.colors.map((c) => (
                        <span key={c.hex + c.name} style={{ background: c.hex, flex: 1 }} />
                      ))}
                    </div>
                    <div className="history-meta">
                      <strong>{h.title}</strong>
                      <small>{h.date}</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="history-delete"
                    aria-label="Delete"
                    onClick={() => setHistory((prev) => prev.filter((x) => x.id !== h.id))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="howto-section">
          <div className="eyebrow">
            <Sparkles size={13} /> ZERO FUSS.
          </div>
          <h2>
            From image to
            <br />
            <em>inspiration.</em>
          </h2>
          <div className="steps-grid">
            <div className="step-item">
              <span className="step-number">01</span>
              <strong>Drop or pick</strong>
              <p>Choose an image or simply drop it into the frame.</p>
            </div>
            <div className="step-item">
              <span className="step-number">02</span>
              <strong>Fine-tune</strong>
              <p>Adjust lightness, chroma and hue in OKLCH. Check contrast.</p>
            </div>
            <div className="step-item">
              <span className="step-number">03</span>
              <strong>Export & share</strong>
              <p>Save it for later or take the tokens into your code.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-flower">✿</div>
          <div>
            <h2>Colour, kept private.</h2>
            <p>
              Palette extracts colours entirely in your browser. No accounts, no uploads of your
              photos, no tracking of your palettes. Crafted by acetix for designers who care about
              both beauty and privacy.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
              <Link to="/privacy">
                Read the privacy note <ArrowUpRight size={12} />
              </Link>
              <a href="https://acetix.xyz/about" target="_blank" rel="noreferrer">
                About acetix <ArrowUpRight size={12} />
              </a>
              <a href="https://acetix.xyz/contact" target="_blank" rel="noreferrer">
                Contact <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
          <div className="about-side-note">
            LOCAL
            <br />
            FIRST
            <br />
            ALWAYS
          </div>
        </section>
      </main>

      <SiteFooter />
      <ScrollTopButton />
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
