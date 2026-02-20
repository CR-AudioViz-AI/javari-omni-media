'use client'

import { useState } from 'react'
import { JAVARIVERSE_MODULES, JavariModule, ModuleCategory } from '@/lib/modules/registry'
import {
  Power, PowerOff, Trash2, Settings, BarChart3, Download, Eye, EyeOff,
  AlertTriangle, CheckCircle, Clock, Zap, Users, DollarSign, TrendingUp
} from 'lucide-react'

const CATEGORIES: { id: ModuleCategory; name: string; color: string }[] = [
  { id: 'core', name: 'Core Platform', color: 'bg-blue-500' },
  { id: 'media', name: 'Media & Organization', color: 'bg-red-500' },
  { id: 'creative', name: 'Creative & AI', color: 'bg-purple-500' },
  { id: 'family', name: 'Family & Safety', color: 'bg-green-500' },
  { id: 'social', name: 'Social & Community', color: 'bg-pink-500' },
  { id: 'specialized', name: 'Specialized Interest', color: 'bg-yellow-500' },
  { id: 'professional', name: 'Professional & Business', color: 'bg-indigo-500' },
  { id: 'ai-advanced', name: 'Advanced AI', color: 'bg-cyan-500' },
  { id: 'special', name: 'Special Purpose', color: 'bg-orange-500' },
  { id: 'experimental', name: 'Experimental', color: 'bg-gray-500' }
]

export default function AdminModulesPage() {
  const [modules, setModules] = useState<JavariModule[]>(JAVARIVERSE_MODULES)
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredModules = modules.filter(module => {
    // Filter by category
    if (selectedCategory !== 'all' && module.category !== selectedCategory) {
      return false
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        module.name.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query) ||
        module.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return true
  })

  const handleToggleModule = (moduleId: string) => {
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, isEnabled: !m.isEnabled } : m
    ))
    // TODO: API call to actually enable/disable
    console.log(`Toggling module: ${moduleId}`)
  }

  const handleDeleteModule = (moduleId: string) => {
    if (!confirm('Are you sure? This will permanently delete all data for this module.')) {
      return
    }
    // TODO: API call to delete module
    console.log(`Deleting module: ${moduleId}`)
  }

  // Calculate stats
  const stats = {
    total: modules.length,
    enabled: modules.filter(m => m.isEnabled).length,
    disabled: modules.filter(m => !m.isEnabled).length,
    beta: modules.filter(m => m.isBeta).length,
    new: modules.filter(m => m.isNew).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Javariverse Module Control</h1>
              <p className="text-gray-400">Henderson Standard: Complete module governance</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export All Data
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                + Create Module
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-5 gap-6 mb-8">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <p className="text-gray-400">Total Modules</p>
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold">{stats.enabled}</span>
            </div>
            <p className="text-gray-400">Active</p>
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <PowerOff className="w-8 h-8 text-red-400" />
              <span className="text-3xl font-bold">{stats.disabled}</span>
            </div>
            <p className="text-gray-400">Disabled</p>
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold">{stats.beta}</span>
            </div>
            <p className="text-gray-400">Beta</p>
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold">{stats.new}</span>
            </div>
            <p className="text-gray-400">New</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                List
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              All ({modules.length})
            </button>
            
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat.id 
                    ? `${cat.color} text-white` 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {cat.name} ({modules.filter(m => m.category === cat.id).length})
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map(module => (
              <ModuleCard key={module.id} module={module} onToggle={handleToggleModule} onDelete={handleDeleteModule} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredModules.map(module => (
              <ModuleListItem key={module.id} module={module} onToggle={handleToggleModule} onDelete={handleDeleteModule} />
            ))}
          </div>
        )}

        {filteredModules.length === 0 && (
          <div className="text-center py-24">
            <p className="text-2xl text-gray-500">No modules found</p>
            <p className="text-gray-600 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Module Card Component
function ModuleCard({ module, onToggle, onDelete }: {
  module: JavariModule
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={`glass rounded-xl p-6 ${module.isEnabled ? 'border-2 border-green-500/30' : 'border-2 border-red-500/30'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div style={{ color: module.color }} className="text-2xl">
            {/* Icon would go here */}
            🎯
          </div>
          <div>
            <h3 className="font-bold text-lg">{module.shortName}</h3>
            <p className="text-sm text-gray-400">{module.category}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {module.isNew && (
            <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full font-semibold">
              NEW
            </span>
          )}
          {module.isBeta && (
            <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full font-semibold">
              BETA
            </span>
          )}
          {module.isCore && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold">
              CORE
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{module.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {module.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 bg-white/10 rounded text-xs">
            {tag}
          </span>
        ))}
        {module.tags.length > 3 && (
          <span className="px-2 py-1 bg-white/10 rounded text-xs">
            +{module.tags.length - 3}
          </span>
        )}
      </div>

      {/* Stats (if available) */}
      {module.stats && (
        <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-gray-500">Active Users</p>
            <p className="text-lg font-bold">{module.stats.activeUsers.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-lg font-bold">${(module.stats.revenue / 1000).toFixed(1)}K</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!module.isCore && (
          <button
            onClick={() => onToggle(module.id)}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              module.isEnabled
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {module.isEnabled ? (
              <><PowerOff className="w-4 h-4" /> Disable</>
            ) : (
              <><Power className="w-4 h-4" /> Enable</>
            )}
          </button>
        )}
        
        <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        
        <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
          <BarChart3 className="w-4 h-4" />
        </button>
        
        {module.canBeDeleted && (
          <button
            onClick={() => onDelete(module.id)}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Module List Item Component
function ModuleListItem({ module, onToggle, onDelete }: {
  module: JavariModule
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={`glass rounded-xl p-6 ${module.isEnabled ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          <div style={{ color: module.color }} className="text-3xl">
            🎯
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-xl">{module.name}</h3>
              {module.isNew && <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">NEW</span>}
              {module.isBeta && <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">BETA</span>}
              {module.isCore && <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">CORE</span>}
            </div>
            <p className="text-gray-400 mb-2">{module.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Category: {module.category}</span>
              <span>•</span>
              <span>Age Rating: {module.ageRating}</span>
              <span>•</span>
              <span>Version: {module.version}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!module.isCore && (
            <button
              onClick={() => onToggle(module.id)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                module.isEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {module.isEnabled ? 'Disable' : 'Enable'}
            </button>
          )}
          
          <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
          
          <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </button>
          
          {module.canBeDeleted && (
            <button
              onClick={() => onDelete(module.id)}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
