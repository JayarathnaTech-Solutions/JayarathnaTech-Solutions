import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../../App.tsx'

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
  getDocs: jest.fn(async () => ({ docs: [] })),
}))

describe('App', () => {
  it('renders the home page at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /We Build Digital Solutions That Drive/ }),
    ).toBeInTheDocument()
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
