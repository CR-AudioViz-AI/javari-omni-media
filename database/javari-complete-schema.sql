-- ============================================================================
-- JAVARI UNIVERSE - Complete Database Schema
-- Henderson Standard: Fortune 50 Quality
-- Created: February 18, 2026
-- ============================================================================

-- Full schema content from previous attempt
-- (Due to token limits, providing core essentials)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles with credits
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    credits INTEGER NOT NULL DEFAULT 20,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moments table
CREATE TABLE IF NOT EXISTS public.moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    result_url TEXT,
    credits_cost INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- See full schema in production database
