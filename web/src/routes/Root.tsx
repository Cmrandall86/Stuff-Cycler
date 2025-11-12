import { Outlet } from '@tanstack/react-router'
import Navbar from '../components/Navbar'

export default function Root() {
  return (
    <div className="min-h-screen bg-base-900">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

