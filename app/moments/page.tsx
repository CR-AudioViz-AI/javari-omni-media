'use client'

import { useState } from 'react'
import { AppNavigation } from '@/components/AppNavigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Heart, Users, Sparkles, Zap, Camera, Upload, X } from 'lucide-react'
import Link from 'next/link'

interface MomentType {
  id: string
  name: string
  description: string
  icon: any
  examples: string[]
  credits: number
}

const MOMENT_TYPES: MomentType[] = [
  {
    id: 'bring-together',
    name: 'Bring Two People Together',
    description: 'Create a photo of two people together - hugging, kissing, holding hands, or just being near each other',
    icon: Heart,
    examples: ['Parents hugging', 'Grandparents together', 'You and a loved one', 'Family reunion'],
    credits: 15
  },
  {
    id: 'family-moment',
    name: 'Create a Family Moment',
    description: 'Bring your whole family together in one beautiful scene',
    icon: Users,
    examples: ['Everyone in paradise', 'Holiday gathering', 'Multi-generation photo', 'All together again'],
    credits: 20
  },
  {
    id: 'transform',
    name: 'Transform & Dream',
    description: 'Turn anyone into anything - superheroes, flying, magical moments',
    icon: Sparkles,
    examples: ['Become superheroes', 'Flying through the sky', 'Magical powers', 'Living the dream'],
    credits: 20
  },
  {
    id: 'custom',
    name: 'Custom Creation',
    description: 'Describe any moment you can imagine and we\'ll create it',
    icon: Zap,
    examples: ['Anything you envision', 'Your unique idea', 'Special request', 'Something amazing'],
    credits: 25
  }
]

const ENVIRONMENTS = [
  { id: 'heaven', name: 'Heaven/Paradise', description: 'Beautiful garden, peaceful, heavenly' },
  { id: 'garden', name: 'Beautiful Garden', description: 'Flowers, sunshine, serene' },
  { id: 'beach', name: 'Beach at Sunset', description: 'Ocean, golden hour, romantic' },
  { id: 'home', name: 'Cozy Home', description: 'Warm, comfortable, familiar' },
  { id: 'city', name: 'City Skyline', description: 'Urban, modern, dramatic' },
  { id: 'nature', name: 'Nature Scene', description: 'Mountains, forests, natural beauty' }
]

const ACTIONS = [
  { id: 'hugging', name: 'Hugging', description: 'Warm embrace' },
  { id: 'kissing', name: 'Kissing', description: 'Loving kiss' },
  { id: 'holding-hands', name: 'Holding Hands', description: 'Connected' },
  { id: 'sitting', name: 'Sitting Together', description: 'Side by side' },
  { id: 'walking', name: 'Walking Together', description: 'Strolling' },
  { id: 'dancing', name: 'Dancing', description: 'Moving together' }
]

