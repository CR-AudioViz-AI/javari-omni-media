-- ============================================================================
-- JAVARI OMNI MEDIA - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Date: February 20, 2026
-- Database: PostgreSQL 14+ (Supabase)
-- Purpose: Foundation for the ultimate media platform
--
-- Design Principles:
-- 1. Extensible (easy to add new categories)
-- 2. Performant (optimized indexes)
-- 3. Scalable (handles billions of files)
-- 4. Secure (RLS policies)
-- 5. Clean (normalized, no duplication)
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For better indexing

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (synced from craudiovizai.com)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    credits INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Media categories (extensible!)
CREATE TABLE IF NOT EXISTS media_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- movie, tv-show, music, photo, etc.
    icon TEXT,
    description TEXT,
    plex_path TEXT,
    requires_age_verification BOOLEAN NOT NULL DEFAULT FALSE,
    supports_face_recognition BOOLEAN NOT NULL DEFAULT FALSE,
    is_personal_content BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_core BOOLEAN NOT NULL DEFAULT FALSE, -- Can't be disabled
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB, -- Flexible metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media files (the main table!)
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES media_categories(id),
    
    -- File info
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL, -- Full path
    file_size BIGINT NOT NULL, -- Bytes
    mime_type TEXT NOT NULL,
    duration INTEGER, -- Seconds (for video/audio)
    width INTEGER, -- Pixels (for video/images)
    height INTEGER, -- Pixels (for video/images)
    bitrate INTEGER, -- kbps
    codec TEXT,
    framerate DECIMAL(8,3), -- fps
    
    -- Storage location
    storage_provider TEXT NOT NULL, -- local, plex, google-drive, s3, etc.
    storage_path TEXT NOT NULL,
    storage_metadata JSONB, -- Provider-specific data
    
    -- Hash for deduplication
    file_hash TEXT, -- SHA-256
    content_hash TEXT, -- Perceptual hash for media
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading', 'processing', 'ready', 'error', 'deleted')),
    error_message TEXT,
    
    -- Timestamps
    file_created_at TIMESTAMPTZ,
    file_modified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Media metadata (rich data from TMDB, IMDB, etc.)
CREATE TABLE IF NOT EXISTS media_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    
    -- Basic metadata
    title TEXT,
    original_title TEXT,
    description TEXT,
    year INTEGER,
    release_date DATE,
    
    -- Movies/TV specific
    tmdb_id INTEGER,
    imdb_id TEXT,
    tvdb_id INTEGER,
    rating DECIMAL(3,1), -- 0.0 - 10.0
    votes_count INTEGER,
    popularity DECIMAL(10,3),
    
    -- TV specific
    season_number INTEGER,
    episode_number INTEGER,
    episode_title TEXT,
    series_id UUID REFERENCES media_files(id),
    
    -- Music specific
    artist TEXT,
    album TEXT,
    album_artist TEXT,
    track_number INTEGER,
    disc_number INTEGER,
    genre TEXT[],
    bpm INTEGER,
    musicbrainz_id TEXT,
    
    -- Relationships
    director TEXT[],
    cast TEXT[],
    writers TEXT[],
    producers TEXT[],
    studios TEXT[],
    networks TEXT[],
    countries TEXT[],
    languages TEXT[],
    
    -- Media
    poster_url TEXT,
    backdrop_url TEXT,
    logo_url TEXT,
    trailer_url TEXT,
    
    -- Additional
    tags TEXT[],
    keywords TEXT[],
    content_rating TEXT, -- PG, R, TV-14, etc.
    
    -- Flexible metadata
    extra_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Face recognition data
CREATE TABLE IF NOT EXISTS faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    
    -- Face data
    person_id UUID REFERENCES persons(id),
    face_embedding VECTOR(512), -- Embedding for face recognition
    confidence DECIMAL(5,4), -- 0.0 - 1.0
    
    -- Bounding box
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    
    -- Timestamps
    frame_number INTEGER, -- For videos
    timestamp_ms INTEGER, -- For videos
    
    -- Metadata
    age_estimate INTEGER,
    gender_estimate TEXT,
    emotion_estimate TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Persons (identified people)
CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Person info
    name TEXT NOT NULL,
    nickname TEXT,
    relationship TEXT, -- family, friend, colleague, etc.
    birth_date DATE,
    
    -- Representative face
    primary_face_id UUID REFERENCES faces(id),
    avatar_url TEXT,
    
    -- Privacy
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    shared_with UUID[], -- Array of user IDs
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CLOUD STORAGE
-- ============================================================================

-- Cloud connections (OAuth tokens)
CREATE TABLE IF NOT EXISTS cloud_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Provider info
    provider TEXT NOT NULL, -- google-drive, onedrive, dropbox, icloud, etc.
    provider_user_id TEXT, -- User ID from provider
    provider_email TEXT,
    
    -- OAuth tokens
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT, -- Encrypted
    token_expires_at TIMESTAMPTZ,
    
    -- Storage stats
    total_storage BIGINT, -- Bytes
    used_storage BIGINT, -- Bytes
    file_count INTEGER,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'disconnected')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, provider, provider_user_id)
);

