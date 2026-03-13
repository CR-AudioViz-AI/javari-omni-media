'use client'
import { Suspense } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()
  useEffect(() => {
    supabase.auth.exchangeCodeForSession(params.get('code') || '').then(() => router.push('/'))
  }, [router, params])
  return <div style={{ minHeight: '100vh', background: '#070b13', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'system-ui' }}>Signing you in...</div>
}

export default function CallbackPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#070b13' }} />}><CallbackHandler /></Suspense>
}
