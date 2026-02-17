'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Home, Upload, Library, Cloud, Settings, Zap, 
  HardDrive, TrendingUp, Save, Trash2, ArrowLeft
} from 'lucide-react'

export default function DashboardPage() {
  const [storageUsed, setStorageUsed] = useState(8200) // GB

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                  <span>Back to Home</span>
                </button>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-display font-bold">
                Javari <span className="text-blue-400">Dashboard</span>
              </h1>
            </div>
            <Link href="/settings">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings size={20} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 glass border-r border-white/10 min-h-screen p-6">
          <nav className="space-y-2">
            {[
              { icon: Home, label: 'Overview', href: '/dashboard', active: true },
              { icon: Upload, label: 'Upload Files', href: '/upload' },
              { icon: Library, label: 'Media Library', href: '/library' },
              { icon: Cloud, label: 'Cloud Storage', href: '/storage' },
              { icon: Settings, label: 'Settings', href: '/settings' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}>
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome */}
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome to Javari Omni-Media!</h2>
              <p className="text-gray-400">Your intelligent media management platform</p>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <HardDrive className="w-10 h-10 text-blue-400" />
                  <span className="text-sm text-green-400 font-semibold">Optimized</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">{storageUsed} GB</h3>
                <p className="text-gray-400 text-sm">Total Storage Used</p>
                <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '73%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">73% of 11 TB capacity</p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-10 h-10 text-green-400" />
                  <span className="text-sm text-green-400 font-semibold">Saved</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">$264</h3>
                <p className="text-gray-400 text-sm">Annual Savings</p>
                <p className="text-xs text-gray-500 mt-4">
                  By optimizing cloud storage distribution
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Save className="w-10 h-10 text-purple-400" />
                  <span className="text-sm text-blue-400 font-semibold">Compressed</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">2.8 TB</h3>
                <p className="text-gray-400 text-sm">Space Saved</p>
                <p className="text-xs text-gray-500 mt-4">
                  From H.265 compression (70% savings)
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/upload">
                  <div className="p-4 bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <Upload className="w-8 h-8 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-semibold">Upload Files</h4>
                        <p className="text-sm text-blue-100">Drag & drop to organize</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-4 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-all group">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="font-semibold">Run Optimization</h4>
                      <p className="text-sm text-gray-400">Find duplicates & save space</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Save className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Compressed 12 video files</p>
                    <p className="text-sm text-gray-400">Saved 34 GB • 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Added Breaking Bad S03E04</p>
                    <p className="text-sm text-gray-400">TV Shows • 5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Removed 47 duplicate files</p>
                    <p className="text-sm text-gray-400">Saved 23 GB • Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
