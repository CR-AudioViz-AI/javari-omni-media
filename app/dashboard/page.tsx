'use client'

import { useState, useEffect } from 'react'
import { AppNavigation } from '@/components/AppNavigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Upload, Zap, HardDrive, TrendingUp, Save
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState({
    totalFiles: 0,
    storageUsed: 0,
    mediaCount: { movies: 0, tvShows: 0, music: 0, photos: 0 }
  })

  useEffect(() => {
    if (user) {
      loadUserStats()
    }
  }, [user])

  const loadUserStats = async () => {
    if (!user) return

    const { data: mediaItems, error } = await supabase
      .from('media_items')
      .select('type, file_size')
      .eq('user_id', user.id)

    if (!error && mediaItems) {
      const totalStorage = mediaItems.reduce((acc, item) => acc + (item.file_size || 0), 0)
      const counts = {
        movies: mediaItems.filter(i => i.type === 'movie').length,
        tvShows: mediaItems.filter(i => i.type === 'tv_episode').length,
        music: mediaItems.filter(i => i.type === 'music').length,
        photos: mediaItems.filter(i => i.type === 'photo').length,
      }

      setStats({
        totalFiles: mediaItems.length,
        storageUsed: Math.round(totalStorage / (1024 * 1024 * 1024)),
        mediaCount: counts
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <AppNavigation />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
            </h2>
            <p className="text-gray-400">Your intelligent media management platform</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <HardDrive className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.totalFiles}</h3>
              <p className="text-gray-400 text-sm">Total Files</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Save className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.storageUsed} GB</h3>
              <p className="text-gray-400 text-sm">Storage Used</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.mediaCount.movies}</h3>
              <p className="text-gray-400 text-sm">Movies</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Upload className="w-10 h-10 text-pink-400" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.mediaCount.tvShows}</h3>
              <p className="text-gray-400 text-sm">TV Episodes</p>
            </div>
          </div>

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

              <Link href="/library">
                <div className="p-4 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-all group">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="font-semibold">View Library</h4>
                      <p className="text-sm text-gray-400">Browse your media collection</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {stats.totalFiles > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Media Breakdown</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Movies</p>
                  <p className="text-2xl font-bold">{stats.mediaCount.movies}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">TV Shows</p>
                  <p className="text-2xl font-bold">{stats.mediaCount.tvShows}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Music</p>
                  <p className="text-2xl font-bold">{stats.mediaCount.music}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Photos</p>
                  <p className="text-2xl font-bold">{stats.mediaCount.photos}</p>
                </div>
              </div>
            </div>
          )}

          {stats.totalFiles === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No media yet</h3>
              <p className="text-gray-400 mb-6">Upload your first file to get started</p>
              <Link href="/upload">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                  Upload Files
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
