-- SoulQuad PostgreSQL Migration Script
-- Run this script to update database schema for all new features

-- Connect to the database and run:
-- psql -U postgres -d soulquad -f migrate.sql

-- ============================================
-- MIGRATIONS FOR USERS TABLE
-- ============================================

-- Add height column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'height') THEN
    ALTER TABLE users ADD COLUMN height INTEGER DEFAULT 0;
    RAISE NOTICE 'Added height column to users';
  ELSE
    RAISE NOTICE 'height column already exists in users';
  END IF;
END $$;

-- Add education column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'education') THEN
    ALTER TABLE users ADD COLUMN education VARCHAR(50) DEFAULT '';
    RAISE NOTICE 'Added education column to users';
  ELSE
    RAISE NOTICE 'education column already exists in users';
  END IF;
END $$;

-- Add occupation column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'occupation') THEN
    ALTER TABLE users ADD COLUMN occupation VARCHAR(100) DEFAULT '';
    RAISE NOTICE 'Added occupation column to users';
  ELSE
    RAISE NOTICE 'occupation column already exists in users';
  END IF;
END $$;

-- Add annual_income column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'annual_income') THEN
    ALTER TABLE users ADD COLUMN annual_income INTEGER DEFAULT 0;
    RAISE NOTICE 'Added annual_income column to users';
  ELSE
    RAISE NOTICE 'annual_income column already exists in users';
  END IF;
END $$;

-- ============================================
-- MIGRATIONS FOR MOMENTS TABLE
-- ============================================

-- Add is_anonymous column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moments' AND column_name = 'is_anonymous') THEN
    ALTER TABLE moments ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_anonymous column to moments';
  ELSE
    RAISE NOTICE 'is_anonymous column already exists in moments';
  END IF;
END $$;

-- Add anonymous_name column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moments' AND column_name = 'anonymous_name') THEN
    ALTER TABLE moments ADD COLUMN anonymous_name VARCHAR(50) DEFAULT '';
    RAISE NOTICE 'Added anonymous_name column to moments';
  ELSE
    RAISE NOTICE 'anonymous_name column already exists in moments';
  END IF;
END $$;

-- ============================================
-- CREATE MOMENT_LIKES TABLE IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS moment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(moment_id, user_id)
);

-- ============================================
-- CREATE MOMENT_COMMENTS TABLE IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS moment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_moment_likes_moment ON moment_likes(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_likes_user ON moment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_moment_comments_moment ON moment_comments(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_comments_user ON moment_comments(user_id);

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Checking users table columns:';
  RAISE NOTICE '  - height: %', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'height');
  RAISE NOTICE '  - education: %', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'education');
  RAISE NOTICE '  - occupation: %', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'occupation');
  RAISE NOTICE '  - annual_income: %', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'annual_income');
  RAISE NOTICE '';
  RAISE NOTICE 'Checking moments table columns:';
  RAISE NOTICE '  - is_anonymous: %', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'moments' AND column_name = 'is_anonymous');
  RAISE NOTICE '  - anonymous_name: %', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'moments' AND column_name = 'anonymous_name');
  RAISE NOTICE '';
  RAISE NOTICE 'Checking moment_likes table: %', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_likes');
  RAISE NOTICE 'Checking moment_comments table: %', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_comments');
END $$;