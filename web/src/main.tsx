import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
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

const rootRoute = createRootRoute({ component: Root })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Feed })
const newItemRoute = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: NewItem })
const groupsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/groups', component: Groups })
const itemRoute = createRoute({ getParentRoute: () => rootRoute, path: '/item/$id', component: ItemDetail })
const signInRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signin', component: SignIn })
const signUpRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signup', component: SignUp })
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reset-password', component: ResetPassword })
const adminUsersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin/users', component: AdminUsers })

const routeTree = rootRoute.addChildren([indexRoute, newItemRoute, groupsRoute, itemRoute, signInRoute, signUpRoute, resetPasswordRoute, adminUsersRoute])

const router = createRouter({ routeTree })
const qc = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
