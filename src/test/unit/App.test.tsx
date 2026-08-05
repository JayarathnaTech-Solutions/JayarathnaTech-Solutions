import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../../App.tsx'
import { ThemeProvider } from '../../lib/theme.tsx'

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return { ...actual, getDocs: vi.fn().mockResolvedValue({ docs: [] }) }
})

describe('App', () => {
  it('renders the home page at /', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(
      screen.getByRole('heading', { name: /We Build Digital Solutions That Drive/ }),
    ).toBeInTheDocument()
  })

  it('renders the 404 page for unknown routes', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/nope']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByText(/404/)).toBeInTheDocument()
  })
})
