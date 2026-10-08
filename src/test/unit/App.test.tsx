import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import App from '../../App.tsx'
import { renderAtRoute } from '../support/render'

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
  getDocs: jest.fn(async () => ({ docs: [] })),
}))

describe('App', () => {
  it('renders the home page at /', () => {
    renderAtRoute(<App />, '/')

    expect(
      screen.getByRole('heading', { name: /We Build Digital Solutions That Drive/ }),
    ).toBeInTheDocument()
  })

  it('renders the 404 page for unknown routes', () => {
    renderAtRoute(<App />, '/nope')

    expect(screen.getByText(/404/)).toBeInTheDocument()
  })
})
