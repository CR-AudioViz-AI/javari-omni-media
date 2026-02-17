'use client'

import Link from 'next/link'
import { ArrowLeft, Film, Tv, Music, Image, Book, FileText, Search, Filter } from 'lucide-react'

export default function LibraryPage() {
  const mediaTypes = [
    { icon: Film, label: 'Movies', count: 2847, color: 'blue' },
    { icon: Tv, label: 'TV Shows', count: 124, color: 'purple' },
    { icon: Music, label: 'Music', count: 3421, color: 'green' },
    { icon: Image, label: 'Photos', count: 12847, color: 'pink' },
    { icon: Book, label: 'Comics', count: 423, color: 'orange' },
    { icon: FileText, label: 'eBooks', count: 891, color: 'cyan' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-xl font-display font-bold">
              Media <span className="text-blue-400">Library</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search your library..."
              className="w-full pl-12 pr-4 py-3 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button className="px-6 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaTypes.map((type) => {
            const Icon = type.icon
            return (
              <div key={type.label} className="glass rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group">
                <div className={`w-16 h-16 bg-${type.color}-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-8 h-8 text-${type.color}-400`} />
                </div>
                <h3 className="text-2xl font-bold mb-2">{type.label}</h3>
                <p className="text-gray-400">{type.count.toLocaleString()} items</p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 glass rounded-2xl p-8 text-center">
          <p className="text-gray-400 mb-4">Full media browser coming soon!</p>
          <p className="text-sm text-gray-500">Grid view, filtering, and playback will be available in the next update.</p>
        </div>
      </main>
    </div>
  )
}
