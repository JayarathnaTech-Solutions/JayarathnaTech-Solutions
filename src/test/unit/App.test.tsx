import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../../App.tsx'

describe('App', () => {
  it('renders the home page at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })

  it('renders the 404 page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText(/404/)).toBeInTheDocument()
  })
})
