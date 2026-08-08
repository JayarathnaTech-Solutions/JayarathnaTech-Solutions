import logo from '../assets/logo.png'
import logoDark from '../assets/logo-dark.png'

// "auto" always shows the blue/black lockup (used on the public site, which
// keeps its header/footer chrome light regardless of the theme toggle).
// "dark" forces the white lockup for screens that are always dark
// (admin/portal have no light mode, so black text there would be invisible).
export function Logo({ variant = 'auto' }: { variant?: 'auto' | 'dark' }) {
  return <img src={variant === 'dark' ? logoDark : logo} alt="JayarathnaTech Solutions" className="h-11 w-auto" />
}
