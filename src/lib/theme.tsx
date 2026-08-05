import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './ThemeContext'

// Reading/writing localStorage can throw (Safari private browsing) or simply
// not exist yet (test environments) — treat either as "no stored preference".
function getInitialTheme(): Theme {
    try {
        return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
    } catch {
        return 'light'
    }
}

function persistTheme(theme: Theme) {
    try {
        window.localStorage.setItem('theme', theme)
    } catch {
        // Ignore — the in-memory state still drives the UI for this session.
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        persistTheme(theme)
    }, [theme])

    const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
