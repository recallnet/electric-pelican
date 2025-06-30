-- Rename elo_snapshot column to model_elo_data in router_execution_results
ALTER TABLE "router_execution_results" RENAME COLUMN "elo_snapshot" TO "model_elo_data";

-- Drop the unused elo_snapshots table since we simplified the approach
DROP TABLE IF EXISTS "elo_snapshots";