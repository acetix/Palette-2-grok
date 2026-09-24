import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Layers, Shield, Sparkles, Wand2 } from 'lucide-react'
import { BrandMark } from './Brand'

export function TopNav({
  right,
  showLinks = true,
}: {
  right?: React.ReactNode
  showLinks?: boolean
}) {
  const { pathname } = useLocation()
  return (
    <nav className="navbar navbar-expand-lg topbar">
      <div className="container-fluid app-container px-0">
        <BrandMark stacked={pathname === '/templates' || pathname === '/calordetel'} />
        <div className="nav-links">
          {showLinks && (
            <>
              <Link to="/" className={`nav-text ${pathname === '/' ? 'active' : ''}`}>
                Workspace
              </Link>
              <Link
                to="/templates"
                className={`nav-text ${pathname === '/templates' ? 'active' : ''}`}
              >
                Templates
              </Link>
              <Link
                to="/calordetel"
                className={`nav-text ${pathname === '/calordetel' ? 'active' : ''}`}
              >
                Calordetel
              </Link>
              <span className="privacy-pill">
                <Shield size={13} /> Private by design
              </span>
            </>
          )}
          {right}
        </div>
      </div>
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-fluid app-container footer-inner">
        <div className="footer-brand">
          <span className="brand-icon" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            Palette<span className="brand-period">.</span>
          </span>
        </div>
        <p className="footer-made">
          Made with care <b>♥</b>
        </p>
        <div className="footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/templates">
            <Layers size={12} /> Templates
          </Link>
          <Link to="/calordetel">
            <Wand2 size={12} /> Calordetel
          </Link>
          <a href="https://acetix.xyz" target="_blank" rel="noreferrer">
            acetix <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      <div className="container-fluid app-container">
        <p className="copyright">© 2026 acetix · Palette</p>
      </div>
    </footer>
  )
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null
  return (
    <div className="toast-note" role="status">
      <Sparkles size={14} />
      <span>{message}</span>
      <button type="button" aria-label="Dismiss" onClick={onClose}>
        ×
      </button>
    </div>
  )
}
