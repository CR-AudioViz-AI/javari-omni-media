'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, FileVideo, FileAudio, FileImage, FileText, Sparkles, Check, X } from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  status: 'analyzing' | 'organizing' | 'complete' | 'error'
  detectedType?: 'movie' | 'tv_episode' | 'music' | 'photo' | 'comic' | 'magazine' | 'ebook' | 'document'
  metadata?: {
    title?: string
    year?: number
    season?: number
    episode?: number
    artist?: string
    album?: string
  }
  newName?: string
  targetLibrary?: string
  progress: number
}

export default function FileUploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    
    // Create upload entries
    const uploadedFiles: UploadedFile[] = droppedFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'analyzing',
      progress: 0
    }))

    setFiles(prev => [...prev, ...uploadedFiles])

    // Process each file with Javari AI
    for (const uploadedFile of uploadedFiles) {
      await processFile(uploadedFile)
    }
  }, [])

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Step 1: Analyze file type (local)
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'analyzing', progress: 20 }
          : f
      ))

      const fileType = detectFileType(uploadedFile.file)
      
      // Step 2: Upload to server (real API call)
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, progress: 40, status: 'organizing' }
          : f
      ))

      const formData = new FormData()
      formData.append('file', uploadedFile.file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const result = await response.json()
      
      // Step 3: Processing metadata on server
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, progress: 80 }
          : f
      ))

      // Step 4: Complete
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'complete', 
              progress: 100,
              detectedType: result.mediaItem.type,
              metadata: result.mediaItem.metadata,
              newName: result.mediaItem.properFilename,
              targetLibrary: getTargetLibrary(result.mediaItem.type)
            }
          : f
      ))

    } catch (error) {
      console.error('Error processing file:', error)
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error', progress: 0 }
          : f
      ))
    }
  }

  const detectFileType = (file: File): UploadedFile['detectedType'] => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const name = file.name.toLowerCase()

    // Video detection
    if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'm4v'].includes(ext || '')) {
      // Check for TV show patterns
      if (name.match(/s\d{1,2}e\d{1,2}/i) || name.match(/\d{1,2}x\d{1,2}/i)) {
        return 'tv_episode'
      }
      return 'movie'
    }

    // Audio detection
    if (['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) {
      return 'music'
    }

    // Image detection
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'raw'].includes(ext || '')) {
      return 'photo'
    }

    // Comic detection
    if (['cbz', 'cbr', 'cb7'].includes(ext || '')) {
      return 'comic'
    }

    // eBook detection
    if (['epub', 'mobi', 'azw3', 'pdf'].includes(ext || '')) {
      if (name.includes('magazine') || name.includes('issue')) {
        return 'magazine'
      }
      return 'ebook'
    }

    // Document detection
    if (['doc', 'docx', 'txt', 'md'].includes(ext || '')) {
      return 'document'
    }

    return 'document'
  }

  const getTargetLibrary = (type: UploadedFile['detectedType']): string => {
    const libraryMap = {
      'movie': 'Movies',
      'tv_episode': 'TV Shows',
      'music': 'Music',
      'photo': 'Photos',
      'comic': 'Comics',
      'magazine': 'Magazines',
      'ebook': 'eBooks',
      'document': 'Documents'
    }
    return libraryMap[type || 'document']
  }

  const getFileIcon = (type: UploadedFile['detectedType']) => {
    switch (type) {
      case 'movie':
      case 'tv_episode':
        return FileVideo
      case 'music':
        return FileAudio
      case 'photo':
        return FileImage
      default:
        return FileText
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4">
            Intelligent File Upload
          </h1>
          <p className="text-gray-400 text-lg">
            Drop files anywhere. Javari AI automatically detects, renames, and organizes them.
          </p>
        </div>

        {/* Drop Zone */}
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-3xl p-12 mb-8 transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10 scale-105' 
              : 'border-gray-700 bg-white/5'
            }
          `}
        >
          <div className="text-center">
            <Upload 
              className={`w-16 h-16 mx-auto mb-4 transition-all ${
                isDragging ? 'text-blue-400 scale-125' : 'text-gray-500'
              }`} 
            />
            <h3 className="text-2xl font-bold mb-2">
              {isDragging ? 'Drop files here!' : 'Drag & Drop Files'}
            </h3>
            <p className="text-gray-400">
              Movies, TV shows, music, photos, comics, magazines, eBooks
            </p>
          </div>

          {/* Sparkle effect when dragging */}
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    scale: 0
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: Math.random() * 0.5
                  }}
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {files.map(file => {
                const Icon = getFileIcon(file.detectedType)
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <Icon className="w-8 h-8 text-blue-400" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Original name */}
                        <div className="text-sm text-gray-400 mb-1">
                          Original: {file.file.name}
                        </div>

                        {/* New name */}
                        {file.newName && (
                          <div className="font-semibold text-white mb-2">
                            → {file.newName}
                          </div>
                        )}

                        {/* Metadata */}
                        {file.metadata && (
                          <div className="text-sm text-gray-400 mb-2">
                            {file.detectedType === 'tv_episode' && (
                              <span>Season {file.metadata.season}, Episode {file.metadata.episode}</span>
                            )}
                            {file.metadata.year && (
                              <span> • {file.metadata.year}</span>
                            )}
                          </div>
                        )}

                        {/* Target library */}
                        {file.targetLibrary && (
                          <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                            📁 {file.targetLibrary}
                          </div>
                        )}

                        {/* Progress bar */}
                        {file.status !== 'complete' && file.status !== 'error' && (
                          <div className="mt-3">
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${file.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {file.status === 'analyzing' && 'Analyzing file...'}
                              {file.status === 'organizing' && 'Organizing...'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {file.status === 'complete' && (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {file.status === 'error' && (
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {(file.status === 'analyzing' || file.status === 'organizing') && (
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
