import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRootRouteWithContext, createRoute, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './theme/tokens.css'
import './App.css'
import Root from './routes/Root'
import Feed from './routes/Feed'
import NewItem from './routes/NewItem'
import Groups from './routes/Groups'
import ItemDetail from './routes/Item'
import SignIn from './routes/SignIn'
import SignUp from './routes/SignUp'
import ResetPassword from './routes/ResetPassword'
import AdminUsers from './routes/admin/Users'
import AuthGate from '@/components/AuthGate'
import AdminGate from '@/components/AdminGate'
import { AuthProvider } from '@/hooks/useAuth' // ⬅️ add this

const rootRoute = createRootRouteWithContext<{}>()({
  component: Root,
  notFoundComponent: () => (
    <div className="p-6 card border border-base-700 max-w-lg mx-auto mt-12">
      <h2 className="text-lg font-semibold mb-2 text-ink-400">Not found</h2>
      <p className="text-ink-600">The page you're looking for doesn't exist.</p>
    </div>
  ),
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Feed })

const newItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new',
  component: () => (
    <AuthGate>
      <NewItem />
    </AuthGate>
  ),
})

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/groups',
  component: () => (
    <AuthGate>
      <Groups />
    </AuthGate>
  ),
})

const itemRoute = createRoute({ getParentRoute: () => rootRoute, path: '/item/$id', component: ItemDetail })
const signInRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signin', component: SignIn })
const signUpRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signup', component: SignUp })
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reset-password', component: ResetPassword })

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: () => (
    <AdminGate>
      <AdminUsers />
    </AdminGate>
  ),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  newItemRoute,
  groupsRoute,
  itemRoute,
  signInRoute,
  signUpRoute,
  resetPasswordRoute,
  adminUsersRoute,
])

const router = createRouter({ routeTree })

// Single shared QueryClient for the whole app
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider> {/* ⬅️ wrap the entire app so AdminGate shares auth + cache */}
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
