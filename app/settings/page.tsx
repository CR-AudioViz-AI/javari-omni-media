'use client'

import Link from 'next/link'
import { ArrowLeft, User, Bell, Shield, Palette, Zap } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-xl font-display font-bold">
              <span className="text-blue-400">Settings</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {[
            { icon: User, title: 'Account', description: 'Manage your profile and subscription' },
            { icon: Bell, title: 'Notifications', description: 'Configure alerts and updates' },
            { icon: Shield, title: 'Privacy & Security', description: 'Control your data and privacy' },
            { icon: Palette, title: 'Appearance', description: 'Customize theme and display' },
            { icon: Zap, title: 'Automation', description: 'Configure Javari AI behavior' },
          ].map((section) => {
            const Icon = section.icon
            return (
              <div key={section.title} className="glass rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 glass rounded-2xl p-6 text-center">
          <p className="text-gray-400 mb-4">Detailed settings panels coming soon!</p>
          <p className="text-sm text-gray-500">Full configuration options will be available in the next update.</p>
        </div>
      </main>
    </div>
  )
}
