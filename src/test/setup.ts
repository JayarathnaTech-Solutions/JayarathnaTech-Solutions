import '@testing-library/jest-dom/jest-globals'
import { afterEach } from '@jest/globals'
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

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
