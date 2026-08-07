import { AppProviders } from './app/providers/AppProviders'
import { AppShell } from './app/layouts/AppShell'
import { AppRouter } from './app/router/AppRouter'

export function App() {
  return (
    <AppProviders>
      <AppShell>
        <AppRouter />
      </AppShell>
    </AppProviders>
  )
}
