-- =====================================================
-- JAVARI OMNI-MEDIA DATABASE SCHEMA
-- Supabase PostgreSQL Schema
-- Created: February 17, 2026
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Media Items table (main catalog)
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('movie', 'tv_episode', 'music', 'photo', 'comic', 'magazine', 'ebook', 'document')),
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}',
  watch_progress JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage Locations table
CREATE TABLE storage_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('onedrive', 'google-drive', 'amazon-photos', 'dropbox', 'icloud', 'backblaze-b2', 'local-nas')),
  credentials JSONB NOT NULL,
  quota_total BIGINT,
  quota_used BIGINT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Devices table
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  physical_device_id VARCHAR(255) UNIQUE NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('phone', 'tablet', 'tv', 'computer', 'other')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Virtual Devices table (for device virtualization)
CREATE TABLE virtual_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  service VARCHAR(50) NOT NULL,
  virtual_device_id VARCHAR(255) UNIQUE NOT NULL,
  active_sessions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload Progress table (for tracking uploads)
CREATE TABLE upload_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('uploading', 'processing', 'complete', 'error')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization History table
CREATE TABLE optimization_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  optimization_type VARCHAR(50) NOT NULL,
  files_processed INTEGER DEFAULT 0,
  space_saved BIGINT DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'complete', 'error'))
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_media_items_user_id ON media_items(user_id);
CREATE INDEX idx_media_items_type ON media_items(type);
CREATE INDEX idx_media_items_title ON media_items USING gin(to_tsvector('english', title));
CREATE INDEX idx_media_items_metadata ON media_items USING gin(metadata);

CREATE INDEX idx_storage_locations_user_id ON storage_locations(user_id);
CREATE INDEX idx_storage_locations_provider ON storage_locations(provider);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_physical_id ON user_devices(physical_device_id);

CREATE INDEX idx_virtual_devices_user_id ON virtual_devices(user_id);
CREATE INDEX idx_virtual_devices_service ON virtual_devices(service);

CREATE INDEX idx_upload_progress_user_id ON upload_progress(user_id);
CREATE INDEX idx_upload_progress_status ON upload_progress(status);

CREATE INDEX idx_optimization_history_user_id ON optimization_history(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_history ENABLE ROW LEVEL SECURITY;

-- Media Items policies
CREATE POLICY "Users can view their own media items"
  ON media_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media items"
  ON media_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media items"
  ON media_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media items"
  ON media_items FOR DELETE
  USING (auth.uid() = user_id);

-- Storage Locations policies
CREATE POLICY "Users can view their own storage locations"
  ON storage_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own storage locations"
  ON storage_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own storage locations"
  ON storage_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own storage locations"
  ON storage_locations FOR DELETE
  USING (auth.uid() = user_id);

-- User Devices policies
CREATE POLICY "Users can view their own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON user_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON user_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Virtual Devices policies
CREATE POLICY "Users can view their own virtual devices"
  ON virtual_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own virtual devices"
  ON virtual_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own virtual devices"
  ON virtual_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own virtual devices"
  ON virtual_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Upload Progress policies
CREATE POLICY "Users can view their own upload progress"
  ON upload_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own upload progress"
  ON upload_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload progress"
  ON upload_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Optimization History policies
CREATE POLICY "Users can view their own optimization history"
  ON optimization_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimization history"
  ON optimization_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_media_items_updated_at
    BEFORE UPDATE ON media_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_locations_updated_at
    BEFORE UPDATE ON storage_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_devices_updated_at
    BEFORE UPDATE ON virtual_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_progress_updated_at
    BEFORE UPDATE ON upload_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS
-- Instructions: Run these in Supabase Dashboard > Storage
-- =====================================================

/*
Create the following storage buckets with these settings:

1. movies
   - Public: false
   - File size limit: 10GB
   - Allowed MIME types: video/*

2. tv-shows
   - Public: false
   - File size limit: 5GB
   - Allowed MIME types: video/*

3. music
   - Public: false
   - File size limit: 500MB
   - Allowed MIME types: audio/*

4. photos
   - Public: false
   - File size limit: 100MB
   - Allowed MIME types: image/*

5. comics
   - Public: false
   - File size limit: 500MB
   - Allowed MIME types: application/*, image/*

6. magazines
   - Public: false
   - File size limit: 500MB
   - Allowed MIME types: application/pdf

7. ebooks
   - Public: false
   - File size limit: 100MB
   - Allowed MIME types: application/epub+zip, application/pdf, application/*

8. documents
   - Public: false
   - File size limit: 100MB
   - Allowed MIME types: */*

9. temp-uploads
   - Public: false
   - File size limit: 10GB
   - Allowed MIME types: */*
   - Auto-delete: 24 hours
*/

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- None needed - tables will be populated as users use the app

-- =====================================================
-- NOTES
-- =====================================================

/*
To run this schema:
1. Copy this entire file
2. Go to Supabase Dashboard > SQL Editor
3. Paste and run
4. Create storage buckets manually in Storage section
5. Configure bucket policies to allow authenticated users to upload/download their own files
*/
