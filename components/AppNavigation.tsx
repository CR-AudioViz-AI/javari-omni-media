'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  Home, Upload, Library, Cloud, Settings, LogOut, User, ChevronDown 
} from 'lucide-react'

export function AppNavigation() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Upload, label: 'Upload', href: '/upload' },
    { icon: Library, label: 'Library', href: '/library' },
    { icon: Cloud, label: 'Storage', href: '/storage' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <h1 className="text-xl font-display font-bold cursor-pointer">
                Javari <span className="text-blue-400">Omni-Media</span>
              </h1>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                      <Icon size={18} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-400">Free Trial</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-xl border border-white/10 shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <p className="font-medium truncate">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Free Plan</p>
                  </div>

                  <div className="p-2">
                    <Link href="/settings">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                        <Settings size={18} />
                        <span>Settings</span>
                      </div>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
