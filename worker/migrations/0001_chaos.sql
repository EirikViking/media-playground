-- Projects table (Base Schema)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Chaos items table for public community feed
CREATE TABLE IF NOT EXISTS chaos_items (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  title TEXT,
  created_at TEXT NOT NULL,
  output_key TEXT NOT NULL,
  output_type TEXT NOT NULL,
  output_size INTEGER
);

-- Index for feed listing
CREATE INDEX IF NOT EXISTS idx_chaos_created_at ON chaos_items(created_at DESC);
