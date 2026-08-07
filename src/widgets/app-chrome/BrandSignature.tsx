import type { AnchorHTMLAttributes } from 'react'
import { navigate } from '../../app/router/navigation'
import { cn } from '../../shared/lib'
import brandLogo from '../../shared/assets/brand/mbn-guide-logo.png'
import './brand-signature.css'

type BrandSignatureProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  /** Keeps the wordmark usable over the GUIDE map without inventing a second logo. */
  tone?: 'surface' | 'overlay'
}

/**
 * The supplied MBN GUIDE wordmark is the product's visual anchor.  This is a
 * navigation affordance, not an unlabelled decorative image, so it always
 * leads back to GUIDE and retains an explicit accessible name.
 */
export function BrandSignature({ className, tone = 'surface', onClick, ...props }: BrandSignatureProps) {
  return (
    <a
      {...props}
      className={cn('brand-signature', `brand-signature--${tone}`, className)}
      href="/guide"
      aria-label="MBN GUIDE 홈으로 이동"
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        event.preventDefault()
        navigate('/guide')
      }}
    >
      <img className="brand-signature__logo" src={brandLogo} alt="mbn GUIDE" />
      <span className="brand-signature__endorsement">MBN × 매일경제</span>
    </a>
  )
}
