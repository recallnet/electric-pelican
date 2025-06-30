CREATE TABLE "forks" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_tournament_id" text NOT NULL,
	"child_tournament_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_results" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_run_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"winner_model_id" text NOT NULL,
	"loser_model_id" text NOT NULL,
	"winner_score_before" integer NOT NULL,
	"loser_score_before" integer NOT NULL,
	"winner_score_after" integer NOT NULL,
	"loser_score_after" integer NOT NULL,
	"result_type" varchar(20) DEFAULT 'judged' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"global_score" integer DEFAULT 1200 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_scores_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"provider" text NOT NULL,
	"tokens_served" integer DEFAULT 0,
	"is_new" boolean DEFAULT false,
	"capabilities" jsonb NOT NULL,
	"input_modalities" jsonb NOT NULL,
	"output_modalities" jsonb NOT NULL,
	"context_length" integer DEFAULT 0,
	"created" timestamp NOT NULL,
	"last_updated" timestamp NOT NULL,
	"raw_data" jsonb,
	"is_available" boolean DEFAULT true NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_failure_at" timestamp,
	"unavailable_reason" text,
	"marked_unavailable_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tournament_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"version" integer DEFAULT 1,
	"status" varchar(20) DEFAULT 'running',
	"bracket_data" jsonb NOT NULL,
	"winner_model" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"retry_count" integer DEFAULT 0,
	"failure_reason" text
);
--> statement-breakpoint
CREATE TABLE "tournament_upvotes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tournament_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"judge_prompt" text NOT NULL,
	"models" jsonb NOT NULL,
	"judge_model" text NOT NULL,
	"tags" jsonb,
	"tag_ids" jsonb,
	"bracket_size" integer NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"parent_id" text,
	"fork_count" integer DEFAULT 0,
	"version" integer DEFAULT 1,
	"original_id" text,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"privy_id" text NOT NULL,
	"email" text,
	"name" text,
	"display_name" text,
	"avatar_url" text,
	"provider" text,
	"provider_username" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_id_unique" UNIQUE("privy_id")
);
--> statement-breakpoint
ALTER TABLE "forks" ADD CONSTRAINT "forks_parent_tournament_id_tournaments_id_fk" FOREIGN KEY ("parent_tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forks" ADD CONSTRAINT "forks_child_tournament_id_tournaments_id_fk" FOREIGN KEY ("child_tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_tournament_run_id_tournament_runs_id_fk" FOREIGN KEY ("tournament_run_id") REFERENCES "public"."tournament_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_runs" ADD CONSTRAINT "tournament_runs_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_upvotes" ADD CONSTRAINT "tournament_upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_upvotes" ADD CONSTRAINT "tournament_upvotes_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_parent_id_tournaments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_original_id_tournaments_id_fk" FOREIGN KEY ("original_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_results_tournament_run_idx" ON "match_results" USING btree ("tournament_run_id");--> statement-breakpoint
CREATE INDEX "match_results_winner_model_idx" ON "match_results" USING btree ("winner_model_id");--> statement-breakpoint
CREATE INDEX "match_results_loser_model_idx" ON "match_results" USING btree ("loser_model_id");--> statement-breakpoint
CREATE INDEX "match_results_round_idx" ON "match_results" USING btree ("round_number");--> statement-breakpoint
CREATE INDEX "match_results_result_type_idx" ON "match_results" USING btree ("result_type");--> statement-breakpoint
CREATE INDEX "model_scores_model_id_idx" ON "model_scores" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "model_scores_global_score_idx" ON "model_scores" USING btree ("global_score");--> statement-breakpoint
CREATE INDEX "idx_models_provider" ON "models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_models_search" ON "models" USING btree ("name","description","provider","id");--> statement-breakpoint
CREATE INDEX "idx_models_available" ON "models" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_models_failures" ON "models" USING btree ("failure_count","last_failure_at");