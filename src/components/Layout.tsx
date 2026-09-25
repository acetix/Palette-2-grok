import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Shield, Sparkles } from 'lucide-react'
import { BrandMark } from './Brand'

export function TopNav({
  right,
  showLinks = true,
}: {
  right?: React.ReactNode
  showLinks?: boolean
}) {
  const { pathname } = useLocation()
  // Avoid a second Templates control when the page already passes a c.Templates CTA
  const hasTemplatesCta = pathname === '/'

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
              {!hasTemplatesCta && (
                <Link
                  to="/templates"
                  className={`nav-text c-templates-nav-glow ${pathname === '/templates' ? 'active' : ''}`}
                >
                  c.Templates
                </Link>
              )}
              <Link
                to="/calordetel"
                className={`nav-text ${pathname === '/calordetel' ? 'active' : ''}`}
              >
                Calordetel
              </Link>
              <a
                className="nav-text"
                href="https://acetix.xyz/about"
                target="_blank"
                rel="noreferrer"
              >
                About
              </a>
              <a
                className="nav-text"
                href="https://acetix.xyz/contact"
                target="_blank"
                rel="noreferrer"
              >
                Contact
              </a>
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
          <a href="https://acetix.xyz/about" target="_blank" rel="noreferrer">
            About
          </a>
          <a href="https://acetix.xyz/contact" target="_blank" rel="noreferrer">
            Contact
          </a>
          <Link to="/templates">c.Templates</Link>
          <Link to="/calordetel">Calordetel</Link>
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