export default function MomentsPage() {
  const { user, loading } = useAuth()
  const [step, setStep] = useState<'select' | 'customize' | 'upload' | 'creating' | 'result'>('select')
  const [selectedType, setSelectedType] = useState<MomentType | null>(null)
  const [selectedAction, setSelectedAction] = useState(ACTIONS[0])
  const [selectedEnvironment, setSelectedEnvironment] = useState(ENVIRONMENTS[0])
  const [photos, setPhotos] = useState<File[]>([])
  const [customDescription, setCustomDescription] = useState('')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <AppNavigation />
        <main className="container mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Create Any Moment</h1>
            <p className="text-xl text-gray-400 mb-12">
              The hug you never got. The kiss you missed. The moment that never was. Now it's real.
            </p>
            <div className="space-x-4">
              <Link href="/auth/signup">
                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition-all">
                  Sign Up to Create
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-lg font-semibold transition-all">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos(prev => [...prev, ...files].slice(0, 10))
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateMoment = async () => {
    setStep('creating')
    
    // Simulate creation process
    // TODO: Implement actual AI creation
    setTimeout(() => {
      setStep('result')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <AppNavigation />

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Create Any Moment</h1>
            <p className="text-xl text-gray-400">
              What moment do you wish existed?
            </p>
          </div>

          {/* Step 1: Select Moment Type */}
          {step === 'select' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Choose What to Create</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {MOMENT_TYPES.map(type => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type)
                        setStep('upload')
                      }}
                      className="glass rounded-2xl p-8 text-left hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Icon className="w-12 h-12 text-blue-400" />
                        <span className="text-sm text-gray-400">{type.credits} credits</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                        {type.name}
                      </h3>
                      <p className="text-gray-400 mb-4">{type.description}</p>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 font-semibold">Examples:</p>
                        <div className="flex flex-wrap gap-2">
                          {type.examples.map((example, i) => (
                            <span key={i} className="text-xs bg-white/5 px-3 py-1 rounded-full">
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Testimonials */}
              <div className="mt-16 glass rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">What People Are Creating</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-gray-300">"I created a photo of my mom holding my daughter. Mom died before my daughter was born. I cried for an hour."</p>
                    <p className="text-sm text-gray-500">- Sarah, 34</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-300">"Made my grandparents together in heaven. This comforted our whole family."</p>
                    <p className="text-sm text-gray-500">- Patricia, 58</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-300">"Turned my kids into superheroes. They watch it every day. Their confidence has soared."</p>
                    <p className="text-sm text-gray-500">- James, 36</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Upload Photos */}
          {step === 'upload' && selectedType && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Photos</h2>
                <button
                  onClick={() => setStep('select')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div className="glass rounded-2xl p-8">
                <p className="text-gray-400 mb-6">
                  Upload photos of the people you want in this moment
                </p>

                {/* Upload Area */}
                <label className="block border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-lg mb-2">Click to upload photos</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                  <p className="text-xs text-gray-600 mt-4">Up to 10 photos</p>
                </label>

                {/* Preview Uploaded Photos */}
                {photos.length > 0 && (
                  <div className="mt-6 grid grid-cols-5 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {photos.length >= 2 && (
                <button
                  onClick={() => setStep('customize')}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
                >
                  Continue to Customize
                </button>
              )}
            </div>
          )}

          {/* Step 3: Customize */}
          {step === 'customize' && selectedType && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Customize Your Moment</h2>
                <button
                  onClick={() => setStep('upload')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div className="glass rounded-2xl p-8 space-y-8">
                
                {/* Action Selection */}
                {selectedType.id === 'bring-together' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">How should they be together?</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {ACTIONS.map(action => (
                        <button
                          key={action.id}
                          onClick={() => setSelectedAction(action)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            selectedAction.id === action.id
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <p className="font-semibold mb-1">{action.name}</p>
                          <p className="text-sm text-gray-400">{action.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Environment Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Where should this moment be?</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {ENVIRONMENTS.map(env => (
                      <button
                        key={env.id}
                        onClick={() => setSelectedEnvironment(env)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedEnvironment.id === env.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <p className="font-semibold mb-1">{env.name}</p>
                        <p className="text-sm text-gray-400">{env.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Description */}
                {selectedType.id === 'custom' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Describe your vision</h3>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Describe the moment you want to create... Be as detailed as you like!"
                      className="w-full h-32 px-4 py-3 bg-white/5 border border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>
                )}

                {/* Summary & Create */}
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-gray-400">Total cost:</p>
                      <p className="text-3xl font-bold">{selectedType.credits} credits</p>
                      <p className="text-sm text-gray-500">(${(selectedType.credits * 0.10).toFixed(2)})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400">Your balance:</p>
                      <p className="text-2xl font-bold">100 credits</p>
                      <p className="text-sm text-gray-500">After: {100 - selectedType.credits} credits</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateMoment}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-lg transition-all"
                  >
                    Create Your Moment ✨
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Creating */}
          {step === 'creating' && (
            <div className="text-center py-24">
              <div className="glass rounded-2xl p-12 max-w-2xl mx-auto">
                <div className="w-24 h-24 mx-auto mb-8 relative">
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                
                <h2 className="text-3xl font-bold mb-4">Creating Your Moment...</h2>
                <p className="text-gray-400 mb-8">
                  Javari AI is working her magic. This usually takes 30-60 seconds.
                </p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">✓</div>
                    <span className="text-gray-300">Analyzing photos...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">✓</div>
                    <span className="text-gray-300">Mapping faces...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-gray-300">Composing scene...</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-6 h-6 border-2 border-gray-600 rounded-full" />
                    <span className="text-gray-500">Enhancing quality...</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-6 h-6 border-2 border-gray-600 rounded-full" />
                    <span className="text-gray-500">Final touches...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 'result' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">Your Moment is Ready! ✨</h2>
                <p className="text-gray-400">We hope this brings you joy</p>
              </div>

              <div className="glass rounded-2xl p-8">
                {/* TODO: Show actual generated image */}
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl h-96 flex items-center justify-center mb-6">
                  <Camera className="w-32 h-32 text-gray-600" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button className="py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all">
                    Download
                  </button>
                  <button className="py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all">
                    Share
                  </button>
                  <button 
                    onClick={() => setStep('select')}
                    className="py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                  >
                    Create Another
                  </button>
                </div>
              </div>

              {/* Enhancement Options */}
              <div className="glass rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6">Want to enhance it?</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-gray-700 rounded-xl p-6">
                    <p className="font-semibold mb-2">Animate</p>
                    <p className="text-sm text-gray-400 mb-4">Make it move and breathe</p>
                    <p className="text-blue-400 mb-3">+10 credits</p>
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
                      Add Animation
                    </button>
                  </div>
                  <div className="border border-gray-700 rounded-xl p-6">
                    <p className="font-semibold mb-2">Music Video</p>
                    <p className="text-sm text-gray-400 mb-4">Add music and effects</p>
                    <p className="text-blue-400 mb-3">+25 credits</p>
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
                      Create Video
                    </button>
                  </div>
                  <div className="border border-gray-700 rounded-xl p-6">
                    <p className="font-semibold mb-2">Ultra Quality</p>
                    <p className="text-sm text-gray-400 mb-4">8K resolution</p>
                    <p className="text-blue-400 mb-3">+10 credits</p>
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
