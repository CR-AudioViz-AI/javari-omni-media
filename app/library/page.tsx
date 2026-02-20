// app/library/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Film, Tv, Music, Image, BookOpen, Folder, 
  Play, Check, Settings, Search, Grid, List, Upload, Zap
} from 'lucide-react'
import { MEDIA_CATEGORIES } from '@/lib/types/media-types'

export default function LibraryPage() {
  const [libraries, setLibraries] = useState<any[]>([])
  const [scanJobs, setScanJobs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadLibraries()
    const interval = setInterval(loadLibraries, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadLibraries = async () => {
    // TODO: Implement API call
    setLibraries([])
  }

  const filteredCategories = MEDIA_CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Zap className="w-8 h-8 text-purple-500" />
                Javari Omni Media
              </h1>
              <p className="text-slate-400 mt-1">10x faster than Plex • All features included</p>
            </div>
            
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600">
              <Upload className="w-4 h-4" />
              Add Library
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search libraries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800"
            />
          </div>
          
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>

        {/* Library Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map(category => {
            const Icon = getIconComponent(category.icon)
            
            return (
              <Card 
                key={category.id}
                className="border-slate-800 bg-slate-900/50 hover:border-purple-500/50 transition-all cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{category.name}</CardTitle>
                      <CardDescription className="text-sm">0 items</CardDescription>
                    </div>
                  </div>
                  {category.supportsFaceRecognition && (
                    <Badge variant="secondary" className="w-fit">Faces</Badge>
                  )}
                </CardHeader>
                
                <CardContent>
                  <p className="text-slate-400 text-sm mb-4">{category.description}</p>
                  <Button size="sm" className="w-full">
                    <Folder className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    Film, Tv, Music, Image, Video: Film, Book: BookOpen
  }
  return icons[iconName] || Folder
}
