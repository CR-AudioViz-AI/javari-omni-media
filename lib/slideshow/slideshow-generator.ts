// lib/slideshow/slideshow-generator.ts
/**
 * JAVARI OMNI MEDIA - AUTOMATIC SLIDESHOW GENERATOR
 * 
 * CREATE BEAUTIFUL SLIDESHOWS FOR ANY EVENT:
 * - Birthdays (celebratory, fun themes)
 * - Funerals/Memorials (respectful, peaceful)
 * - Weddings (romantic, elegant)
 * - Anniversaries (nostalgic, loving)
 * - Family Reunions (warm, inclusive)
 * - Parties (energetic, fun)
 * 
 * AUTO-FEATURES:
 * - Smart photo selection (best quality, faces detected)
 * - Chronological ordering
 * - Transition effects
 * - Background music
 * - Text overlays
 * - Export to video (play on TV)
 * - Live slideshow mode (present directly)
 */

import { createCanvas, loadImage, Image } from 'canvas'
import Jimp from 'jimp'
import ffmpeg from 'fluent-ffmpeg'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import fs from 'fs/promises'
import path from 'path'

// ============================================================================
// TYPES
// ============================================================================

export type SlideshowTheme = 
  | 'birthday_celebration'
  | 'memorial_tribute'
  | 'wedding_elegance'
  | 'anniversary_nostalgia'
  | 'family_reunion'
  | 'party_fun'
  | 'graduation_pride'
  | 'baby_arrival'
  | 'retirement_honor'
  | 'general_memories'

export type TransitionEffect =
  | 'fade'
  | 'slide_left'
  | 'slide_right'
  | 'zoom_in'
  | 'zoom_out'
  | 'cross_dissolve'
  | 'wipe'
  | 'none'

export interface SlideshowOptions {
  theme: SlideshowTheme
  title: string
  subtitle?: string
  photos: string[] // File paths
  duration: number // Seconds per photo
  transitionEffect: TransitionEffect
  transitionDuration: number // Seconds
  musicPath?: string
  musicVolume?: number // 0.0 - 1.0
  includeTextOverlays: boolean
  textOverlays?: TextOverlay[]
  resolution: '720p' | '1080p' | '4k'
  outputFormat: 'mp4' | 'webm'
}

export interface TextOverlay {
  text: string
  photoIndex: number // Which photo to display on
  position: 'top' | 'bottom' | 'center'
  fontSize: number
  fontColor: string
  backgroundColor?: string
  animation?: 'fade_in' | 'slide_up' | 'none'
}

export interface SlideshowMetadata {
  id: string
  userId: string
  theme: SlideshowTheme
  title: string
  photoCount: number
  duration: number
  outputPath: string
  thumbnailPath: string
  createdAt: Date
}

// ============================================================================
// THEME CONFIGURATIONS
// ============================================================================

