'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, Tablet, Tv, Laptop, Cloud, Zap, Shield, 
  Sparkles, PlayCircle, Download, Settings, Check 
} from 'lucide-react'

export default function HomePage() {
  const [activeDevice, setActiveDevice] = useState(0)
  const devices = ['Phone', 'Tablet', 'TV', 'Laptop']

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDevice((prev) => (prev + 1) % devices.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              JAVARI
              <br />
              OMNI-MEDIA
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              One App. All Media. Unlimited Devices.
            </p>
            
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              The universal operating system for your digital life. Replace dozens of apps with one intelligent platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-lg transition-all hover:scale-105 animate-glow">
                Start Free Trial
              </button>
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full font-semibold text-lg transition-all hover:scale-105 border border-white/20">
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Device Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="glass rounded-3xl p-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-8 mb-8">
                {[
                  { icon: Smartphone, label: 'Phone' },
                  { icon: Tablet, label: 'Tablet' },
                  { icon: Tv, label: 'TV' },
                  { icon: Laptop, label: 'Laptop' }
                ].map((device, index) => {
                  const Icon = device.icon
                  return (
                    <div
                      key={device.label}
                      className={`flex flex-col items-center gap-2 transition-all ${
                        activeDevice === index ? 'scale-110 text-blue-400' : 'text-gray-500'
                      }`}
                    >
                      <Icon size={40} />
                      <span className="text-sm font-medium">{device.label}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-white mb-2">
                  Setup Once. Works Everywhere.
                </p>
                <p className="text-gray-400">
                  Configure on one device → All {devices.length}+ devices sync instantly
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16">
            Everything You Need. <span className="text-blue-400">Nothing You Don't.</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Cloud,
                title: 'Cloud Storage Optimizer',
                description: 'Save $200-400/year by routing photos to Amazon Photos (FREE), movies to cheap storage, work docs to OneDrive.',
                savings: '$264/year average savings'
              },
              {
                icon: Zap,
                title: 'Unlimited Devices',
                description: 'Install on phone, tablet, TV, computer - unlimited. Services see ONE device. No more "too many devices" errors.',
                savings: 'No device limits ever'
              },
              {
                icon: Shield,
                title: 'Device Virtualization',
                description: 'Revolutionary proxy technology hides your real devices from services. Privacy-first architecture.',
                savings: 'Patent-pending tech'
              },
              {
                icon: Sparkles,
                title: 'Javari AI Built-In',
                description: 'Natural language control. "Find me classic noir films" → Done. Autonomous optimization while you sleep.',
                savings: 'AI that actually helps'
              },
              {
                icon: PlayCircle,
                title: 'Universal Streaming',
                description: 'Netflix, Hulu, YouTube TV, your library, 850+ free channels - ALL in one beautiful interface.',
                savings: 'Replace 10+ apps'
              },
              {
                icon: Download,
                title: 'DVR + Commercial Removal',
                description: 'Record from any source. Auto-remove commercials. Compress to H.265. Add to library. Set and forget.',
                savings: 'Save 70% storage'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 mb-3">{feature.description}</p>
                <p className="text-sm text-green-400 font-semibold">{feature.savings}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4">
            One-Time Payment. <span className="text-blue-400">Lifetime Access.</span>
          </h2>
          <p className="text-center text-gray-400 mb-16 text-lg">
            No subscriptions. No monthly fees. Pay once, own forever.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$49',
                features: [
                  'Unlimited compression',
                  '200,000+ free content',
                  'Full organization',
                  'Desktop app',
                  'Cloud optimization',
                  '5 devices'
                ]
              },
              {
                name: 'Pro',
                price: '$99',
                features: [
                  'Everything in Starter',
                  'Mobile apps (iOS/Android)',
                  'DVR functionality',
                  'Javari AI autonomous mode',
                  'API access',
                  '10 devices',
                  'Family sharing'
                ],
                popular: true
              },
              {
                name: 'Ultimate',
                price: '$199',
                features: [
                  'Everything in Pro',
                  'Plex replacement mode',
                  'Universal streaming guide',
                  'Priority optimization',
                  'Unlimited devices',
                  'White-glove onboarding',
                  'Lifetime updates'
                ]
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`glass rounded-2xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-400"> one-time</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-full font-semibold transition-all ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 mt-12">
            All plans include <span className="text-green-400 font-semibold">30-day money-back guarantee</span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Stop Wasting Money on Duplicate Storage
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands saving $200-400/year while simplifying their digital life
            </p>
            <button className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-xl transition-all hover:scale-105 animate-glow">
              Start Your Free Trial
            </button>
            <p className="text-sm text-gray-400 mt-4">No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p className="mb-2">© 2026 CR AudioViz AI, LLC. All rights reserved.</p>
          <p className="text-sm">Javari Omni-Media™ - Patent Pending</p>
        </div>
      </footer>
    </div>
  )
}
