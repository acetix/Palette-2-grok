import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function BrandMark({ to = '/' }: { stacked?: boolean; to?: string }) {
  return (
    <Link to={to} className="navbar-brand brand-mark" aria-label="Palette by Acetix home">
      <motion.span
        className="brand-icon"
        aria-hidden
        whileHover={{ rotate: -3, scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        <i />
        <i />
        <i />
        <i />
      </motion.span>
      <span className="template-brand-stack">
        <span>
          Palette<span className="brand-period">.</span>
        </span>
        <small>by Acetix</small>
      </span>
    </Link>
  )
}