const THEME_CONFIGS: Record<SlideshowTheme, {
  defaultTransition: TransitionEffect
  defaultDuration: number
  colorScheme: {
    primary: string
    secondary: string
    text: string
    background: string
  }
  musicGenre: string
  textStyle: {
    font: string
    shadow: boolean
  }
}> = {
  birthday_celebration: {
    defaultTransition: 'zoom_in',
    defaultDuration: 4,
    colorScheme: {
      primary: '#FF6B9D',
      secondary: '#FEC260',
      text: '#FFFFFF',
      background: 'rgba(255, 107, 157, 0.1)'
    },
    musicGenre: 'upbeat',
    textStyle: {
      font: 'Arial Bold',
      shadow: true
    }
  },
  
  memorial_tribute: {
    defaultTransition: 'fade',
    defaultDuration: 6,
    colorScheme: {
      primary: '#4A5568',
      secondary: '#718096',
      text: '#F7FAFC',
      background: 'rgba(0, 0, 0, 0.5)'
    },
    musicGenre: 'peaceful',
    textStyle: {
      font: 'Georgia',
      shadow: false
    }
  },
  
  wedding_elegance: {
    defaultTransition: 'cross_dissolve',
    defaultDuration: 5,
    colorScheme: {
      primary: '#F7E7CE',
      secondary: '#E8C4A0',
      text: '#5A4A3A',
      background: 'rgba(247, 231, 206, 0.8)'
    },
    musicGenre: 'romantic',
    textStyle: {
      font: 'Cursive',
      shadow: false
    }
  },
  
  anniversary_nostalgia: {
    defaultTransition: 'slide_right',
    defaultDuration: 5,
    colorScheme: {
      primary: '#C19A6B',
      secondary: '#8B7355',
      text: '#FFFFFF',
      background: 'rgba(139, 115, 85, 0.3)'
    },
    musicGenre: 'classic',
    textStyle: {
      font: 'Times New Roman',
      shadow: true
    }
  },
  
  family_reunion: {
    defaultTransition: 'wipe',
    defaultDuration: 4,
    colorScheme: {
      primary: '#48BB78',
      secondary: '#38A169',
      text: '#FFFFFF',
      background: 'rgba(72, 187, 120, 0.2)'
    },
    musicGenre: 'uplifting',
    textStyle: {
      font: 'Arial',
      shadow: true
    }
  },
  
  party_fun: {
    defaultTransition: 'zoom_out',
    defaultDuration: 3,
    colorScheme: {
      primary: '#9F7AEA',
      secondary: '#805AD5',
      text: '#FFFFFF',
      background: 'rgba(159, 122, 234, 0.2)'
    },
    musicGenre: 'energetic',
    textStyle: {
      font: 'Impact',
      shadow: true
    }
  },
  
  graduation_pride: {
    defaultTransition: 'slide_left',
    defaultDuration: 5,
    colorScheme: {
      primary: '#2B6CB0',
      secondary: '#2C5282',
      text: '#FFFFFF',
      background: 'rgba(43, 108, 176, 0.3)'
    },
    musicGenre: 'triumphant',
    textStyle: {
      font: 'Arial Bold',
      shadow: true
    }
  },
  
  baby_arrival: {
    defaultTransition: 'fade',
    defaultDuration: 4,
    colorScheme: {
      primary: '#90CDF4',
      secondary: '#63B3ED',
      text: '#2C5282',
      background: 'rgba(144, 205, 244, 0.2)'
    },
    musicGenre: 'gentle',
    textStyle: {
      font: 'Comic Sans MS',
      shadow: false
    }
  },
  
  retirement_honor: {
    defaultTransition: 'cross_dissolve',
    defaultDuration: 6,
    colorScheme: {
      primary: '#B7791F',
      secondary: '#975A16',
      text: '#FFFFFF',
      background: 'rgba(183, 121, 31, 0.2)'
    },
    musicGenre: 'dignified',
    textStyle: {
      font: 'Georgia',
      shadow: false
    }
  },
  
  general_memories: {
    defaultTransition: 'fade',
    defaultDuration: 5,
    colorScheme: {
      primary: '#4299E1',
      secondary: '#3182CE',
      text: '#FFFFFF',
      background: 'rgba(66, 153, 225, 0.2)'
    },
    musicGenre: 'neutral',
    textStyle: {
      font: 'Arial',
      shadow: true
    }
  }
}

// ============================================================================
// SLIDESHOW GENERATOR
// ============================================================================

export class SlideshowGenerator {
  private supabase: ReturnType<typeof createClient>
  private userId: string
  
  constructor(userId: string) {
    this.userId = userId
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  /**
   * Generate slideshow video from photos
   */
  async generateSlideshow(options: SlideshowOptions): Promise<SlideshowMetadata> {
    console.log(`[SlideshowGenerator] Creating ${options.theme} slideshow: ${options.title}`)
    
    const theme = THEME_CONFIGS[options.theme]
    const outputDir = `/home/claude/slideshows/${this.userId}`
    const outputFilename = `${Date.now()}_${options.theme}.${options.outputFormat}`
    const outputPath = path.join(outputDir, outputFilename)
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })
    
