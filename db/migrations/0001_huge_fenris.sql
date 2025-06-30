CREATE TABLE "model_tag_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"elo_score" integer DEFAULT 1200 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "model_tag_scores_unique_idx" ON "model_tag_scores" USING btree ("model_id","tag_id");--> statement-breakpoint
CREATE INDEX "model_tag_scores_model_id_idx" ON "model_tag_scores" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "model_tag_scores_tag_id_idx" ON "model_tag_scores" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "model_tag_scores_elo_idx" ON "model_tag_scores" USING btree ("elo_score");--> statement-breakpoint
CREATE INDEX "model_tag_scores_composite_idx" ON "model_tag_scores" USING btree ("tag_id","elo_score");