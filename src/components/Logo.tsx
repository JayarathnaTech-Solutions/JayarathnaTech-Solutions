import { useTheme } from '../lib/useTheme'
import logo from '../assets/logo.png'
import logoDark from '../assets/logo-dark.png'

// The dark lockup has white text, so it stays legible on dark backgrounds.
// "auto" follows the site theme toggle; "dark" forces the dark lockup for
// screens that are always dark (admin/portal have no light mode).
export function Logo({ variant = 'auto' }: { variant?: 'auto' | 'dark' }) {
  const { theme } = useTheme()
  const useDark = variant === 'dark' || theme === 'dark'
  return <img src={useDark ? logoDark : logo} alt="JayarathnaTech Solutions" className="h-11 w-auto" />
}