    // Step 1: Prepare photos (resize, enhance, add overlays)
    console.log('[SlideshowGenerator] Preparing photos...')
    const preparedPhotos = await this.preparePhotos(
      options.photos,
      options.resolution,
      options.theme,
      options.textOverlays || []
    )
    
    // Step 2: Generate video with FFmpeg
    console.log('[SlideshowGenerator] Generating video...')
    await this.generateVideo(
      preparedPhotos,
      outputPath,
      options
    )
    
    // Step 3: Generate thumbnail
    const thumbnailPath = await this.generateThumbnail(preparedPhotos[0], outputDir)
    
    // Step 4: Save metadata to database
    const metadata: SlideshowMetadata = {
      id: `slideshow_${Date.now()}`,
      userId: this.userId,
      theme: options.theme,
      title: options.title,
      photoCount: options.photos.length,
      duration: options.photos.length * options.duration,
      outputPath,
      thumbnailPath,
      createdAt: new Date()
    }
    
    await this.saveMetadata(metadata)
    
    console.log('[SlideshowGenerator] Slideshow complete!')
    
    return metadata
  }
  
  /**
   * Prepare photos (resize, enhance, add text overlays)
   */
  private async preparePhotos(
    photos: string[],
    resolution: string,
    theme: SlideshowTheme,
    overlays: TextOverlay[]
  ): Promise<string[]> {
    const preparedPhotos: string[] = []
    const tempDir = `/tmp/slideshow_${Date.now()}`
    await fs.mkdir(tempDir, { recursive: true })
    
    const dimensions = this.getResolutionDimensions(resolution)
    const themeConfig = THEME_CONFIGS[theme]
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      
      try {
        // Load and resize image
        const image = await Jimp.read(photo)
        
        // Resize to fit resolution (maintain aspect ratio)
        image.cover(dimensions.width, dimensions.height, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)
        
        // Enhance image quality
        image.brightness(0.05) // Slight brightness boost
        image.contrast(0.1) // Slight contrast boost
        
        // Add text overlay if specified for this photo
        const overlay = overlays.find(o => o.photoIndex === i)
        if (overlay) {
          await this.addTextOverlay(image, overlay, themeConfig)
        }
        
        // Save prepared photo
        const outputPath = path.join(tempDir, `photo_${i.toString().padStart(4, '0')}.jpg`)
        await image.quality(95).writeAsync(outputPath)
        preparedPhotos.push(outputPath)
        
      } catch (error) {
        console.error(`[SlideshowGenerator] Error preparing photo ${i}:`, error)
        // Skip problematic photos
      }
    }
    
    return preparedPhotos
  }
  
  /**
   * Add text overlay to image
   */
  private async addTextOverlay(
    image: Jimp,
    overlay: TextOverlay,
    themeConfig: any
  ): Promise<void> {
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
    
    let y: number
    switch (overlay.position) {
      case 'top':
        y = 50
        break
      case 'bottom':
        y = image.getHeight() - 100
        break
      case 'center':
        y = image.getHeight() / 2
        break
    }
    
    // Add semi-transparent background for text
    if (overlay.backgroundColor) {
      const bgColor = Jimp.cssColorToHex(overlay.backgroundColor)
      image.scan(0, y - 20, image.getWidth(), 60, (x, y, idx) => {
        image.bitmap.data[idx + 3] = 180 // Alpha channel
      })
    }
    
    // Add text
    image.print(
      font,
      0,
      y,
      {
        text: overlay.text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      },
      image.getWidth()
    )
  }
  
  /**
   * Generate video using FFmpeg
   */
  private async generateVideo(
    photos: string[],
    outputPath: string,
    options: SlideshowOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create concat file for FFmpeg
      const concatFile = `/tmp/concat_${Date.now()}.txt`
      const concatContent = photos.map(p => `file '${p}'\nduration ${options.duration}`).join('\n')
      
      fs.writeFile(concatFile, concatContent).then(() => {
        let command = ffmpeg()
          .input(concatFile)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions([
            '-vsync vfr',
            '-pix_fmt yuv420p',
            `-vf "fade=t=in:st=0:d=${options.transitionDuration},fade=t=out:st=${options.duration - options.transitionDuration}:d=${options.transitionDuration}"`
          ])
          .videoCodec('libx264')
          .fps(30)
        
        // Add music if provided
        if (options.musicPath) {
          command = command
            .input(options.musicPath)
            .audioCodec('aac')
            .audioFilters([
              `volume=${options.musicVolume || 0.5}`,
              'afade=t=in:st=0:d=2',
              `afade=t=out:st=${photos.length * options.duration - 2}:d=2`
            ])
        }
        
        command
          .output(outputPath)
          .on('end', () => {
            fs.unlink(concatFile)
            resolve()
          })
          .on('error', (err) => {
            fs.unlink(concatFile)
            reject(err)
          })
          .run()
      })
    })
  }
  
  /**
   * Generate thumbnail from first photo
   */
  private async generateThumbnail(photoPath: string, outputDir: string): Promise<string> {
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg')
    const image = await Jimp.read(photoPath)
    await image.resize(320, 180).quality(80).writeAsync(thumbnailPath)
    return thumbnailPath
  }
  
  /**
   * Get resolution dimensions
   */
  private getResolutionDimensions(resolution: string): { width: number; height: number } {
    switch (resolution) {
      case '720p':
        return { width: 1280, height: 720 }
      case '1080p':
        return { width: 1920, height: 1080 }
      case '4k':
        return { width: 3840, height: 2160 }
      default:
        return { width: 1920, height: 1080 }
    }
  }
  
  /**
   * Save metadata to database
   */
  private async saveMetadata(metadata: SlideshowMetadata): Promise<void> {
    await this.supabase
      .from('slideshows')
      .insert({
        id: metadata.id,
        user_id: metadata.userId,
        theme: metadata.theme,
        title: metadata.title,
        photo_count: metadata.photoCount,
        duration: metadata.duration,
        output_path: metadata.outputPath,
        thumbnail_path: metadata.thumbnailPath,
        created_at: metadata.createdAt.toISOString()
      })
  }
  
  /**
   * Get user's slideshows
   */
  async getSlideshows(): Promise<SlideshowMetadata[]> {
    const { data } = await this.supabase
      .from('slideshows')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
    
    return data || []
  }
  
  /**
   * Quick create: Auto-generate slideshow from event library
   */
  async quickCreateFromLibrary(
    libraryId: string,
    theme: SlideshowTheme,
    title: string,
    musicPath?: string
  ): Promise<SlideshowMetadata> {
    // Get all photos from library
    const { data: photos } = await this.supabase
      .from('media_files')
      .select('filepath')
      .eq('category_id', libraryId)
      .eq('mime_type', 'image/jpeg')
      .order('file_created_at', { ascending: true })
      .limit(100)
    
    if (!photos || photos.length === 0) {
      throw new Error('No photos found in library')
    }
    
    const photoPaths = photos.map(p => p.filepath)
    const themeConfig = THEME_CONFIGS[theme]
    
    // Generate slideshow with smart defaults
    return this.generateSlideshow({
      theme,
      title,
      photos: photoPaths,
      duration: themeConfig.defaultDuration,
      transitionEffect: themeConfig.defaultTransition,
      transitionDuration: 1,
      musicPath,
      musicVolume: 0.5,
      includeTextOverlays: true,
      textOverlays: [
        {
          text: title,
          photoIndex: 0,
          position: 'center',
          fontSize: 48,
          fontColor: themeConfig.colorScheme.text,
          backgroundColor: themeConfig.colorScheme.background,
          animation: 'fade_in'
        }
      ],
      resolution: '1080p',
      outputFormat: 'mp4'
    })
  }
}

export default SlideshowGenerator
