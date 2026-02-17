'use client'

import { useState, useEffect } from 'react'
import { AppNavigation } from '@/components/AppNavigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Library, Search, Filter, Grid, List, Trash2,
  Film, Tv, Music, Image, Book, FileText, SortAsc, SortDesc
} from 'lucide-react'

interface MediaItem {
  id: string
  title: string
  type: string
  file_size: number
  file_path: string
  original_filename: string
  metadata: any
  created_at: string
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      loadMediaItems()
    }
  }, [user, filterType, sortBy, sortOrder])

  const loadMediaItems = async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('media_items')
        .select('*')
        .eq('user_id', user.id)

      if (filterType !== 'all') {
        query = query.eq('type', filterType)
      }

      if (sortBy === 'date') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' })
      } else if (sortBy === 'name') {
        query = query.order('title', { ascending: sortOrder === 'asc' })
      } else if (sortBy === 'size') {
        query = query.order('file_size', { ascending: sortOrder === 'asc' })
      }

      const { data, error } = await query

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading media:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedItems(newSelection)
  }

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedItems.size} selected items?`)) return

    try {
      const itemsToDelete = Array.from(selectedItems)
      
      for (const id of itemsToDelete) {
        const item = items.find(i => i.id === id)
        if (item) {
          const bucket = getBucketForType(item.type)
          await supabase.storage.from(bucket).remove([item.file_path])
          await supabase.from('media_items').delete().eq('id', id)
        }
      }

      setSelectedItems(new Set())
      loadMediaItems()
    } catch (error) {
      console.error('Error deleting items:', error)
      alert('Failed to delete some items')
    }
  }

  const getBucketForType = (type: string): string => {
    const bucketMap: Record<string, string> = {
      'movie': 'movies',
      'tv_episode': 'tv-shows',
      'music': 'music',
      'photo': 'photos',
      'comic': 'comics',
      'magazine': 'magazines',
      'ebook': 'ebooks',
      'document': 'documents'
    }
    return bucketMap[type] || 'temp-uploads'
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'movie': return Film
      case 'tv_episode': return Tv
      case 'music': return Music
      case 'photo': return Image
      case 'comic': case 'magazine': case 'ebook': return Book
      default: return FileText
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="glass rounded-3xl p-12 text-center max-w-md">
          <Library className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Sign in to View Library</h2>
          <p className="text-gray-400 mb-6">
            Create a free account to access your media library
          </p>
          <Link href="/auth/signup">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <AppNavigation />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Media Library</h1>
            <p className="text-gray-400">{filteredItems.length} items total</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-12 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="tv_episode">TV Shows</option>
              <option value="music">Music</option>
              <option value="photo">Photos</option>
              <option value="comic">Comics</option>
              <option value="magazine">Magazines</option>
              <option value="ebook">eBooks</option>
              <option value="document">Documents</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="date">Date Added</option>
              <option value="name">Name</option>
              <option value="size">File Size</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <List size={20} />
              </button>
            </div>

            {selectedItems.size > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                Delete ({selectedItems.size})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-gray-400">Loading media...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Library className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No media yet</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery ? 'No results found' : 'Upload your first file to get started'}
            </p>
            {!searchQuery && (
              <Link href="/upload">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                  Upload Files
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 
            'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 
            'space-y-2'
          }>
            {filteredItems.map((item) => {
              const Icon = getIconForType(item.type)
              const isSelected = selectedItems.has(item.id)

              if (viewMode === 'grid') {
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`glass rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Icon className="w-8 h-8 text-blue-400" />
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1 truncate">{item.title}</h3>
                    <p className="text-xs text-gray-400 truncate mb-2">{item.original_filename}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(item.file_size)}</span>
                      <span className="capitalize">{item.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                )
              } else {
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`glass rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </div>
                      )}
                      <Icon className="w-8 h-8 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{item.original_filename}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span>{formatFileSize(item.file_size)}</span>
                        <span className="capitalize w-24">{item.type.replace('_', ' ')}</span>
                        <span className="text-xs">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )}
      </main>
    </div>
  )
}
