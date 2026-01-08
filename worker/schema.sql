-- Projects table for storing project metadata
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index for faster listing by updated_at
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
