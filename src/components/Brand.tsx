import { Link } from 'react-router-dom'

export function BrandMark({ stacked = false, to = '/' }: { stacked?: boolean; to?: string }) {
  return (
    <Link to={to} className="navbar-brand brand-mark" aria-label="Palette by Acetix home">
      <span className="brand-icon" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      {stacked ? (
        <span className="template-brand-stack">
          <span>
            Palette<span className="brand-period">.</span>
          </span>
          <small>by Acetix</small>
        </span>
      ) : (
        <span>
          Palette<span className="brand-period">.</span>
        </span>
      )}
    </Link>
  )
}
