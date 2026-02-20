'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles, ExternalLink } from 'lucide-react'

export default function LoginPage() {
  // Redirect to craudiovizai.com OAuth
  const OAUTH_URL = 'https://craudiovizai.com/auth/login?app=javari-omni-media&redirect_uri=' + 
    encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '')

  const handleLogin = () => {
    // Redirect to main platform OAuth
    window.location.href = OAUTH_URL
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Link href="/">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
        </Link>

        {/* Login card */}
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400">
              Sign in with your CR AudioViz AI account
            </p>
          </div>

          <div className="space-y-4">
            {/* Main OAuth Button */}
            <button
              onClick={handleLogin}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Continue with CR AudioViz AI</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900/50 text-gray-400">
                  Secure OAuth Authentication
                </span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400">
                ✓ One account for all Javari apps
              </p>
              <p className="text-sm text-gray-400">
                ✓ Secure single sign-on
              </p>
              <p className="text-sm text-gray-400">
                ✓ No separate password needed
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
