// lib/core/init.ts
/**
 * APP INITIALIZATION
 * 
 * Connects this app to CR AudioViz AI core services.
 * Must be called before any other core functionality.
 */

import { initCore, CRAudioVizAICore } from './craudiovizai-sdk'

// App configuration
export const APP_CONFIG = {
  appId: 'javari-omni-media',
  appSecret: process.env.CRAUDIOVIZAI_APP_SECRET!,
  coreApiUrl: process.env.CRAUDIOVIZAI_API_URL || 'https://api.craudiovizai.com',
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development'
}

// Initialize core connection
let core: CRAudioVizAICore

export function initializeApp() {
  if (!process.env.CRAUDIOVIZAI_APP_SECRET) {
    throw new Error('CRAUDIOVIZAI_APP_SECRET environment variable is required')
  }
  
  core = initCore(APP_CONFIG)
  
  console.log('✅ Javari Omni Media connected to CR AudioViz AI Core')
  console.log(`   Core API: ${APP_CONFIG.coreApiUrl}`)
  console.log(`   Environment: ${APP_CONFIG.environment}`)
  
  return core
}

export function getAppCore() {
  if (!core) {
    core = initializeApp()
  }
  return core
}
