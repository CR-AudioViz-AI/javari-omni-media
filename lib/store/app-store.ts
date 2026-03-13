// lib/store/app-store.ts
// Javari Omni-Media - Global Application State
// Single source of truth for entire platform
// Date: March 12, 2026

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

export type SetupStep = 
  | 'welcome'
  | 'what-you-have'
  | 'streaming-services'
  | 'nas-setup'
  | 'iptv-setup'
  | 'cloud-storage'
  | 'vpn-setup'
  | 'complete'

export interface UserSetupConfig {
  // What they have
  hasNAS: boolean
  nasHost?: string
  nasPort?: number
  nasType?: 'synology' | 'qnap' | 'unraid' | 'truenas' | 'other'
  nasUsername?: string
  nasPath?: string

  // Arr stack
  hasRadarr: boolean
  radarrUrl?: string
  radarrApiKey?: string
  hasSonarr: boolean
  sonarrUrl?: string
  sonarrApiKey?: string
  hasLidarr: boolean
  lidarrUrl?: string
  lidarrApiKey?: string
  hasJellyfin: boolean
  jellyfinUrl?: string
  jellyfinApiKey?: string
  hasPlex: boolean
  plexUrl?: string
  plexToken?: string

  // Streaming subscriptions
  streamingServices: string[]

  // IPTV
  hasIPTV: boolean
  iptvM3uUrl?: string
  iptvM3uLocal?: string
  iptvUsername?: string
  iptvPassword?: string
  iptvProvider?: string

  // Cloud storage
  cloudProviders: string[]

  // VPN
  hasVPN: boolean
  vpnProvider?: string

  // Location for local channels
  city?: string
  state?: string
  zipCode?: string

  // Setup complete
  setupComplete: boolean
  setupCompletedAt?: string
}

export interface Channel {
  id: string
  name: string
  logo?: string
  streamUrl: string
  group: string
  country?: string
  language?: string
  isHD: boolean
  isLive: boolean
  epgId?: string
  currentShow?: EPGEntry
  nextShow?: EPGEntry
}

export interface EPGEntry {
  id: string
  channelId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  category?: string
  poster?: string
  rating?: string
}

export interface MediaItem {
  id: string
  title: string
  type: 'movie' | 'tv' | 'music' | 'photo' | 'podcast' | 'audiobook' | 'comic' | 'ebook'
  year?: number
  poster?: string
  backdrop?: string
  overview?: string
  rating?: number
  streamUrl?: string
  localPath?: string
  source: 'local' | 'nas' | 'jellyfin' | 'plex' | 'streaming'
  duration?: number
  watched?: boolean
  watchProgress?: number
  addedAt: string
  metadata?: Record<string, unknown>
}

export interface NowPlaying {
  item: MediaItem | Channel | null
  type: 'media' | 'live-tv' | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  isMinimized: boolean
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

// ============================================================================
// STORE
// ============================================================================

interface AppStore {
  // Setup
  setupConfig: UserSetupConfig
  setupStep: SetupStep
  isSetupComplete: boolean
  updateSetupConfig: (config: Partial<UserSetupConfig>) => void
  setSetupStep: (step: SetupStep) => void
  completeSetup: () => void

  // Navigation
  activeSection: 'home' | 'live-tv' | 'movies' | 'tv-shows' | 'music' | 'sports' | 'library' | 'discover' | 'storage' | 'settings'
  setActiveSection: (section: AppStore['activeSection']) => void

  // Channels
  channels: Channel[]
  channelGroups: string[]
  activeChannelGroup: string
  setChannels: (channels: Channel[]) => void
  setActiveChannelGroup: (group: string) => void
  favoriteChannels: string[]
  toggleFavoriteChannel: (channelId: string) => void

  // Library
  libraryItems: MediaItem[]
  setLibraryItems: (items: MediaItem[]) => void
  addLibraryItem: (item: MediaItem) => void

  // Now Playing
  nowPlaying: NowPlaying
  playMedia: (item: MediaItem) => void
  playChannel: (channel: Channel) => void
  pausePlayback: () => void
  resumePlayback: () => void
  stopPlayback: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  minimizePlayer: () => void
  maximizePlayer: () => void

  // Search
  searchQuery: string
  searchResults: (MediaItem | Channel)[]
  setSearchQuery: (query: string) => void
  setSearchResults: (results: (MediaItem | Channel)[]) => void

