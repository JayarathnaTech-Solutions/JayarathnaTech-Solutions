import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(cleanup)

// jsdom doesn't implement IntersectionObserver, which motion's `whileInView` relies on.
class MockIntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
        return []
    }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as unknown as typeof IntersectionObserver)
