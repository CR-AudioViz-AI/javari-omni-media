'use client'

import Link from 'next/link'
import { ArrowLeft, Cloud, HardDrive, Zap, CheckCircle, XCircle } from 'lucide-react'

export default function StoragePage() {
  const providers = [
    { name: 'Amazon Photos', connected: true, used: 0, total: 'Unlimited', cost: 0, type: 'Photos' },
    { name: 'OneDrive', connected: true, used: 234, total: 1000, cost: 6.99, type: 'Work Docs' },
    { name: 'Google Drive', connected: false, used: 0, total: 0, cost: 0, type: 'Not Connected' },
    { name: 'Backblaze B2', connected: true, used: 5600, total: 10000, cost: 5.00, type: 'Movies/TV' },
    { name: 'Local NAS', connected: true, used: 8200, total: 11000, cost: 0, type: 'All Media' },
  ]

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
              Cloud <span className="text-blue-400">Storage</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Optimization Recommendation</h2>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-gray-400 mb-4">
            Javari AI detected optimization opportunities that could save you <span className="text-green-400 font-bold">$264/year</span>
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
            Run Optimization Now
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6">Connected Storage Providers</h2>

        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.name} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {provider.connected ? (
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{provider.name}</h3>
                    <p className="text-sm text-gray-400">{provider.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {provider.connected ? (
                    <div>
                      <p className="text-lg font-bold">
                        {provider.used} GB {provider.total !== 'Unlimited' && `/ ${provider.total} GB`}
                      </p>
                      <p className="text-sm text-gray-400">
                        {provider.cost === 0 ? 'FREE' : `$${provider.cost}/mo`}
                      </p>
                    </div>
                  ) : (
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              </div>
              {provider.connected && provider.total !== 'Unlimited' && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${(provider.used / Number(provider.total)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 glass rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Add Storage Provider</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Dropbox', 'iCloud', 'Box', 'pCloud'].map((name) => (
              <button key={name} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                <Cloud className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">{name}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