-- Cloud files (cached metadata from cloud providers)
CREATE TABLE IF NOT EXISTS cloud_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cloud_connection_id UUID NOT NULL REFERENCES cloud_connections(id) ON DELETE CASCADE,
    
    -- File info
    provider_file_id TEXT NOT NULL, -- ID from provider
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    
    -- Hash for deduplication
    file_hash TEXT,
    
    -- Status
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of UUID REFERENCES cloud_files(id),
    
    -- Provider metadata
    provider_metadata JSONB,
    
    -- Timestamps
    file_created_at TIMESTAMPTZ,
    file_modified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    
    UNIQUE(cloud_connection_id, provider_file_id)
);

-- Duplicate groups (files that are the same across clouds)
CREATE TABLE IF NOT EXISTS duplicate_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Group info
    file_hash TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    filename TEXT, -- Representative filename
    
    -- Stats
    duplicate_count INTEGER NOT NULL DEFAULT 0,
    total_wasted_space BIGINT NOT NULL DEFAULT 0,
    
    -- Primary copy (keep this one)
    primary_file_id UUID,
    primary_provider TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- *ARR APPS INTEGRATION
-- ============================================================================

-- Indexers (Prowlarr)
CREATE TABLE IF NOT EXISTS indexers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexer info
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- torrent, usenet
    base_url TEXT NOT NULL,
    api_key TEXT, -- Encrypted
    
    -- Capabilities
    capabilities JSONB,
    categories TEXT[],
    
    -- Stats
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'error')),
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Download queue
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Download info
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- movie, tv-episode, music, book
    source TEXT NOT NULL, -- radarr, sonarr, lidarr, readarr, manual
    
    -- Target media
    target_media_id UUID REFERENCES media_files(id),
    
    -- Download client info
    client TEXT NOT NULL, -- qbittorrent, transmission, sabnzbd, etc.
    client_id TEXT, -- ID from download client
    
    -- Torrent/NZB info
    magnet_url TEXT,
    torrent_url TEXT,
    nzb_url TEXT,
    indexer_id UUID REFERENCES indexers(id),
    
    -- Progress
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'downloading', 'completed', 'failed', 'cancelled')),
    progress DECIMAL(5,2) DEFAULT 0.0, -- 0.00 - 100.00
    downloaded_bytes BIGINT DEFAULT 0,
    total_bytes BIGINT,
    download_speed BIGINT, -- Bytes per second
    eta_seconds INTEGER,
    
    -- Quality
    quality_profile TEXT,
    resolution TEXT,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STREAMING SERVICES
-- ============================================================================

-- Streaming services
CREATE TABLE IF NOT EXISTS streaming_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    base_price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    countries TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User streaming subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES streaming_services(id),
    
    -- Subscription info
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    monthly_cost DECIMAL(10,2),
    
    -- Dates
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, service_id)
);

-- Content availability (where to watch)
CREATE TABLE IF NOT EXISTS content_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content identification
    tmdb_id INTEGER,
    imdb_id TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- movie, tv
    
    -- Availability
    service_id TEXT NOT NULL REFERENCES streaming_services(id),
    available_in_countries TEXT[],
    deep_link_url TEXT,
    
    -- Pricing (if rentable/purchasable)
    rent_price DECIMAL(10,2),
    buy_price DECIMAL(10,2),
    
    -- Dates
    available_from DATE,
    available_until DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tmdb_id, service_id),
    UNIQUE(imdb_id, service_id)
);

-- ============================================================================
-- USER ACTIVITY & ENGAGEMENT
-- ============================================================================

-- Watch history
CREATE TABLE IF NOT EXISTS watch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    
    -- Playback info
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    total_seconds INTEGER,
    progress DECIMAL(5,2) DEFAULT 0.0, -- 0.00 - 100.00
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Watchlist',
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Watchlist items
CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    
    -- External content (from streaming services)
    tmdb_id INTEGER,
    imdb_id TEXT,
    title TEXT,
    type TEXT,
    
    -- User data
    notes TEXT,
    priority INTEGER,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    poster_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collection items
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE METRICS
-- ============================================================================

-- Performance benchmarks (vs Plex)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metric type
    metric_type TEXT NOT NULL, -- library_scan, search, transcode, etc.
    
    -- Our performance
    javari_time_ms INTEGER NOT NULL,
    javari_memory_mb INTEGER,
    javari_cpu_percent DECIMAL(5,2),
    
    -- Plex performance (for comparison)
    plex_time_ms INTEGER,
    plex_memory_mb INTEGER,
    plex_cpu_percent DECIMAL(5,2),
    
    -- Context
    library_size INTEGER,
    file_count INTEGER,
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATION TOOLS
-- ============================================================================

