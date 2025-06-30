-- Add GIN index for fast containment queries on tag_ids
CREATE INDEX IF NOT EXISTS idx_tournaments_tag_ids
  ON tournaments
  USING gin (tag_ids jsonb_path_ops);

-- Add comments to document the new column
COMMENT ON COLUMN tournaments.tag_ids IS 'Hierarchical capability tag IDs (leaf nodes from taxonomy)';
COMMENT ON COLUMN tournaments.tags IS 'Legacy free-text tags (maintained for backward compatibility)';