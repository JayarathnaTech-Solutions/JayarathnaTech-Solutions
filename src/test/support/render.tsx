import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

// Renders `ui` inside a router already navigated to `route`. Pass `path` when
// the component reads route params (e.g. `/testimonial/:token`), so it is
// mounted under a matching <Route> the way App.tsx mounts it.
export const renderAtRoute = (ui: ReactElement, route = '/', path?: string) =>
    render(
        <MemoryRouter initialEntries={[route]}>
            {path ? (
                <Routes>
                    <Route path={path} element={ui} />
                </Routes>
            ) : (
                ui
            )}
        </MemoryRouter>,
    )
