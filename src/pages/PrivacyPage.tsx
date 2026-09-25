import { Link } from 'react-router-dom'
import { ArrowUpRight, Shield } from 'lucide-react'
import { BrandMark } from '../components/Brand'
import {SiteFooter} from '../components/Layout'

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <nav className="navbar topbar">
        <div className="container-fluid app-container px-0">
          <BrandMark />
          <Link className="back-link" to="/">
            ← Back to Palette
          </Link>
        </div>
      </nav>
      <main className="privacy-content">
        <div className="eyebrow">
          <Shield size={13} /> YOUR PRIVACY MATTERS
        </div>
        <h1>Privacy, in plain language.</h1>
        <p className="privacy-updated">Last updated September 23, 2026</p>
        <p>
          Palette is a free colour palette tool by acetix. We designed it to work without an account
          and to keep your images on your device.
        </p>
        <h2>Your images & palettes</h2>
        <p>
          Images you choose are read and processed locally in your browser to extract colours.
          Palette does not upload your images to a server. Palettes you save are stored in your
          browser&apos;s local storage and remain on this device. Clearing browser data will remove
          them.
        </p>
        <h2>Calordetel share links</h2>
        <p>
          When you customize a template or gradient in Calordetel and share a link, the colour values
          are encoded in the URL itself. No server stores your design — anyone with the link can
          recreate it locally in their browser.
        </p>
        <h2>Information we collect</h2>
        <p>
          Palette does not ask for personal information, create user accounts, or use advertising
          cookies. The hosting provider may process standard technical request data to deliver this
          website. We do not sell personal data.
        </p>
        <h2>Advertising</h2>
        <p>
          Palette currently does not display advertising. If advertising is introduced in the future,
          we will update this notice and provide appropriate disclosures and controls in line with
          applicable policies and law.
        </p>
        <h2>External links</h2>
        <p>
          Links to acetix.xyz and your email app are governed by the privacy practices of those
          services. For acetix&apos;s broader policies, visit{' '}
          <a href="https://acetix.xyz/privacy" target="_blank" rel="noreferrer">
            acetix.xyz/privacy
          </a>
          .
        </p>
        <h2>Contact</h2>
        <p>
          Questions about this notice? Reach us at{' '}
          <a href="https://acetix.xyz/contact" target="_blank" rel="noreferrer">
            acetix.xyz/contact
          </a>
          {' '}or write to{' '}
          <a href="mailto:acetix.team@gmail.com">acetix.team@gmail.com</a>.
        </p>
        <h2>About</h2>
        <p>
          Learn more about acetix at{' '}
          <a href="https://acetix.xyz/about" target="_blank" rel="noreferrer">
            acetix.xyz/about
          </a>
          .
        </p>
        <Link className="btn btn-dark privacy-home" to="/">
          Back to your palette <ArrowUpRight size={15} />
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
