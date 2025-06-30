CREATE TABLE "elo_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"snapshot_date" timestamp with time zone NOT NULL,
	"global_scores" jsonb NOT NULL,
	"tag_scores" jsonb NOT NULL,
	"model_metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "router_execution_results" (
	"id" text PRIMARY KEY NOT NULL,
	"execution_id" text NOT NULL,
	"original_prompt" text NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"analysis_result" jsonb NOT NULL,
	"single_model_recommendation" jsonb NOT NULL,
	"optimized_workflow" jsonb NOT NULL,
	"single_result" jsonb,
	"workflow_result" jsonb,
	"intermediate_results" jsonb DEFAULT '[]' NOT NULL,
	"comparison_data" jsonb,
	"elo_snapshot" jsonb NOT NULL,
	"total_execution_time" integer NOT NULL,
	"router_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"share_token" text
);
--> statement-breakpoint
DROP INDEX "model_tag_scores_unique_idx";--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "elo_score" integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "matches_played" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "wins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "losses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "router_execution_results" ADD CONSTRAINT "router_execution_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "elo_snapshots_date_idx" ON "elo_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "router_results_execution_id_idx" ON "router_execution_results" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "router_results_completed_at_idx" ON "router_execution_results" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "router_results_user_id_idx" ON "router_execution_results" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "router_results_share_token_idx" ON "router_execution_results" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "idx_models_elo" ON "models" USING btree ("elo_score");--> statement-breakpoint
ALTER TABLE "model_tag_scores" ADD CONSTRAINT "model_tag_scores_model_id_tag_id_unique" UNIQUE("model_id","tag_id");