// lib/core/craudiovizai-sdk.ts
/**
 * CR AUDIOVIZ AI CORE SERVICES SDK
 * 
 * This SDK connects all apps to craudiovizai.com core services:
 * - Authentication (OAuth, SSO)
 * - Payments (Stripe, PayPal) 
 * - Credits (buy, spend, balance)
 * - User Management
 * - Billing & Subscriptions
 * 
 * NO app implements these services locally.
 * ALL apps use this SDK to connect to core.
 * 
 * Henderson Standard: Single source of truth, zero duplication.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface CoreConfig {
  // Core API endpoint
  coreApiUrl: string              // e.g., 'https://api.craudiovizai.com'
  
  // App identification
  appId: string                   // e.g., 'javari-omni-media'
  appSecret: string               // Secure app credential
  
  // Environment
  environment: 'development' | 'staging' | 'production'
  
  // Optional overrides
  authUrl?: string                // Custom auth endpoint
  paymentsUrl?: string           // Custom payments endpoint
  creditsUrl?: string            // Custom credits endpoint
}

const DEFAULT_CONFIG: Partial<CoreConfig> = {
  coreApiUrl: process.env.CRAUDIOVIZAI_API_URL || 'https://api.craudiovizai.com',
  environment: (process.env.NODE_ENV as any) || 'development'
}

// ============================================================================
// CORE SDK CLASS
// ============================================================================

export class CRAudioVizAICore {
  private config: CoreConfig
  private accessToken?: string
  
  constructor(config: Partial<CoreConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config } as CoreConfig
    
    if (!this.config.appId || !this.config.appSecret) {
      throw new Error('CRAudioVizAI Core: appId and appSecret are required')
    }
  }
  
  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  
  /**
   * Get current user session from core
   * This checks the user's auth state with craudiovizai.com
   */
  async getSession(sessionToken: string): Promise<CoreUser | null> {
    try {
      const response = await this.request('/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      
      return response.user
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }
  
  /**
   * Validate user has access to this app
   */
  async validateAppAccess(userId: string): Promise<boolean> {
    try {
      const response = await this.request('/auth/validate-app-access', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          appId: this.config.appId
        })
      })
      
      return response.hasAccess
    } catch (error) {
      console.error('Failed to validate app access:', error)
      return false
    }
  }
  
  /**
   * Get OAuth login URL
   * Redirects to craudiovizai.com for login, then back to this app
   */
  getLoginUrl(redirectUri: string): string {
    const authUrl = this.config.authUrl || `${this.config.coreApiUrl}/auth/login`
    const params = new URLSearchParams({
      app_id: this.config.appId,
      redirect_uri: redirectUri,
      response_type: 'code'
    })
    
    return `${authUrl}?${params.toString()}`
  }
  
  /**
   * Exchange OAuth code for session token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await this.request('/auth/token', {
      method: 'POST',
      body: JSON.stringify({
        code,
        app_id: this.config.appId,
        app_secret: this.config.appSecret
      })
    })
    
    return response.access_token
  }
  
  // ==========================================================================
  // CREDITS SYSTEM
  // ==========================================================================
  
  /**
   * Get user's credit balance
   */
  async getCredits(userId: string): Promise<number> {
    const response = await this.request(`/credits/${userId}`, {
      method: 'GET'
    })
    
    return response.balance
  }
  
  /**
   * Spend credits for an action
   * This is atomic - either succeeds or fails, no partial deduction
   */
  async spendCredits(params: {
    userId: string
    amount: number
    action: string           // e.g., 'create_moment', 'enhance_image'
    metadata?: any
    idempotencyKey?: string  // Prevent double-charging
  }): Promise<CreditTransaction> {
    const response = await this.request('/credits/spend', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to spend credits')
    }
    
    return response.transaction
  }
  
  /**
   * Refund credits (e.g., if operation failed)
   */
  async refundCredits(transactionId: string, reason: string): Promise<void> {
    await this.request('/credits/refund', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: transactionId,
        reason
      })
    })
  }
  
  /**
   * Get credit pricing tiers
   */
  async getCreditPricing(): Promise<CreditPackage[]> {
    const response = await this.request('/credits/pricing', {
      method: 'GET'
    })
    
    return response.packages
  }
  
  // ==========================================================================
  // PAYMENTS (Stripe, PayPal)
  // ==========================================================================
  
  /**
   * Create payment intent for credits purchase
   */
  async createPaymentIntent(params: {
    userId: string
    packageId: string
    provider: 'stripe' | 'paypal'
    successUrl: string
    cancelUrl: string
  }): Promise<PaymentIntent> {
    const response = await this.request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    
    return response.intent
  }
  
  /**
   * Verify payment completed
   */
  async verifyPayment(paymentId: string): Promise<boolean> {
    const response = await this.request(`/payments/verify/${paymentId}`, {
      method: 'GET'
    })
    
    return response.verified
  }
  
  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================
  
  /**
   * Get user's active subscription
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const response = await this.request(`/subscriptions/${userId}`, {
        method: 'GET'
      })
      
      return response.subscription
    } catch (error) {
      return null
    }
  }
  
  /**
   * Create subscription checkout
   */
  async createSubscriptionCheckout(params: {
    userId: string
    planId: string
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession> {
    const response = await this.request('/subscriptions/create-checkout', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    
    return response.session
  }
  
  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    await this.request(`/subscriptions/${userId}/cancel`, {
      method: 'POST'
    })
  }
  
  // ==========================================================================
  // USER MANAGEMENT
  // ==========================================================================
  
  /**
   * Get user profile
   */
  async getUser(userId: string): Promise<CoreUser> {
    const response = await this.request(`/users/${userId}`, {
      method: 'GET'
    })
    
    return response.user
  }
  
  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<CoreUser>): Promise<CoreUser> {
    const response = await this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    
    return response.user
  }
  
  // ==========================================================================
  // ANALYTICS & TRACKING
  // ==========================================================================
  
  /**
   * Track app usage event
   */
  async trackEvent(params: {
    userId: string
    event: string
    properties?: any
  }): Promise<void> {
    await this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        app_id: this.config.appId,
        timestamp: new Date().toISOString()
      })
    })
  }
  
  // ==========================================================================
  // JAVARI AI INTEGRATION
  // ==========================================================================
  
  /**
   * Call Javari AI for intelligent routing
   * This uses javari.ai for AI operations
   */
  async callJavariAI(params: {
    task: 'create_moment' | 'enhance_image' | 'generate_text' | 'analyze_content'
    input: any
    userId: string
    priority?: 'quality' | 'speed' | 'cost' | 'balanced'
  }): Promise<any> {
    const javariUrl = process.env.JAVARI_AI_URL || 'https://api.javari.ai'
    
    const response = await fetch(`${javariUrl}/v1/${params.task}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': this.config.appId,
        'X-App-Secret': this.config.appSecret,
        'X-User-Id': params.userId
      },
      body: JSON.stringify({
        input: params.input,
        priority: params.priority || 'balanced'
      })
    })
    
    if (!response.ok) {
      throw new Error(`Javari AI error: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================
  
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.coreApiUrl}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      'X-App-Id': this.config.appId,
      'X-App-Secret': this.config.appSecret,
      ...options.headers
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Core API error: ${response.statusText}`)
    }
    
    return response.json()
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CoreUser {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'starter' | 'creator' | 'pro' | 'enterprise'
  credits: number
  createdAt: string
  updatedAt: string
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  action: string
  balanceBefore: number
  balanceAfter: number
  metadata?: any
  createdAt: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
  bonus?: number
}

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
  provider: 'stripe' | 'paypal'
  redirectUrl?: string
}

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: 'active' | 'canceled' | 'past_due'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface CheckoutSession {
  id: string
  url: string
  expiresAt: string
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let coreInstance: CRAudioVizAICore | null = null

export function initCore(config: Partial<CoreConfig>): CRAudioVizAICore {
  coreInstance = new CRAudioVizAICore(config)
  return coreInstance
}

export function getCore(): CRAudioVizAICore {
  if (!coreInstance) {
    throw new Error('Core not initialized. Call initCore() first.')
  }
  return coreInstance
}

// ============================================================================
// REACT HOOKS FOR EASY INTEGRATION
// ============================================================================

export function useCoreAuth() {
  const core = getCore()
  
  return {
    getSession: (token: string) => core.getSession(token),
    getLoginUrl: (redirect: string) => core.getLoginUrl(redirect),
    exchangeCode: (code: string) => core.exchangeCodeForToken(code)
  }
}

export function useCoreCredits(userId: string) {
  const core = getCore()
  
  return {
    getBalance: () => core.getCredits(userId),
    spend: (amount: number, action: string, metadata?: any) => 
      core.spendCredits({ userId, amount, action, metadata }),
    refund: (transactionId: string, reason: string) => 
      core.refundCredits(transactionId, reason),
    getPricing: () => core.getCreditPricing()
  }
}

export function useCorePayments(userId: string) {
  const core = getCore()
  
  return {
    createIntent: (packageId: string, provider: 'stripe' | 'paypal', successUrl: string, cancelUrl: string) =>
      core.createPaymentIntent({ userId, packageId, provider, successUrl, cancelUrl }),
    verifyPayment: (paymentId: string) => core.verifyPayment(paymentId)
  }
}

export function useCoreSubscription(userId: string) {
  const core = getCore()
  
  return {
    get: () => core.getSubscription(userId),
    createCheckout: (planId: string, successUrl: string, cancelUrl: string) =>
      core.createSubscriptionCheckout({ userId, planId, successUrl, cancelUrl }),
    cancel: () => core.cancelSubscription(userId)
  }
}

export function useJavariAI(userId: string) {
  const core = getCore()
  
  return {
    createMoment: (input: any, priority?: 'quality' | 'speed' | 'cost') =>
      core.callJavariAI({ task: 'create_moment', input, userId, priority }),
    enhanceImage: (input: any, priority?: 'quality' | 'speed' | 'cost') =>
      core.callJavariAI({ task: 'enhance_image', input, userId, priority }),
    generateText: (input: any, priority?: 'quality' | 'speed' | 'cost') =>
      core.callJavariAI({ task: 'generate_text', input, userId, priority }),
    analyzeContent: (input: any, priority?: 'quality' | 'speed' | 'cost') =>
      core.callJavariAI({ task: 'analyze_content', input, userId, priority })
  }
}