-- Created content (from our AI tools)
CREATE TABLE IF NOT EXISTS created_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Creation info
    content_type TEXT NOT NULL, -- meme, video, song, image, etc.
    title TEXT,
    description TEXT,
    
    -- Input
    input_data JSONB,
    prompt TEXT,
    
    -- Output
    output_url TEXT,
    output_file_id UUID REFERENCES media_files(id),
    
    -- AI info
    ai_provider TEXT, -- javari, openai, anthropic, etc.
    ai_model TEXT,
    credits_used INTEGER,
    
    -- Stats
    generation_time_ms INTEGER,
    quality_score DECIMAL(5,4),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES (Performance!)
-- ============================================================================

-- Media files indexes
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_category_id ON media_files(category_id);
CREATE INDEX idx_media_files_file_hash ON media_files(file_hash);
CREATE INDEX idx_media_files_storage_provider ON media_files(storage_provider);
CREATE INDEX idx_media_files_status ON media_files(status);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);
CREATE INDEX idx_media_files_deleted_at ON media_files(deleted_at) WHERE deleted_at IS NULL;

-- Media metadata indexes
CREATE INDEX idx_media_metadata_media_file_id ON media_metadata(media_file_id);
CREATE INDEX idx_media_metadata_tmdb_id ON media_metadata(tmdb_id);
CREATE INDEX idx_media_metadata_imdb_id ON media_metadata(imdb_id);
CREATE INDEX idx_media_metadata_title_trgm ON media_metadata USING gin(title gin_trgm_ops); -- Fuzzy search
CREATE INDEX idx_media_metadata_year ON media_metadata(year);
CREATE INDEX idx_media_metadata_rating ON media_metadata(rating DESC);

-- Faces indexes
CREATE INDEX idx_faces_media_file_id ON faces(media_file_id);
CREATE INDEX idx_faces_person_id ON faces(person_id);
CREATE INDEX idx_faces_embedding ON faces USING ivfflat (face_embedding vector_cosine_ops); -- Vector search

-- Cloud files indexes
CREATE INDEX idx_cloud_files_connection_id ON cloud_files(cloud_connection_id);
CREATE INDEX idx_cloud_files_file_hash ON cloud_files(file_hash);
CREATE INDEX idx_cloud_files_is_duplicate ON cloud_files(is_duplicate) WHERE is_duplicate = TRUE;

-- Watch history indexes
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_watch_history_media_file_id ON watch_history(media_file_id);
CREATE INDEX idx_watch_history_last_watched_at ON watch_history(last_watched_at DESC);

-- Downloads indexes
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_downloads_created_at ON downloads(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexers ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE created_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY user_own_data ON media_files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON faces FOR ALL USING (auth.uid() = (SELECT user_id FROM media_files WHERE id = media_file_id));
CREATE POLICY user_own_data ON persons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON cloud_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON cloud_files FOR ALL USING (auth.uid() = (SELECT user_id FROM cloud_connections WHERE id = cloud_connection_id));
CREATE POLICY user_own_data ON duplicate_groups FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON indexers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON downloads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_data ON created_content FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default media categories
INSERT INTO media_categories (id, name, type, icon, description, is_core, sort_order) VALUES
-- Personal content (top priority)
('home-videos', 'Home Videos', 'home-video', 'Video', 'Personal family videos and home movies', TRUE, 1),
('photos', 'Photos', 'photo', 'Image', 'Family photos and memories', TRUE, 2),
-- Standard media
('movies', 'Movies', 'movie', 'Film', 'Feature films and movies', TRUE, 10),
('tv-shows', 'TV Shows', 'tv-show', 'Tv', 'Television series and episodes', TRUE, 11),
('music', 'Music', 'music', 'Music', 'Music albums and tracks', TRUE, 12)
ON CONFLICT (id) DO NOTHING;

-- Insert popular streaming services
INSERT INTO streaming_services (id, name, website_url, base_price, countries) VALUES
('netflix', 'Netflix', 'https://netflix.com', 15.49, ARRAY['US', 'CA', 'UK', 'AU']),
('hulu', 'Hulu', 'https://hulu.com', 7.99, ARRAY['US']),
('disney-plus', 'Disney+', 'https://disneyplus.com', 7.99, ARRAY['US', 'CA', 'UK', 'AU']),
('hbo-max', 'HBO Max', 'https://hbomax.com', 15.99, ARRAY['US']),
('amazon-prime', 'Amazon Prime Video', 'https://amazon.com/primevideo', 8.99, ARRAY['US', 'CA', 'UK', 'AU']),
('apple-tv', 'Apple TV+', 'https://tv.apple.com', 6.99, ARRAY['US', 'CA', 'UK', 'AU'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPLETE! DATABASE READY FOR JAVARI OMNI MEDIA
-- ============================================================================