  // Notifications
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // Javari AI
  javariChatOpen: boolean
  javariMessages: { role: 'user' | 'assistant'; content: string; timestamp: string }[]
  toggleJavariChat: () => void
  addJavariMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void
  clearJavariMessages: () => void
}

const defaultSetupConfig: UserSetupConfig = {
  hasNAS: false,
  hasRadarr: false,
  hasSonarr: false,
  hasLidarr: false,
  hasJellyfin: false,
  hasPlex: false,
  streamingServices: [],
  hasIPTV: false,
  cloudProviders: [],
  hasVPN: false,
  setupComplete: false,
}

const defaultNowPlaying: NowPlaying = {
  item: null,
  type: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  isMinimized: false,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Setup
      setupConfig: defaultSetupConfig,
      setupStep: 'welcome',
      isSetupComplete: false,

      updateSetupConfig: (config) =>
        set((s) => ({ setupConfig: { ...s.setupConfig, ...config } })),

      setSetupStep: (step) => set({ setupStep: step }),

      completeSetup: () =>
        set((s) => ({
          isSetupComplete: true,
          setupConfig: {
            ...s.setupConfig,
            setupComplete: true,
            setupCompletedAt: new Date().toISOString(),
          },
        })),

      // Navigation
      activeSection: 'home',
      setActiveSection: (section) => set({ activeSection: section }),

      // Channels
      channels: [],
      channelGroups: [],
      activeChannelGroup: 'All',
      setChannels: (channels) => {
        const groups = ['All', ...Array.from(new Set(channels.map((c) => c.group))).sort()]
        set({ channels, channelGroups: groups })
      },
      setActiveChannelGroup: (group) => set({ activeChannelGroup: group }),
      favoriteChannels: [],
      toggleFavoriteChannel: (channelId) =>
        set((s) => ({
          favoriteChannels: s.favoriteChannels.includes(channelId)
            ? s.favoriteChannels.filter((id) => id !== channelId)
            : [...s.favoriteChannels, channelId],
        })),

      // Library
      libraryItems: [],
      setLibraryItems: (items) => set({ libraryItems: items }),
      addLibraryItem: (item) =>
        set((s) => ({ libraryItems: [item, ...s.libraryItems] })),

      // Now Playing
      nowPlaying: defaultNowPlaying,
      playMedia: (item) =>
        set({
          nowPlaying: {
            ...defaultNowPlaying,
            item,
            type: 'media',
            isPlaying: true,
            volume: get().nowPlaying.volume,
          },
        }),
      playChannel: (channel) =>
        set({
          nowPlaying: {
            ...defaultNowPlaying,
            item: channel,
            type: 'live-tv',
            isPlaying: true,
            volume: get().nowPlaying.volume,
          },
        }),
      pausePlayback: () =>
        set((s) => ({ nowPlaying: { ...s.nowPlaying, isPlaying: false } })),
      resumePlayback: () =>
        set((s) => ({ nowPlaying: { ...s.nowPlaying, isPlaying: true } })),
      stopPlayback: () => set({ nowPlaying: defaultNowPlaying }),
      setVolume: (volume) =>
        set((s) => ({ nowPlaying: { ...s.nowPlaying, volume, isMuted: volume === 0 } })),
      setCurrentTime: (currentTime) =>
        set((s) => ({ nowPlaying: { ...s.nowPlaying, currentTime } })),
      minimizePlayer: () =>
        set((s) => ({ nowPlaying: { ...s.nowPlaying, isMinimized: true, isFullscreen: false } })),
      maximizePlayer: () =>
        set((s) => ({ nowPlaying: { ...s.nowPlaying, isMinimized: false } })),

      // Search
      searchQuery: '',
      searchResults: [],
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSearchResults: (searchResults) => set({ searchResults }),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              ...n,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ].slice(0, 50),
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Javari AI
      javariChatOpen: false,
      javariMessages: [],
      toggleJavariChat: () =>
        set((s) => ({ javariChatOpen: !s.javariChatOpen })),
      addJavariMessage: (msg) =>
        set((s) => ({
          javariMessages: [
            ...s.javariMessages,
            { ...msg, timestamp: new Date().toISOString() },
          ],
        })),
      clearJavariMessages: () => set({ javariMessages: [] }),
    }),
    {
      name: 'javari-omni-media',
      partialize: (s) => ({
        setupConfig: s.setupConfig,
        isSetupComplete: s.isSetupComplete,
        favoriteChannels: s.favoriteChannels,
        nowPlaying: { volume: s.nowPlaying.volume, isMuted: s.nowPlaying.isMuted },
      }),
    }
  )
)
