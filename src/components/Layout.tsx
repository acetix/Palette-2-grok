import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
    <motion.nav
      className="navbar navbar-expand-lg topbar"
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container-fluid app-container px-0">
        <BrandMark />
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
                c.Templates
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
    </motion.nav>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-fluid app-container footer-inner">
        <Link to="/" className="footer-brand">
          <span className="brand-icon" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="template-brand-stack footer-brand-stack">
            <span>
              Palette<span className="brand-period">.</span>
            </span>
            <small>by Acetix</small>
          </span>
        </Link>
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
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="toast-note"
          role="status"
          initial={{ opacity: 0, y: 12, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 8, x: '-50%' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Sparkles size={14} />
          <span>{message}</span>
          <button type="button" aria-label="Dismiss" onClick={onClose}>
            ×
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
